# source venv/bin/activate
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import harvest_logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    print(f"Starting {settings.app_name} v{settings.app_version}")
    yield
    # Shutdown
    print(f"Shutting down {settings.app_name}")


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
            "name": "health",
            "description": "Application health check endpoints",
        },
    ],
    lifespan=lifespan,
    debug=settings.debug
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

# Include routers
app.include_router(harvest_logs.router)


@app.get(
    "/",
    tags=["health"],
    summary="Health check",
    description="Basic health check endpoint to verify the API is running."
)
async def root():
    """
    Health check endpoint.
    
    Returns basic information about the API status.
    """
    return {
        "message": f"{settings.app_name} is running",
        "version": settings.app_version,
        "status": "healthy"
    }


@app.get(
    "/health",
    tags=["health"],
    summary="Detailed health check",
    description="Detailed health check with system information."
)
async def health_check():
    """
    Detailed health check endpoint.
    
    Returns comprehensive information about the API health and status.
    """
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "debug_mode": settings.debug,
        "message": "All systems operational"
    } 