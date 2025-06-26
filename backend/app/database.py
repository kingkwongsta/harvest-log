from supabase import create_client, Client
from sqlalchemy import create_engine, MetaData, Table, Column, String, Float, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
from typing import Optional

from app.config import settings
from app.logging_config import get_database_logger

logger = get_database_logger()

# Supabase client
supabase: Optional[Client] = None

# SQLAlchemy setup for direct database access if needed
Base = declarative_base()

class HarvestLogTable(Base):
    __tablename__ = "harvest_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_name = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    harvest_date = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_supabase() -> Client:
    """Initialize Supabase client"""
    global supabase
    if not supabase and settings.supabase_url and settings.supabase_service_key:
        logger.info("Initializing Supabase client")
        try:
            supabase = create_client(settings.supabase_url, settings.supabase_service_key)
            logger.info("✓ Supabase client created successfully")
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {e}", exc_info=True)
            raise
    return supabase


def get_supabase() -> Client:
    """Get Supabase client instance"""
    if not supabase:
        logger.debug("Supabase client not initialized, initializing now")
        init_supabase()
    return supabase


async def create_harvest_logs_table():
    """Create the harvest_logs table if it doesn't exist"""
    logger.info("Checking harvest_logs table existence")
    client = get_supabase()
    
    # Check if table exists and create if it doesn't
    try:
        # Try to fetch from table to see if it exists
        logger.debug("Testing harvest_logs table access")
        result = client.table("harvest_logs").select("*").limit(1).execute()
        logger.info("✓ harvest_logs table exists and is accessible")
    except Exception as e:
        # Table doesn't exist, let's create it using SQL
        # Note: In a real application, you would typically use Supabase's SQL editor
        # or migrations to create tables
        logger.warning(f"harvest_logs table may not exist or is inaccessible: {e}")
        logger.info("Please create the harvest_logs table in Supabase SQL editor using the following SQL:")
        sql_script = """
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
        
        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_harvest_logs_updated_at 
            BEFORE UPDATE ON harvest_logs 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
        logger.info(sql_script) 