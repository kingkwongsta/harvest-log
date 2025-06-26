from fastapi import APIRouter, HTTPException, Depends, status, Request
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
from app.logging_config import get_api_logger

logger = get_api_logger()

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
    request: Request,
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
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Creating new harvest log for crop '{harvest_log_data.crop_name}'", 
                   extra={"request_id": request_id})
        
        new_log = await create_harvest_log_in_db(harvest_log_data, client)
        
        logger.info(f"API: Successfully created harvest log with ID {new_log.id}", 
                   extra={"request_id": request_id, "record_id": str(new_log.id)})
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log created successfully",
            data=new_log
        )
    except Exception as e:
        logger.error(f"API: Failed to create harvest log: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
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
    request: Request,
    client = Depends(get_supabase_client)
) -> HarvestLogListResponse:
    """
    Get all harvest logs.
    
    Returns a list of all harvest log entries in the system.
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info("API: Retrieving all harvest logs", extra={"request_id": request_id})
        
        logs = await get_all_harvest_logs_from_db(client)
        
        logger.info(f"API: Successfully retrieved {len(logs)} harvest logs", 
                   extra={"request_id": request_id})
        
        return HarvestLogListResponse(
            success=True,
            message=f"Retrieved {len(logs)} harvest logs",
            data=logs,
            total=len(logs)
        )
    except Exception as e:
        logger.error(f"API: Failed to retrieve harvest logs: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
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
    request: Request,
    client = Depends(get_supabase_client)
) -> HarvestLogResponse:
    """
    Get a specific harvest log by ID.
    
    - **log_id**: Unique identifier of the harvest log (UUID format)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Retrieving harvest log with ID {log_id}", 
                   extra={"request_id": request_id, "record_id": str(log_id)})
        
        log = await get_harvest_log_by_id_from_db(log_id, client)
        if not log:
            logger.warning(f"API: Harvest log not found: {log_id}", 
                          extra={"request_id": request_id, "record_id": str(log_id)})
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Harvest log with ID {log_id} not found"
            )
        
        logger.info(f"API: Successfully retrieved harvest log {log_id}", 
                   extra={"request_id": request_id, "record_id": str(log_id)})
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log retrieved successfully",
            data=log
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Failed to retrieve harvest log {log_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(log_id)}, 
                    exc_info=True)
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
    request: Request,
    client = Depends(get_supabase_client)
) -> HarvestLogResponse:
    """
    Update an existing harvest log.
    
    - **log_id**: Unique identifier of the harvest log to update
    - Only provided fields will be updated, others remain unchanged
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Updating harvest log {log_id}", 
                   extra={"request_id": request_id, "record_id": str(log_id)})
        
        updated_log = await update_harvest_log_in_db(log_id, harvest_log_update, client)
        if not updated_log:
            logger.warning(f"API: Harvest log not found for update: {log_id}", 
                          extra={"request_id": request_id, "record_id": str(log_id)})
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Harvest log with ID {log_id} not found"
            )
        
        logger.info(f"API: Successfully updated harvest log {log_id}", 
                   extra={"request_id": request_id, "record_id": str(log_id)})
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log updated successfully",
            data=updated_log
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Failed to update harvest log {log_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(log_id)}, 
                    exc_info=True)
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
    request: Request,
    client = Depends(get_supabase_client)
) -> HarvestLogResponse:
    """
    Delete a harvest log by ID.
    
    - **log_id**: Unique identifier of the harvest log to delete
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Deleting harvest log {log_id}", 
                   extra={"request_id": request_id, "record_id": str(log_id)})
        
        deleted_log = await delete_harvest_log_from_db(log_id, client)
        if not deleted_log:
            logger.warning(f"API: Harvest log not found for deletion: {log_id}", 
                          extra={"request_id": request_id, "record_id": str(log_id)})
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Harvest log with ID {log_id} not found"
            )
        
        logger.info(f"API: Successfully deleted harvest log {log_id}", 
                   extra={"request_id": request_id, "record_id": str(log_id)})
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log deleted successfully",
            data=deleted_log
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Failed to delete harvest log {log_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(log_id)}, 
                    exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete harvest log: {str(e)}"
        ) 