"""
Error handlers for standardized error responses.

This module provides global exception handlers to ensure consistent error response
formats throughout the FastAPI application.
"""

import logging
import traceback
from typing import Union, Dict, Any
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .exceptions import BaseAPIException

logger = logging.getLogger(__name__)


class ErrorResponse:
    """Standardized error response format."""
    
    @staticmethod
    def create_error_response(
        error_code: str,
        message: str,
        details: Union[str, Dict[str, Any], None] = None,
        status_code: int = 500
    ) -> Dict[str, Any]:
        """Create a standardized error response."""
        response = {
            "error": {
                "code": error_code,
                "message": message,
                "status_code": status_code
            }
        }
        
        if details:
            response["error"]["details"] = details
            
        return response


async def base_api_exception_handler(request: Request, exc: BaseAPIException) -> JSONResponse:
    """Handle custom BaseAPIException instances."""
    logger.error(
        f"API Exception: {exc.error_code}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "detail": exc.detail,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse.create_error_response(
            error_code=exc.error_code or "API_ERROR",
            message=exc.detail,
            status_code=exc.status_code
        ),
        headers=exc.headers
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle standard FastAPI HTTPException instances."""
    logger.error(
        f"HTTP Exception: {exc.status_code}",
        extra={
            "status_code": exc.status_code,
            "detail": exc.detail,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse.create_error_response(
            error_code="HTTP_ERROR",
            message=str(exc.detail),
            status_code=exc.status_code
        ),
        headers=exc.headers
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors."""
    logger.warning(
        f"Validation Error: {len(exc.errors())} errors",
        extra={
            "validation_errors": exc.errors(),
            "path": request.url.path,
            "method": request.method
        }
    )
    
    # Format validation errors for better readability
    formatted_errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        formatted_errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=422,
        content=ErrorResponse.create_error_response(
            error_code="VALIDATION_ERROR",
            message="Input validation failed",
            details={"validation_errors": formatted_errors},
            status_code=422
        )
    )


async def pydantic_validation_exception_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle Pydantic ValidationError instances."""
    logger.warning(
        f"Pydantic Validation Error: {len(exc.errors())} errors",
        extra={
            "validation_errors": exc.errors(),
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=422,
        content=ErrorResponse.create_error_response(
            error_code="VALIDATION_ERROR",
            message="Data validation failed",
            details={"validation_errors": exc.errors()},
            status_code=422
        )
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.error(
        f"Unexpected error: {type(exc).__name__}",
        extra={
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "path": request.url.path,
            "method": request.method,
            "traceback": traceback.format_exc()
        }
    )
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse.create_error_response(
            error_code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred",
            status_code=500
        )
    )