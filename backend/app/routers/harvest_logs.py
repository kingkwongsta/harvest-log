from fastapi import APIRouter, Depends, status, Request, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

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
from app.exceptions import NotFoundError, DatabaseError
from app.pagination import (
    PaginationParams, 
    FilterParams, 
    PaginationHelper, 
    PaginatedHarvestLogResponse
)

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
        
        new_log = await create_harvest_log_in_db(harvest_log_data, client, request_id)
        
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
        raise DatabaseError(f"Failed to create harvest log: {str(e)}")


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
        
        logs = await get_all_harvest_logs_from_db(client, request_id)
        
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
        raise DatabaseError(f"Failed to retrieve harvest logs: {str(e)}")


@router.get(
    "/paginated",
    response_model=PaginatedHarvestLogResponse,
    summary="Get harvest logs with pagination",
    description="Retrieve harvest log entries with cursor-based pagination and filtering."
)
async def get_harvest_logs_paginated(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100, description="Number of items per page"),
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    order: str = Query(default="desc", pattern="^(asc|desc)$", description="Sort order"),
    crop_name_search: Optional[str] = Query(None, max_length=100, description="Search in crop names"),
    harvest_date_from: Optional[datetime] = Query(None, description="Filter from date"),
    harvest_date_to: Optional[datetime] = Query(None, description="Filter to date"),
    location: Optional[str] = Query(None, max_length=200, description="Filter by location"),
    include_total: bool = Query(False, description="Include total count (slower)"),
    client = Depends(get_supabase_client)
) -> PaginatedHarvestLogResponse:
    """
    Get harvest logs with pagination and filtering.
    
    This endpoint provides efficient cursor-based pagination for large datasets.
    Supports filtering by crop name, date range, and location.
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info("API: Retrieving paginated harvest logs", 
                   extra={
                       "request_id": request_id,
                       "limit": limit,
                       "order": order,
                       "has_cursor": cursor is not None,
                       "include_total": include_total
                   })
        
        # Create pagination and filter parameters
        pagination_params = PaginationParams(
            limit=limit,
            cursor=cursor,
            order=order
        )
        
        filter_params = FilterParams(
            crop_name_search=crop_name_search,
            harvest_date_from=harvest_date_from,
            harvest_date_to=harvest_date_to,
            location=location
        )
        
        # Build and execute query
        query, current_cursor = PaginationHelper.build_harvest_logs_query(
            client=client,
            params=pagination_params,
            additional_filters=filter_params.to_dict()
        )
        
        logger.debug("API: Executing paginated query", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_logs",
                        "db_operation": "select_paginated"
                    })
        
        result = query.execute()
        
        # Process pagination result
        pagination_result = PaginationHelper.process_harvest_logs_result(
            data=result.data or [],
            params=pagination_params,
            current_cursor=current_cursor
        )
        
        # Convert to HarvestLog models and fetch images for each
        logs = []
        if pagination_result.items:
            # Get harvest log IDs for batch image fetching
            harvest_log_ids = [item["id"] for item in pagination_result.items]
            
            # Fetch all images for these harvest logs in a single query
            logger.debug(f"API: Fetching images for {len(harvest_log_ids)} harvest logs", 
                        extra={
                            "request_id": request_id,
                            "table": "harvest_images",
                            "db_operation": "select",
                            "batch_size": len(harvest_log_ids)
                        })
            
            images_result = client.table("harvest_images").select("*").in_("harvest_log_id", harvest_log_ids).order("harvest_log_id, upload_order").execute()
            
            # Group images by harvest_log_id
            from app.storage import storage_service
            images_by_log_id = {}
            for image_data in images_result.data:
                # Add public URL to each image
                image_data["public_url"] = storage_service.get_public_url(image_data["file_path"])
                harvest_log_id = image_data["harvest_log_id"]
                if harvest_log_id not in images_by_log_id:
                    images_by_log_id[harvest_log_id] = []
                images_by_log_id[harvest_log_id].append(image_data)
            
            # Create HarvestLog models with images
            from app.models import HarvestImage
            for item in pagination_result.items:
                harvest_log = HarvestLog(**item)
                harvest_log.images = [
                    HarvestImage(**img) 
                    for img in images_by_log_id.get(str(harvest_log.id), [])
                ]
                logs.append(harvest_log)
        
        # Get total count if requested
        total_count = None
        if include_total:
            total_count = PaginationHelper.get_total_count(
                client=client,
                additional_filters=filter_params.to_dict()
            )
        
        pagination_metadata = {
            "has_next": pagination_result.has_next,
            "has_previous": pagination_result.has_previous,
            "next_cursor": pagination_result.next_cursor,
            "previous_cursor": pagination_result.previous_cursor,
            "limit": limit,
            "order": order,
            "total_count": total_count
        }
        
        logger.info(f"API: Successfully retrieved {len(logs)} paginated harvest logs", 
                   extra={
                       "request_id": request_id,
                       "returned_count": len(logs),
                       "has_next": pagination_result.has_next,
                       "has_previous": pagination_result.has_previous,
                       "total_count": total_count
                   })
        
        return PaginatedHarvestLogResponse(
            success=True,
            message=f"Retrieved {len(logs)} harvest logs",
            data=logs,
            pagination=pagination_metadata
        )
        
    except Exception as e:
        logger.error(f"API: Failed to retrieve paginated harvest logs: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve paginated harvest logs: {str(e)}")


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
        
        log = await get_harvest_log_by_id_from_db(log_id, client, request_id)
        if not log:
            logger.warning(f"API: Harvest log not found: {log_id}", 
                          extra={"request_id": request_id, "record_id": str(log_id)})
            raise NotFoundError("Harvest log", str(log_id))
        
        logger.info(f"API: Successfully retrieved harvest log {log_id}", 
                   extra={"request_id": request_id, "record_id": str(log_id)})
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log retrieved successfully",
            data=log
        )
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"API: Failed to retrieve harvest log {log_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(log_id)}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve harvest log: {str(e)}")


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
        
        updated_log = await update_harvest_log_in_db(log_id, harvest_log_update, client, request_id)
        if not updated_log:
            logger.warning(f"API: Harvest log not found for update: {log_id}", 
                          extra={"request_id": request_id, "record_id": str(log_id)})
            raise NotFoundError("Harvest log", str(log_id))
        
        logger.info(f"API: Successfully updated harvest log {log_id}", 
                   extra={"request_id": request_id, "record_id": str(log_id)})
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log updated successfully",
            data=updated_log
        )
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"API: Failed to update harvest log {log_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(log_id)}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to update harvest log: {str(e)}")


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
        
        deleted_log = await delete_harvest_log_from_db(log_id, client, request_id)
        if not deleted_log:
            logger.warning(f"API: Harvest log not found for deletion: {log_id}", 
                          extra={"request_id": request_id, "record_id": str(log_id)})
            raise NotFoundError("Harvest log", str(log_id))
        
        logger.info(f"API: Successfully deleted harvest log {log_id}", 
                   extra={"request_id": request_id, "record_id": str(log_id)})
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log deleted successfully",
            data=deleted_log
        )
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"API: Failed to delete harvest log {log_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(log_id)}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to delete harvest log: {str(e)}")


 