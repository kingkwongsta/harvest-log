
import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, date

from app.logging_config import get_api_logger

logger = get_api_logger()

class WeatherData(BaseModel):
    temperature_min: float = Field(..., description="Minimum temperature for the day in Celsius")
    temperature_max: float = Field(..., description="Maximum temperature for the day in Celsius")
    humidity: float = Field(..., description="Relative humidity in percent")
    weather_code: int = Field(..., description="WMO weather interpretation code")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    precipitation: float = Field(default=0.0, description="Precipitation sum in mm")
    
    # Computed property for average temperature
    @property
    def temperature_avg(self) -> float:
        return (self.temperature_min + self.temperature_max) / 2
    
    class Config:
        from_attributes = True

class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

async def get_weather_data(coords: Coordinates, event_date: Optional[date] = None) -> Optional[WeatherData]:
    """
    Fetches daily weather data from Open-Meteo API for the given coordinates and date.
    Uses daily min/max temperatures instead of current temperature for better harvest logging.
    
    Args:
        coords: Latitude and longitude coordinates
        event_date: Date of the event (defaults to today)
    """
    if not coords:
        return None

    if event_date is None:
        event_date = date.today()
    
    # Determine if we need historical or forecast data
    today = date.today()
    if event_date <= today:
        # Use historical/archive API for past dates (including today)
        url = "https://api.open-meteo.com/v1/forecast"
    else:
        # Use forecast API for future dates
        url = "https://api.open-meteo.com/v1/forecast"
    
    params = {
        "latitude": coords.latitude,
        "longitude": coords.longitude,
        "daily": "temperature_2m_min,temperature_2m_max,precipitation_sum,weathercode",
        "current_weather": "true",  # Still need for wind speed
        "hourly": "relativehumidity_2m",
        "start_date": event_date.isoformat(),
        "end_date": event_date.isoformat(),
        "timezone": "auto"
    }

    try:
        async with httpx.AsyncClient() as client:
            logger.info(f"Fetching weather data for lat: {coords.latitude}, lon: {coords.longitude}, date: {event_date}")
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Get daily weather data
            daily_data = data.get("daily")
            if not daily_data:
                logger.warning("No daily weather data in Open-Meteo response")
                return None
            
            # Get current weather for wind speed
            current = data.get("current_weather", {})
            
            # Extract daily values (first index since we're querying single date)
            temperature_min_list = daily_data.get("temperature_2m_min", [])
            temperature_max_list = daily_data.get("temperature_2m_max", [])
            precipitation_list = daily_data.get("precipitation_sum", [])
            weather_code_list = daily_data.get("weathercode", [])
            
            if not all([temperature_min_list, temperature_max_list, weather_code_list]):
                logger.warning("Missing required daily weather data")
                return None
            
            # Get current hour's humidity from hourly data
            current_humidity = 50.0  # Default fallback
            hourly_data = data.get("hourly", {})
            if hourly_data:
                time_points = hourly_data.get("time", [])
                humidity_points = hourly_data.get("relativehumidity_2m", [])
                
                # Find closest time point to now for humidity
                if time_points and humidity_points:
                    try:
                        # Use middle of day humidity as approximation
                        mid_index = len(humidity_points) // 2
                        if mid_index < len(humidity_points):
                            current_humidity = humidity_points[mid_index]
                    except (IndexError, ValueError):
                        pass

            weather_data = WeatherData(
                temperature_min=temperature_min_list[0],
                temperature_max=temperature_max_list[0],
                weather_code=weather_code_list[0],
                wind_speed=current.get("windspeed", 0.0),
                humidity=current_humidity,
                precipitation=precipitation_list[0] if precipitation_list else 0.0
            )
            logger.info(f"Successfully fetched daily weather data: {weather_data.model_dump_json()}")
            return weather_data

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching weather data: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred fetching weather data: {e}", exc_info=True)
        return None
