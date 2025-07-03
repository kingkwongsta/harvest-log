from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import date

from app.weather import get_weather_data, Coordinates
from app.plant_models import WeatherData
from app.geocoding import geocode_location, get_default_location, GeocodingResult
from app.logging_config import get_api_logger
from app.plant_models import ErrorResponse

logger = get_api_logger()

router = APIRouter(
    prefix="/api/v1/weather",
    tags=["weather"],
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)


@router.get(
    "",
    response_model=dict,
    summary="Get weather data",
    description="Get weather data for given coordinates and optional date."
)
@router.get(
    "/",
    response_model=dict,
    summary="Get weather data",
    description="Get weather data for given coordinates and optional date."
)
async def get_weather(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    event_date: Optional[str] = Query(None, description="Event date in YYYY-MM-DD format")
) -> dict:
    """
    Get weather data for the specified coordinates and date.
    
    - **latitude**: Latitude coordinate (-90 to 90)
    - **longitude**: Longitude coordinate (-180 to 180)
    - **event_date**: Optional date in YYYY-MM-DD format (defaults to today)
    
    Returns daily min/max temperatures in Fahrenheit, humidity, weather conditions, and precipitation data.
    """
    try:
        logger.info(f"API: Fetching weather data for lat: {latitude}, lon: {longitude}, date: {event_date}")
        
        # Parse event date if provided
        parsed_date = None
        if event_date:
            try:
                parsed_date = date.fromisoformat(event_date)
            except ValueError:
                raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Create coordinates object
        coords = Coordinates(latitude=latitude, longitude=longitude)
        
        # Fetch weather data
        weather_data = await get_weather_data(coords, parsed_date)
        
        if not weather_data:
            raise HTTPException(status_code=503, detail="Weather data unavailable")
        
        logger.info(f"API: Successfully retrieved weather data for lat: {latitude}, lon: {longitude}")
        
        return {
            "success": True,
            "message": "Weather data retrieved successfully",
            "data": weather_data.model_dump()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Failed to retrieve weather data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve weather data")


@router.get(
    "/geocode",
    response_model=dict,
    summary="Geocode location to coordinates",
    description="Convert a city name, zip code, or address to GPS coordinates for weather data."
)
async def geocode_location_endpoint(
    location: str = Query(..., description="Location to geocode (city, zip code, or address)")
) -> dict:
    """
    Geocode a location string to GPS coordinates.
    
    - **location**: Location string (e.g., "Torrance, CA", "90503", "New York")
    
    Returns coordinates and formatted location information.
    """
    try:
        logger.info(f"API: Geocoding location: {location}")
        
        result = await geocode_location(location)
        
        if not result:
            raise HTTPException(status_code=404, detail=f"Location '{location}' not found")
        
        logger.info(f"API: Successfully geocoded '{location}' to {result.coordinates.latitude}, {result.coordinates.longitude}")
        
        return {
            "success": True,
            "message": "Location geocoded successfully",
            "data": result.model_dump()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Failed to geocode location '{location}': {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to geocode location")


@router.get(
    "/default-location",
    response_model=dict,
    summary="Get default location coordinates",
    description="Get the default location (Torrance, CA) coordinates."
)
async def get_default_location_endpoint() -> dict:
    """
    Get the default location coordinates for Torrance, CA.
    
    Returns pre-configured default location information.
    """
    try:
        logger.info("API: Getting default location (Torrance, CA)")
        
        result = await get_default_location()
        
        if not result:
            raise HTTPException(status_code=503, detail="Default location geocoding failed")
        
        logger.info(f"API: Default location retrieved: {result.coordinates.latitude}, {result.coordinates.longitude}")
        
        return {
            "success": True,
            "message": "Default location retrieved successfully",
            "data": result.model_dump()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Failed to get default location: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get default location")