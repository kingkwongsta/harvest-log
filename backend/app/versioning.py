"""
API versioning utilities for the harvest log application.

This module provides versioning support for FastAPI endpoints to maintain
backward compatibility and enable smooth API evolution.
"""

from typing import Optional, Dict, Any, Callable
from enum import Enum
from fastapi import Request, HTTPException
from fastapi.routing import APIRoute


class APIVersion(str, Enum):
    """API version enumeration."""
    V1 = "v1"
    V2 = "v2"


class VersionedAPIRoute(APIRoute):
    """Custom APIRoute that supports versioning."""
    
    def __init__(self, *args, version: Optional[APIVersion] = None, **kwargs):
        super().__init__(*args, **kwargs)
        self.version = version or APIVersion.V1


def get_api_version(request: Request) -> APIVersion:
    """
    Extract API version from request.
    
    Supports version detection from:
    1. URL path (e.g., /v1/api/harvest-logs)
    2. Accept header (e.g., Accept: application/vnd.api+json;version=1)
    3. X-API-Version header
    4. Query parameter (e.g., ?version=v1)
    
    Args:
        request: FastAPI request object
    
    Returns:
        API version, defaults to V1
    """
    # Check URL path first
    path_parts = request.url.path.split('/')
    if len(path_parts) > 1 and path_parts[1].startswith('v'):
        version_str = path_parts[1]
        if version_str == "v1":
            return APIVersion.V1
        elif version_str == "v2":
            return APIVersion.V2
    
    # Check X-API-Version header
    version_header = request.headers.get("X-API-Version")
    if version_header:
        if version_header.lower() in ["v1", "1"]:
            return APIVersion.V1
        elif version_header.lower() in ["v2", "2"]:
            return APIVersion.V2
    
    # Check Accept header
    accept_header = request.headers.get("Accept", "")
    if "version=1" in accept_header:
        return APIVersion.V1
    elif "version=2" in accept_header:
        return APIVersion.V2
    
    # Check query parameter
    version_param = request.query_params.get("version")
    if version_param:
        if version_param.lower() in ["v1", "1"]:
            return APIVersion.V1
        elif version_param.lower() in ["v2", "2"]:
            return APIVersion.V2
    
    # Default to V1
    return APIVersion.V1


def version_handler(min_version: APIVersion = APIVersion.V1, max_version: APIVersion = APIVersion.V2):
    """
    Decorator for version-specific endpoint handling.
    
    Args:
        min_version: Minimum supported version
        max_version: Maximum supported version
    """
    def decorator(func: Callable):
        async def wrapper(request: Request, *args, **kwargs):
            current_version = get_api_version(request)
            
            # Check version compatibility
            if current_version.value < min_version.value or current_version.value > max_version.value:
                raise HTTPException(
                    status_code=400,
                    detail=f"API version {current_version} not supported. "
                           f"Supported versions: {min_version.value} to {max_version.value}"
                )
            
            # Add version to request state
            request.state.api_version = current_version
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def deprecated_endpoint(deprecated_in: APIVersion, removed_in: Optional[APIVersion] = None, 
                       alternative: Optional[str] = None):
    """
    Mark endpoint as deprecated.
    
    Args:
        deprecated_in: Version where endpoint was deprecated
        removed_in: Version where endpoint will be removed
        alternative: Suggested alternative endpoint
    """
    def decorator(func: Callable):
        async def wrapper(request: Request, *args, **kwargs):
            current_version = get_api_version(request)
            
            # Add deprecation warning headers
            warning_msg = f"Endpoint deprecated in version {deprecated_in.value}"
            if removed_in:
                warning_msg += f", will be removed in {removed_in.value}"
            if alternative:
                warning_msg += f". Use {alternative} instead"
            
            # Execute original function
            response = await func(request, *args, **kwargs)
            
            # Add deprecation headers to response
            if hasattr(response, 'headers'):
                response.headers["X-API-Deprecation"] = "true"
                response.headers["X-API-Deprecation-Info"] = warning_msg
                if removed_in:
                    response.headers["X-API-Sunset"] = removed_in.value
            
            return response
        
        return wrapper
    return decorator


class VersionedResponse:
    """Helper for creating version-specific responses."""
    
    @staticmethod
    def format_harvest_log_v1(data: Dict[str, Any]) -> Dict[str, Any]:
        """Format harvest log response for API v1."""
        return {
            "id": data.get("id"),
            "crop_name": data.get("crop_name"),
            "quantity": data.get("quantity"),
            "unit": data.get("unit"),
            "harvest_date": data.get("harvest_date"),
            "location": data.get("location"),
            "notes": data.get("notes"),
            "created_at": data.get("created_at"),
            "updated_at": data.get("updated_at"),
            "images": data.get("images", [])
        }
    
    @staticmethod
    def format_harvest_log_v2(data: Dict[str, Any]) -> Dict[str, Any]:
        """Format harvest log response for API v2 (enhanced format)."""
        v1_data = VersionedResponse.format_harvest_log_v1(data)
        
        # Add v2-specific enhancements
        v1_data.update({
            "metadata": {
                "total_images": len(data.get("images", [])),
                "has_location": bool(data.get("location")),
                "has_notes": bool(data.get("notes"))
            },
            "links": {
                "self": f"/v2/api/harvest-logs/{data.get('id')}",
                "images": f"/v2/api/harvest-logs/{data.get('id')}/images"
            }
        })
        
        return v1_data
    
    @staticmethod
    def format_response_by_version(data: Dict[str, Any], version: APIVersion) -> Dict[str, Any]:
        """Format response based on API version."""
        if version == APIVersion.V1:
            return VersionedResponse.format_harvest_log_v1(data)
        elif version == APIVersion.V2:
            return VersionedResponse.format_harvest_log_v2(data)
        else:
            # Default to v1
            return VersionedResponse.format_harvest_log_v1(data)


def create_versioned_router(prefix: str, version: APIVersion, **kwargs):
    """Create a versioned API router."""
    from fastapi import APIRouter
    
    versioned_prefix = f"/{version.value}{prefix}"
    router = APIRouter(prefix=versioned_prefix, **kwargs)
    
    # Add version metadata to router
    router.version = version
    
    return router


# Version compatibility matrix
VERSION_COMPATIBILITY = {
    APIVersion.V1: {
        "supported": True,
        "deprecated": False,
        "sunset_date": None,
        "features": ["basic_crud", "image_upload", "statistics"]
    },
    APIVersion.V2: {
        "supported": True,
        "deprecated": False,
        "sunset_date": None,
        "features": ["basic_crud", "image_upload", "statistics", "pagination", "enhanced_metadata", "links"]
    }
}


def get_version_info() -> Dict[str, Any]:
    """Get information about supported API versions."""
    return {
        "current_version": APIVersion.V2.value,
        "supported_versions": [v.value for v in APIVersion],
        "compatibility": VERSION_COMPATIBILITY,
        "documentation": {
            APIVersion.V1.value: "/docs",
            APIVersion.V2.value: "/v2/docs"
        }
    }