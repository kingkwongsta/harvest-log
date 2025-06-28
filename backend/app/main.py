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
from app.routers import harvest_logs, images
from app.database import init_supabase, create_harvest_logs_table, close_supabase, health_check as db_health_check
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
            
            # Verify database table accessibility
            await create_harvest_logs_table()
            logger.info("✓ Database tables verified")
            
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
    description="A comprehensive API for managing harvest logs and garden data",
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
            "name": "harvest-logs",
            "description": "Operations for managing harvest log entries",
        },
        {
            "name": "images",
            "description": "Operations for managing harvest images with Supabase Storage",
        },
        {
            "name": "health",
            "description": "Application health check endpoints",
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
app.include_router(harvest_logs.router)
app.include_router(images.router)


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


@app.get(
    "/api/harvest-stats",
    tags=["harvest-logs"],
    summary="Get harvest statistics",
    description="Get statistics about harvests including total, this month, and this week counts."
)
async def get_harvest_stats(
    request: Request,
    client = Depends(get_supabase_client)
):
    """
    Get harvest statistics.
    
    Returns statistics including:
    - Total harvest count
    - This month's harvest count  
    - This week's harvest count
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info("API: Retrieving harvest statistics", extra={"request_id": request_id})
        
        # Try to get from cache first
        cached_stats = await cache_manager.get_harvest_stats()
        if cached_stats:
            logger.debug("API: Returning cached harvest statistics", extra={"request_id": request_id})
            return {
                "success": True,
                "message": "Harvest statistics retrieved successfully (cached)",
                "data": cached_stats
            }
        
        # Get current date info
        now = datetime.now()
        
        # Start of current month
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Start of current week (Monday)
        days_since_monday = now.weekday()
        week_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_since_monday)
        
        logger.debug("API: Querying total harvest count", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_logs",
                        "db_operation": "count"
                    })
        
        # Query total count
        total_response = client.table('harvest_logs').select('id', count='exact').execute()
        total_count = total_response.count or 0
        
        logger.debug("API: Querying monthly harvest count", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_logs",
                        "db_operation": "count",
                        "filter": f"harvest_date >= {month_start.isoformat()}"
                    })
        
        # Query this month count
        month_response = client.table('harvest_logs').select('id', count='exact').gte('harvest_date', month_start.isoformat()).execute()
        month_count = month_response.count or 0
        
        logger.debug("API: Querying weekly harvest count", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_logs",
                        "db_operation": "count",
                        "filter": f"harvest_date >= {week_start.isoformat()}"
                    })
        
        # Query this week count
        week_response = client.table('harvest_logs').select('id', count='exact').gte('harvest_date', week_start.isoformat()).execute()
        week_count = week_response.count or 0
        
        stats = {
            "total_harvests": total_count,
            "this_month": month_count,
            "this_week": week_count
        }
        
        logger.info(f"API: Successfully retrieved harvest stats", 
                   extra={
                       "request_id": request_id,
                       "total_harvests": total_count,
                       "this_month": month_count,
                       "this_week": week_count
                   })
        
        # Cache the stats for 3 minutes
        await cache_manager.set_harvest_stats(stats, ttl=180)
        
        return {
            "success": True,
            "message": "Harvest statistics retrieved successfully",
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"API: Failed to retrieve harvest stats: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve harvest statistics: {str(e)}") 