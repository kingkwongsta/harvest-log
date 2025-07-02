from supabase import Client
from app.database import get_supabase, get_supabase_async
from app.logging_config import get_database_logger
from app.exceptions import DatabaseError

logger = get_database_logger()


def get_supabase_client() -> Client:
    """Dependency to get Supabase client (synchronous)"""
    try:
        return get_supabase()
    except Exception as e:
        logger.error(f"Failed to get Supabase client: {e}", exc_info=True)
        raise DatabaseError(f"Database connection unavailable: {str(e)}")


def get_db() -> Client:
    """Alternative dependency name for Supabase client"""
    return get_supabase_client()


async def get_async_db():
    """Dependency to get Supabase client (asynchronous)"""
    try:
        return await get_supabase_async()
    except Exception as e:
        logger.error(f"Failed to get async Supabase client: {e}", exc_info=True)
        raise DatabaseError(f"Database connection unavailable: {str(e)}") 