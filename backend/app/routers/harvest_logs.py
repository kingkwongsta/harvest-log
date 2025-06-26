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
from app.dependencies import get_harvest_logs_db, get_harvest_log_by_id

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
    db: List[HarvestLog] = Depends(get_harvest_logs_db)
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
        # Create new harvest log with generated ID and timestamps
        new_log = HarvestLog(
            **harvest_log_data.model_dump(),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Add to database
        db.append(new_log)
        
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
    db: List[HarvestLog] = Depends(get_harvest_logs_db)
) -> HarvestLogListResponse:
    """
    Get all harvest logs.
    
    Returns a list of all harvest log entries in the system.
    """
    return HarvestLogListResponse(
        success=True,
        message=f"Retrieved {len(db)} harvest logs",
        data=db,
        total=len(db)
    )


@router.get(
    "/{log_id}",
    response_model=HarvestLogResponse,
    summary="Get harvest log by ID",
    description="Retrieve a specific harvest log by its unique identifier."
)
async def get_harvest_log(
    log_id: UUID,
    db: List[HarvestLog] = Depends(get_harvest_logs_db)
) -> HarvestLogResponse:
    """
    Get a specific harvest log by ID.
    
    - **log_id**: Unique identifier of the harvest log (UUID format)
    """
    log = get_harvest_log_by_id(log_id, db)
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


@router.put(
    "/{log_id}",
    response_model=HarvestLogResponse,
    summary="Update harvest log",
    description="Update an existing harvest log with new information."
)
async def update_harvest_log(
    log_id: UUID,
    harvest_log_update: HarvestLogUpdate,
    db: List[HarvestLog] = Depends(get_harvest_logs_db)
) -> HarvestLogResponse:
    """
    Update an existing harvest log.
    
    - **log_id**: Unique identifier of the harvest log to update
    - Only provided fields will be updated, others remain unchanged
    """
    log = get_harvest_log_by_id(log_id, db)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Harvest log with ID {log_id} not found"
        )
    
    try:
        # Update only provided fields
        update_data = harvest_log_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(log, field, value)
        
        # Update timestamp
        log.updated_at = datetime.now()
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log updated successfully",
            data=log
        )
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
    db: List[HarvestLog] = Depends(get_harvest_logs_db)
) -> HarvestLogResponse:
    """
    Delete a harvest log by ID.
    
    - **log_id**: Unique identifier of the harvest log to delete
    """
    log = get_harvest_log_by_id(log_id, db)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Harvest log with ID {log_id} not found"
        )
    
    try:
        db.remove(log)
        return HarvestLogResponse(
            success=True,
            message="Harvest log deleted successfully",
            data=log
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete harvest log: {str(e)}"
        ) 