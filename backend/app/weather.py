
import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.logging_config import get_api_logger

logger = get_api_logger()

class WeatherData(BaseModel):
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Relative humidity in percent")
    weather_code: int = Field(..., description="WMO weather interpretation code")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    
    class Config:
        from_attributes = True

class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

async def get_weather_data(coords: Coordinates) -> Optional[WeatherData]:
    """
    Fetches weather data from Open-Meteo API for the given coordinates.
    """
    if not coords:
        return None

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": coords.latitude,
        "longitude": coords.longitude,
        "current_weather": "true",
        "hourly": "relativehumidity_2m",
        "timezone": "auto"
    }

    try:
        async with httpx.AsyncClient() as client:
            logger.info(f"Fetching weather data for lat: {coords.latitude}, lon: {coords.longitude}")
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            current = data.get("current_weather")
            if not current:
                logger.warning("No current_weather data in Open-Meteo response")
                return None

            # Find the current hour's humidity from the hourly forecast
            now_iso = current.get("time")
            hourly_data = data.get("hourly", {})
            time_points = hourly_data.get("time", [])
            humidity_points = hourly_data.get("relativehumidity_2m", [])
            
            current_humidity = None
            if now_iso in time_points:
                idx = time_points.index(now_iso)
                if idx < len(humidity_points):
                    current_humidity = humidity_points[idx]

            if current_humidity is None:
                logger.warning("Could not determine current humidity")
                # Fallback or decide what to do
                current_humidity = 0 # Default value

            weather_data = WeatherData(
                temperature=current.get("temperature"),
                weather_code=current.get("weathercode"),
                wind_speed=current.get("windspeed"),
                humidity=current_humidity
            )
            logger.info(f"Successfully fetched weather data: {weather_data.model_dump_json()}")
            return weather_data

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching weather data: {e.response.status_code} - {e.response.text}")
        # Don't re-raise, just return None. Failing to get weather should not block event creation.
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred fetching weather data: {e}", exc_info=True)
        return None
