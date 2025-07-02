import httpx
import time
import asyncio
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.logging_config import get_api_logger
from app.weather import Coordinates

logger = get_api_logger()

# Rate limiting for Nominatim API (max 1 request per second)
_last_geocoding_request = 0.0
_geocoding_lock = asyncio.Lock()

class GeocodingResult(BaseModel):
    """Result from geocoding service"""
    city: str
    state: Optional[str] = None
    country: str
    coordinates: Coordinates
    display_name: str

async def geocode_location(location: str) -> Optional[GeocodingResult]:
    """
    Geocode a location string (city, zip code, address) to coordinates.
    Uses Nominatim (OpenStreetMap) API which is free and doesn't require API keys.
    
    Args:
        location: Location string (e.g., "Torrance, CA", "90503", "New York")
    
    Returns:
        GeocodingResult with coordinates and location details, or None if not found
    """
    if not location or not location.strip():
        return None
    
    # Clean up the location string
    location = location.strip()
    
    # Add country bias for US locations if not specified
    if not any(country in location.lower() for country in ['usa', 'united states', 'us']):
        location = f"{location}, USA"
    
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location,
        "format": "json",
        "limit": 1,
        "addressdetails": 1
    }
    
    headers = {
        "User-Agent": "PlantJourneyApp/1.0 (harvest logging application)"
    }
    
    try:
        # Rate limiting: ensure at least 1 second between requests to respect Nominatim usage policy
        async with _geocoding_lock:
            global _last_geocoding_request
            current_time = time.time()
            time_since_last = current_time - _last_geocoding_request
            
            if time_since_last < 1.0:
                wait_time = 1.0 - time_since_last
                logger.info(f"Rate limiting: waiting {wait_time:.2f}s before geocoding request")
                await asyncio.sleep(wait_time)
            
            _last_geocoding_request = time.time()
        
        async with httpx.AsyncClient() as client:
            logger.info(f"Geocoding location: {location}")
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                logger.warning(f"No geocoding results found for: {location}")
                return None
            
            result = data[0]
            
            # Extract coordinates
            lat = float(result.get("lat"))
            lon = float(result.get("lon"))
            
            # Extract address components
            address = result.get("address", {})
            city = (
                address.get("city") or 
                address.get("town") or 
                address.get("village") or
                address.get("municipality") or
                address.get("suburb") or
                "Unknown"
            )
            
            state = (
                address.get("state") or
                address.get("province") or
                address.get("region")
            )
            
            country = address.get("country", "Unknown")
            display_name = result.get("display_name", location)
            
            geocoding_result = GeocodingResult(
                city=city,
                state=state,
                country=country,
                coordinates=Coordinates(latitude=lat, longitude=lon),
                display_name=display_name
            )
            
            logger.info(f"Successfully geocoded '{location}' to {lat}, {lon}")
            return geocoding_result
            
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error geocoding location '{location}': {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Error geocoding location '{location}': {e}", exc_info=True)
        return None

async def get_default_location() -> Optional[GeocodingResult]:
    """Get the default location (Torrance, CA) coordinates"""
    return await geocode_location("Torrance, CA") 