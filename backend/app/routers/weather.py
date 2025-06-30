from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import date

from app.weather import get_weather_data, Coordinates
from app.plant_models import WeatherData
from app.logging_config import get_api_logger
from app.models import ErrorResponse

logger = get_api_logger()

router = APIRouter(
    prefix="/api/weather",
    tags=["weather"],
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
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
    
    Returns daily min/max temperatures, humidity, weather conditions, and precipitation data.
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