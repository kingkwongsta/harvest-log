# source venv/bin/activate
# pip install -r requirements.txt
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from app.config import settings
from app.routers import images, events, plants, weather, event_images
from app.database import init_supabase, close_supabase, health_check as db_health_check
from app.logging_config import setup_logging, get_app_logger
from app.middleware import LoggingMiddleware, PerformanceMiddleware
from app.dependencies import get_supabase_client
from app.cache import cache_manager
from app.exceptions import BaseAPIException, DatabaseError
from app.error_handlers import (
    base_api_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    pydantic_validation_exception_handler,
    general_exception_handler
)

# Setup logging
setup_logging(
    level=settings.log_level,
    json_logs=settings.json_logs,
    log_file=settings.log_file if settings.log_file else None
)

logger = get_app_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Log level: {settings.log_level}")
    
    # Initialize Supabase connection
    if settings.supabase_url and settings.supabase_service_key:
        try:
            supabase_client = await init_supabase()
            logger.info("✓ Supabase connection initialized")
            
            logger.info("✓ Supabase connection verified")
            
        except Exception as e:
            logger.error(f"⚠ Supabase initialization failed: {e}", exc_info=True)
            logger.error("Please check your SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")
    else:
        logger.warning("⚠ Supabase credentials not found in environment variables")
        logger.warning("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file")
    
    logger.info("✓ Application startup completed")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.app_name}")
    
    # Close database connections
    try:
        await close_supabase()
        logger.info("✓ Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")
    
    logger.info("✓ Application shutdown completed")


# Create FastAPI app with configuration from settings
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="A comprehensive API for managing plant journey and garden data",
    contact={
        "name": "Harvest Log API",
        "email": "support@harvestlog.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "images",
            "description": "Legacy operations for managing harvest images with Supabase Storage",
        },
        {
            "name": "event-images",
            "description": "Unified operations for managing event images (harvest, bloom, snapshot)",
        },
        {
            "name": "plants",
            "description": "Operations for managing plants and varieties",
        },
        {
            "name": "plant-events",
            "description": "Unified operations for managing plant events (harvest, bloom, snapshot)",
        },
        {
            "name": "health",
            "description": "Application health check endpoints",
        },
        {
            "name": "weather",
            "description": "Weather data operations using Open-Meteo API",
        },
    ],
    lifespan=lifespan,
    debug=settings.debug
)

# Add logging middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(PerformanceMiddleware, slow_request_threshold=settings.slow_request_threshold)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

# Add exception handlers
app.add_exception_handler(BaseAPIException, base_api_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(ValidationError, pydantic_validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(images.router)          # Legacy harvest-only image endpoints
app.include_router(event_images.router)    # New unified event image endpoints
app.include_router(plants.router)
app.include_router(events.router)
app.include_router(weather.router)


@app.get(
    "/",
    tags=["health"],
    summary="Health check",
    description="Basic health check endpoint to verify the API is running."
)
async def root(request: Request):
    """
    Health check endpoint.
    
    Returns basic information about the API status.
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info("API: Basic health check requested", extra={"request_id": request_id})
        
        response = {
            "message": f"{settings.app_name} is running",
            "version": settings.app_version,
            "status": "healthy"
        }
        
        logger.debug("API: Health check completed successfully", extra={"request_id": request_id})
        return response
        
    except Exception as e:
        logger.error(f"API: Health check failed: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError("Health check failed")


@app.get(
    "/health",
    tags=["health"],
    summary="Detailed health check",
    description="Detailed health check with system information."
)
async def health_check(request: Request):
    """
    Detailed health check endpoint.
    
    Returns comprehensive information about the API health and status.
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info("API: Detailed health check requested", extra={"request_id": request_id})
        
        supabase_configured = bool(settings.supabase_url and settings.supabase_service_key)
        
        # Perform database health check
        db_status = await db_health_check()
        
        overall_status = "healthy" if db_status["status"] == "healthy" else "degraded"
        
        response = {
            "status": overall_status,
            "app_name": settings.app_name,
            "version": settings.app_version,
            "debug_mode": settings.debug,
            "message": "All systems operational" if overall_status == "healthy" else "Some services degraded",
            "supabase_configured": supabase_configured,
            "database": db_status
        }
        
        logger.info("API: Detailed health check completed successfully", 
                   extra={
                       "request_id": request_id,
                       "supabase_configured": supabase_configured,
                       "debug_mode": settings.debug
                   })
        return response
        
    except Exception as e:
        logger.error(f"API: Detailed health check failed: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError("Detailed health check failed")


 