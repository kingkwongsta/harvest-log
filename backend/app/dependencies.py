from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models import HarvestLog, HarvestLogCreate, HarvestLogUpdate
from app.database import get_supabase
from app.logging_config import get_database_logger

logger = get_database_logger()


def get_supabase_client() -> Client:
    """Dependency to get Supabase client"""
    return get_supabase()


async def create_harvest_log_in_db(harvest_log_data: HarvestLogCreate, client: Client) -> HarvestLog:
    """Create a new harvest log in Supabase"""
    logger.info(f"Creating new harvest log for crop: {harvest_log_data.crop_name}")
    logger.debug(f"Harvest log data: {harvest_log_data.model_dump()}")
    
    try:
        # Convert Pydantic model to dict for Supabase
        data = harvest_log_data.model_dump()
        
        # Convert datetime to ISO string for Supabase
        if data.get('harvest_date'):
            data['harvest_date'] = data['harvest_date'].isoformat()
        
        # Insert into Supabase
        logger.debug("Executing INSERT query on harvest_logs table")
        result = client.table("harvest_logs").insert(data).execute()
        
        if result.data:
            # Convert back to HarvestLog model
            log_data = result.data[0]
            new_log = HarvestLog(**log_data)
            logger.info(f"✓ Successfully created harvest log with ID: {new_log.id}")
            return new_log
        else:
            logger.error("Failed to create harvest log - no data returned")
            raise Exception("Failed to create harvest log")
            
    except Exception as e:
        logger.error(f"Database error creating harvest log: {e}", 
                    extra={"db_operation": "INSERT", "table": "harvest_logs"}, 
                    exc_info=True)
        raise


async def get_all_harvest_logs_from_db(client: Client) -> List[HarvestLog]:
    """Get all harvest logs from Supabase"""
    logger.info("Retrieving all harvest logs")
    
    try:
        logger.debug("Executing SELECT * query on harvest_logs table")
        result = client.table("harvest_logs").select("*").order("created_at", desc=True).execute()
        
        if result.data:
            logs = [HarvestLog(**log_data) for log_data in result.data]
            logger.info(f"✓ Successfully retrieved {len(logs)} harvest logs")
            return logs
        else:
            logger.info("No harvest logs found in database")
            return []
            
    except Exception as e:
        logger.error(f"Database error retrieving harvest logs: {e}", 
                    extra={"db_operation": "SELECT", "table": "harvest_logs"}, 
                    exc_info=True)
        raise


async def get_harvest_log_by_id_from_db(log_id: UUID, client: Client) -> Optional[HarvestLog]:
    """Get a harvest log by ID from Supabase"""
    logger.info(f"Retrieving harvest log by ID: {log_id}")
    
    try:
        logger.debug(f"Executing SELECT query for ID: {log_id}")
        result = client.table("harvest_logs").select("*").eq("id", str(log_id)).execute()
        
        if result.data and len(result.data) > 0:
            log = HarvestLog(**result.data[0])
            logger.info(f"✓ Successfully retrieved harvest log: {log_id}")
            return log
        else:
            logger.info(f"Harvest log not found: {log_id}")
            return None
            
    except Exception as e:
        logger.error(f"Database error retrieving harvest log {log_id}: {e}", 
                    extra={"db_operation": "SELECT", "table": "harvest_logs", "record_id": str(log_id)}, 
                    exc_info=True)
        raise


async def update_harvest_log_in_db(log_id: UUID, harvest_log_update: HarvestLogUpdate, client: Client) -> Optional[HarvestLog]:
    """Update a harvest log in Supabase"""
    logger.info(f"Updating harvest log: {log_id}")
    
    try:
        # Convert Pydantic model to dict, excluding unset fields
        update_data = harvest_log_update.model_dump(exclude_unset=True)
        logger.debug(f"Update data: {update_data}")
        
        # Convert datetime to ISO string for Supabase if present
        if update_data.get('harvest_date'):
            update_data['harvest_date'] = update_data['harvest_date'].isoformat()
        
        if not update_data:
            # No fields to update
            logger.info(f"No fields to update for harvest log: {log_id}")
            return await get_harvest_log_by_id_from_db(log_id, client)
        
        # Update in Supabase
        logger.debug(f"Executing UPDATE query for ID: {log_id}")
        result = client.table("harvest_logs").update(update_data).eq("id", str(log_id)).execute()
        
        if result.data and len(result.data) > 0:
            updated_log = HarvestLog(**result.data[0])
            logger.info(f"✓ Successfully updated harvest log: {log_id}")
            return updated_log
        else:
            logger.warning(f"Harvest log not found for update: {log_id}")
            return None
            
    except Exception as e:
        logger.error(f"Database error updating harvest log {log_id}: {e}", 
                    extra={"db_operation": "UPDATE", "table": "harvest_logs", "record_id": str(log_id)}, 
                    exc_info=True)
        raise


async def delete_harvest_log_from_db(log_id: UUID, client: Client) -> Optional[HarvestLog]:
    """Delete a harvest log from Supabase"""
    logger.info(f"Deleting harvest log: {log_id}")
    
    try:
        # Get the log first
        log = await get_harvest_log_by_id_from_db(log_id, client)
        if not log:
            logger.warning(f"Harvest log not found for deletion: {log_id}")
            return None
        
        # Delete from Supabase
        logger.debug(f"Executing DELETE query for ID: {log_id}")
        result = client.table("harvest_logs").delete().eq("id", str(log_id)).execute()
        
        logger.info(f"✓ Successfully deleted harvest log: {log_id}")
        # Return the deleted log
        return log
        
    except Exception as e:
        logger.error(f"Database error deleting harvest log {log_id}: {e}", 
                    extra={"db_operation": "DELETE", "table": "harvest_logs", "record_id": str(log_id)}, 
                    exc_info=True)
        raise 