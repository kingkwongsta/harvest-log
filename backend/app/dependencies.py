from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models import HarvestLog, HarvestLogCreate, HarvestLogUpdate
from app.database import get_supabase


def get_supabase_client() -> Client:
    """Dependency to get Supabase client"""
    return get_supabase()


async def create_harvest_log_in_db(harvest_log_data: HarvestLogCreate, client: Client) -> HarvestLog:
    """Create a new harvest log in Supabase"""
    # Convert Pydantic model to dict for Supabase
    data = harvest_log_data.model_dump()
    
    # Convert datetime to ISO string for Supabase
    if data.get('harvest_date'):
        data['harvest_date'] = data['harvest_date'].isoformat()
    
    # Insert into Supabase
    result = client.table("harvest_logs").insert(data).execute()
    
    if result.data:
        # Convert back to HarvestLog model
        log_data = result.data[0]
        return HarvestLog(**log_data)
    else:
        raise Exception("Failed to create harvest log")


async def get_all_harvest_logs_from_db(client: Client) -> List[HarvestLog]:
    """Get all harvest logs from Supabase"""
    result = client.table("harvest_logs").select("*").order("created_at", desc=True).execute()
    
    if result.data:
        return [HarvestLog(**log_data) for log_data in result.data]
    return []


async def get_harvest_log_by_id_from_db(log_id: UUID, client: Client) -> Optional[HarvestLog]:
    """Get a harvest log by ID from Supabase"""
    result = client.table("harvest_logs").select("*").eq("id", str(log_id)).execute()
    
    if result.data and len(result.data) > 0:
        return HarvestLog(**result.data[0])
    return None


async def update_harvest_log_in_db(log_id: UUID, harvest_log_update: HarvestLogUpdate, client: Client) -> Optional[HarvestLog]:
    """Update a harvest log in Supabase"""
    # Convert Pydantic model to dict, excluding unset fields
    update_data = harvest_log_update.model_dump(exclude_unset=True)
    
    # Convert datetime to ISO string for Supabase if present
    if update_data.get('harvest_date'):
        update_data['harvest_date'] = update_data['harvest_date'].isoformat()
    
    if not update_data:
        # No fields to update
        return await get_harvest_log_by_id_from_db(log_id, client)
    
    # Update in Supabase
    result = client.table("harvest_logs").update(update_data).eq("id", str(log_id)).execute()
    
    if result.data and len(result.data) > 0:
        return HarvestLog(**result.data[0])
    return None


async def delete_harvest_log_from_db(log_id: UUID, client: Client) -> Optional[HarvestLog]:
    """Delete a harvest log from Supabase"""
    # Get the log first
    log = await get_harvest_log_by_id_from_db(log_id, client)
    if not log:
        return None
    
    # Delete from Supabase
    result = client.table("harvest_logs").delete().eq("id", str(log_id)).execute()
    
    # Return the deleted log
    return log 