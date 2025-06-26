# source venv/bin/activate
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import harvest_logs
from app.database import init_supabase, create_harvest_logs_table


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    print(f"Starting {settings.app_name} v{settings.app_version}")
    
    # Initialize Supabase connection
    if settings.supabase_url and settings.supabase_anon_key:
        try:
            supabase_client = init_supabase()
            print("✓ Supabase connection initialized")
            
            # Try to create table if it doesn't exist
            await create_harvest_logs_table()
            print("✓ Database table checked/created")
            
        except Exception as e:
            print(f"⚠ Warning: Supabase initialization failed: {e}")
            print("Please check your SUPABASE_URL and SUPABASE_ANON_KEY environment variables")
    else:
        print("⚠ Warning: Supabase credentials not found in environment variables")
        print("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
    
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
        "message": "All systems operational",
        "supabase_configured": bool(settings.supabase_url and settings.supabase_anon_key)
    } 