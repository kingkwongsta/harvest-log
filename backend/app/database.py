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
        # Try a simple query to test the connection
        result = client.table("harvest_logs").select("id").limit(1).execute()
        logger.debug("Database connection test successful")
    except Exception as e:
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


async def create_harvest_logs_table():
    """Check if harvest_logs table exists and is accessible"""
    logger.info("Verifying harvest_logs table accessibility")
    
    try:
        client = await get_supabase_async()
        
        # Try to fetch from table to see if it exists and is accessible
        logger.debug("Testing harvest_logs table access")
        result = client.table("harvest_logs").select("id").limit(1).execute()
        logger.info("✓ harvest_logs table exists and is accessible")
        
    except Exception as e:
        logger.warning(f"harvest_logs table may not exist or is inaccessible: {e}")
        logger.info("Please ensure the harvest_logs table exists in your Supabase database")
        
        # Log the SQL script for reference but don't fail startup
        sql_script = """
-- Create harvest_logs table with proper structure
CREATE TABLE IF NOT EXISTS harvest_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(100) NOT NULL,
    quantity FLOAT NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    harvest_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create harvest_images table for image metadata
CREATE TABLE IF NOT EXISTS harvest_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    harvest_log_id UUID NOT NULL REFERENCES harvest_logs(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    upload_order INTEGER DEFAULT 0,
    public_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_harvest_logs_updated_at 
    BEFORE UPDATE ON harvest_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_images_updated_at 
    BEFORE UPDATE ON harvest_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_harvest_logs_crop_name ON harvest_logs(crop_name);
CREATE INDEX IF NOT EXISTS idx_harvest_logs_harvest_date ON harvest_logs(harvest_date);
CREATE INDEX IF NOT EXISTS idx_harvest_images_harvest_log_id ON harvest_images(harvest_log_id);
CREATE INDEX IF NOT EXISTS idx_harvest_images_upload_order ON harvest_images(harvest_log_id, upload_order);
        """
        logger.debug(f"SQL schema reference:\n{sql_script}")


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
        result = client.table("harvest_logs").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "message": "Database connection successful",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        } 