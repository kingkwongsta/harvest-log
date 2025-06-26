from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from uuid import UUID
from datetime import datetime

from app.models import (
    HarvestLog,
    HarvestLogCreate,
    HarvestLogUpdate,
    HarvestLogResponse,
    HarvestLogListResponse,
    ErrorResponse
)
from app.dependencies import (
    get_supabase_client,
    create_harvest_log_in_db,
    get_all_harvest_logs_from_db,
    get_harvest_log_by_id_from_db,
    update_harvest_log_in_db,
    delete_harvest_log_from_db
)

router = APIRouter(
    prefix="/api/harvest-logs",
    tags=["harvest-logs"],
    responses={
        404: {"model": ErrorResponse, "description": "Harvest log not found"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)


@router.post(
    "/",
    response_model=HarvestLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create harvest log",
    description="Create a new harvest log entry with the provided information."
)
async def create_harvest_log(
    harvest_log_data: HarvestLogCreate,
    client = Depends(get_supabase_client)
) -> HarvestLogResponse:
    """
    Create a new harvest log entry.
    
    - **crop_name**: Name of the crop harvested (required)
    - **quantity**: Quantity harvested (required, must be > 0)  
    - **unit**: Unit of measurement (required)
    - **harvest_date**: Date and time of harvest (required)
    - **location**: Location where crop was harvested (optional)
    - **notes**: Additional notes about the harvest (optional)
    """
    try:
        new_log = await create_harvest_log_in_db(harvest_log_data, client)
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log created successfully",
            data=new_log
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create harvest log: {str(e)}"
        )


@router.get(
    "/",
    response_model=HarvestLogListResponse,
    summary="Get all harvest logs",
    description="Retrieve all harvest log entries."
)
async def get_harvest_logs(
    client = Depends(get_supabase_client)
) -> HarvestLogListResponse:
    """
    Get all harvest logs.
    
    Returns a list of all harvest log entries in the system.
    """
    try:
        logs = await get_all_harvest_logs_from_db(client)
        return HarvestLogListResponse(
            success=True,
            message=f"Retrieved {len(logs)} harvest logs",
            data=logs,
            total=len(logs)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve harvest logs: {str(e)}"
        )


@router.get(
    "/{log_id}",
    response_model=HarvestLogResponse,
    summary="Get harvest log by ID",
    description="Retrieve a specific harvest log by its unique identifier."
)
async def get_harvest_log(
    log_id: UUID,
    client = Depends(get_supabase_client)
) -> HarvestLogResponse:
    """
    Get a specific harvest log by ID.
    
    - **log_id**: Unique identifier of the harvest log (UUID format)
    """
    try:
        log = await get_harvest_log_by_id_from_db(log_id, client)
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Harvest log with ID {log_id} not found"
            )
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log retrieved successfully",
            data=log
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve harvest log: {str(e)}"
        )


@router.put(
    "/{log_id}",
    response_model=HarvestLogResponse,
    summary="Update harvest log",
    description="Update an existing harvest log with new information."
)
async def update_harvest_log(
    log_id: UUID,
    harvest_log_update: HarvestLogUpdate,
    client = Depends(get_supabase_client)
) -> HarvestLogResponse:
    """
    Update an existing harvest log.
    
    - **log_id**: Unique identifier of the harvest log to update
    - Only provided fields will be updated, others remain unchanged
    """
    try:
        updated_log = await update_harvest_log_in_db(log_id, harvest_log_update, client)
        if not updated_log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Harvest log with ID {log_id} not found"
            )
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log updated successfully",
            data=updated_log
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update harvest log: {str(e)}"
        )


@router.delete(
    "/{log_id}",
    response_model=HarvestLogResponse,
    summary="Delete harvest log",
    description="Delete a harvest log entry permanently."
)
async def delete_harvest_log(
    log_id: UUID,
    client = Depends(get_supabase_client)
) -> HarvestLogResponse:
    """
    Delete a harvest log by ID.
    
    - **log_id**: Unique identifier of the harvest log to delete
    """
    try:
        deleted_log = await delete_harvest_log_from_db(log_id, client)
        if not deleted_log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Harvest log with ID {log_id} not found"
            )
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log deleted successfully",
            data=deleted_log
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete harvest log: {str(e)}"
        ) 