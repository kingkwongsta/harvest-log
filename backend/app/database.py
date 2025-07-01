from supabase import create_client, Client
from datetime import datetime
from typing import Optional, Dict, Any
import asyncio
from contextlib import asynccontextmanager

from app.config import settings
from app.logging_config import get_database_logger
from app.exceptions import DatabaseError, ConfigurationError

logger = get_database_logger()

# Supabase client singleton
_supabase_client: Optional[Client] = None
_client_lock = asyncio.Lock()


async def init_supabase() -> Client:
    """Initialize Supabase client with proper error handling and validation"""
    global _supabase_client
    
    async with _client_lock:
        if _supabase_client is not None:
            return _supabase_client
            
        # Validate configuration
        if not settings.supabase_url:
            raise ConfigurationError("SUPABASE_URL is not configured")
        if not settings.supabase_service_key:
            raise ConfigurationError("SUPABASE_SERVICE_KEY is not configured")
        
        logger.info("Initializing Supabase client")
        try:
            _supabase_client = create_client(
                settings.supabase_url, 
                settings.supabase_service_key
            )
            
            # Test connection with a simple query
            await _test_connection(_supabase_client)
            
            logger.info("✓ Supabase client created and tested successfully")
            return _supabase_client
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}", exc_info=True)
            _supabase_client = None
            raise DatabaseError(f"Failed to initialize database connection: {str(e)}")


async def _test_connection(client: Client) -> None:
    """Test the Supabase connection with a simple query"""
    try:
        # Try a simple query to test the connection using plant events
        result = client.table("plant_events").select("id").limit(1).execute()
        logger.debug("Database connection test successful")
    except Exception as e:
        # Don't fail startup if tables don't exist yet - just log a warning
        if "relation" in str(e).lower() and "does not exist" in str(e).lower():
            logger.warning(f"Database tables not found during connection test: {e}")
            logger.warning("This is expected if tables haven't been created yet")
        else:
            logger.error(f"Database connection test failed: {e}")
            raise DatabaseError(f"Database connection test failed: {str(e)}")


def get_supabase() -> Client:
    """Get Supabase client instance (synchronous)"""
    global _supabase_client
    if _supabase_client is None:
        raise DatabaseError("Supabase client not initialized. Call init_supabase() first.")
    return _supabase_client


async def get_supabase_async() -> Client:
    """Get Supabase client instance (asynchronous)"""
    global _supabase_client
    if _supabase_client is None:
        return await init_supabase()
    return _supabase_client


@asynccontextmanager
async def get_db_session():
    """Context manager for database sessions with proper error handling"""
    try:
        client = await get_supabase_async()
        yield client
    except Exception as e:
        logger.error(f"Database session error: {e}", exc_info=True)
        raise DatabaseError(f"Database session error: {str(e)}")


async def close_supabase():
    """Close Supabase client connection"""
    global _supabase_client
    async with _client_lock:
        if _supabase_client is not None:
            logger.info("Closing Supabase client connection")
            # Supabase client doesn't have an explicit close method
            # but we can clean up our reference
            _supabase_client = None
            logger.info("✓ Supabase client connection closed")



# Database utility functions
async def execute_query(query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute a raw SQL query with proper error handling"""
    try:
        client = await get_supabase_async()
        result = client.rpc(query, params or {}).execute()
        return result.data
    except Exception as e:
        logger.error(f"Query execution failed: {e}", exc_info=True)
        raise DatabaseError(f"Query execution failed: {str(e)}")


async def health_check() -> Dict[str, Any]:
    """Perform a database health check"""
    try:
        client = await get_supabase_async()
        
        # Simple query to test connectivity
        result = client.table("plant_events").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "message": "Database connection successful",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}", exc_info=True)
        
        # If tables don't exist, still report as healthy connection but note missing tables
        if "relation" in str(e).lower() and "does not exist" in str(e).lower():
            return {
                "status": "healthy",
                "message": "Database connection successful, but tables need to be created",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        return {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        } 