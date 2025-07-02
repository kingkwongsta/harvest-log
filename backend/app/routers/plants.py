from fastapi import APIRouter, Depends, status, Request, Query, HTTPException
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.plant_models import (
    Plant,
    PlantCreate,
    PlantUpdate,
    PlantResponse,
    PlantListResponse,
    PlantEventListResponse,
    PlantVariety,
    PlantVarietyCreate,
    PlantVarietyUpdate,
    PlantVarietyResponse,
    PlantVarietyListResponse,
    PlantStatus,
    PlantCategory,
    EventType
)
from app.dependencies import get_supabase_client
from app.logging_config import get_api_logger
from app.exceptions import NotFoundError, DatabaseError, ValidationException
from app.models import ErrorResponse

logger = get_api_logger()

router = APIRouter(
    prefix="/api/plants",
    tags=["plants"],
    responses={
        404: {"model": ErrorResponse, "description": "Plant not found"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)

# Plant Variety endpoints
@router.post(
    "/varieties",
    response_model=PlantVarietyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create plant variety",
    description="Create a new plant variety."
)
async def create_plant_variety(
    variety_data: PlantVarietyCreate,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantVarietyResponse:
    """
    Create a new plant variety.
    
    - **name**: Name of the plant variety (required)
    - **category**: Category of the plant variety (required)
    - **description**: Description of the plant variety (optional)
    - **growing_season**: Growing season for this variety (optional)
    - **harvest_time_days**: Typical days to harvest (optional)
    - **typical_yield**: Typical yield expectations (optional)
    - **care_instructions**: Care instructions (optional)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Creating new plant variety '{variety_data.name}'", 
                   extra={"request_id": request_id})
        
        # Convert to database format
        variety_dict = variety_data.model_dump()
        variety_dict["category"] = variety_data.category.value
        
        logger.debug("API: Inserting plant variety into database", 
                    extra={
                        "request_id": request_id,
                        "table": "plant_varieties",
                        "db_operation": "insert"
                    })
        
        result = client.table("plant_varieties").insert(variety_dict).execute()
        
        if not result.data:
            raise DatabaseError("Failed to create plant variety")
        
        # Convert to PlantVariety model
        variety = PlantVariety(**result.data[0])
        
        logger.info(f"API: Successfully created plant variety with ID {variety.id}", 
                   extra={"request_id": request_id, "record_id": str(variety.id)})
        
        return PlantVarietyResponse(
            success=True,
            message="Plant variety created successfully",
            data=variety
        )
        
    except Exception as e:
        logger.error(f"API: Failed to create plant variety: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to create plant variety: {str(e)}")


@router.get(
    "/varieties",
    response_model=PlantVarietyListResponse,
    summary="Get plant varieties",
    description="Retrieve all plant varieties with optional filtering."
)
async def get_plant_varieties(
    request: Request,
    category: Optional[PlantCategory] = Query(None, description="Filter by plant category"),
    limit: int = Query(default=50, ge=1, le=100, description="Number of varieties to return"),
    offset: int = Query(default=0, ge=0, description="Number of varieties to skip"),
    client = Depends(get_supabase_client)
) -> PlantVarietyListResponse:
    """
    Get plant varieties with optional filtering.
    
    - **category**: Filter by plant category
    - **limit/offset**: Pagination parameters
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info("API: Retrieving plant varieties", 
                   extra={
                       "request_id": request_id,
                       "category": category.value if category else None,
                       "limit": limit,
                       "offset": offset
                   })
        
        # Build query for plant varieties
        query = client.table("plant_varieties").select("*")
        
        # Apply filters
        if category:
            query = query.eq("category", category.value)
        
        # Apply pagination and ordering
        query = query.order("name").range(offset, offset + limit - 1)
        
        logger.debug("API: Executing plant varieties query", 
                    extra={
                        "request_id": request_id,
                        "table": "plant_varieties",
                        "db_operation": "select"
                    })
        
        result = query.execute()
        
        # Convert to PlantVariety models
        varieties = [PlantVariety(**variety_data) for variety_data in result.data]
        
        logger.info(f"API: Successfully retrieved {len(varieties)} plant varieties", 
                   extra={"request_id": request_id})
        
        return PlantVarietyListResponse(
            success=True,
            message=f"Retrieved {len(varieties)} plant varieties",
            data=varieties,
            total=len(varieties)
        )
        
    except Exception as e:
        logger.error(f"API: Failed to retrieve plant varieties: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve plant varieties: {str(e)}")


@router.get(
    "/varieties/{variety_id}",
    response_model=PlantVarietyResponse,
    summary="Get plant variety by ID",
    description="Retrieve a specific plant variety by its unique identifier."
)
async def get_plant_variety(
    variety_id: UUID,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantVarietyResponse:
    """Get a specific plant variety by ID."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Retrieving plant variety with ID {variety_id}", 
                   extra={"request_id": request_id, "record_id": str(variety_id)})
        
        result = client.table("plant_varieties").select("*").eq("id", str(variety_id)).execute()
        
        if not result.data:
            raise NotFoundError(f"Plant variety with ID {variety_id} not found")
        
        variety = PlantVariety(**result.data[0])
        
        logger.info(f"API: Successfully retrieved plant variety {variety.name}", 
                   extra={"request_id": request_id, "record_id": str(variety_id)})
        
        return PlantVarietyResponse(
            success=True,
            message="Plant variety retrieved successfully",
            data=variety
        )
        
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"API: Failed to retrieve plant variety: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve plant variety: {str(e)}")


@router.put(
    "/varieties/{variety_id}",
    response_model=PlantVarietyResponse,
    summary="Update plant variety",
    description="Update an existing plant variety with new information."
)
async def update_plant_variety(
    variety_id: UUID,
    variety_update: PlantVarietyUpdate,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantVarietyResponse:
    """Update an existing plant variety."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Updating plant variety with ID {variety_id}", 
                   extra={"request_id": request_id, "record_id": str(variety_id)})
        
        # Check if variety exists
        existing = client.table("plant_varieties").select("*").eq("id", str(variety_id)).execute()
        if not existing.data:
            raise NotFoundError(f"Plant variety with ID {variety_id} not found")
        
        # Prepare update data
        update_dict = variety_update.model_dump(exclude_unset=True)
        if 'category' in update_dict and update_dict['category']:
            update_dict['category'] = update_dict['category'].value
        
        if not update_dict:
            # No fields to update
            variety = PlantVariety(**existing.data[0])
            return PlantVarietyResponse(
                success=True,
                message="No changes to update",
                data=variety
            )
        
        # Update the variety
        result = client.table("plant_varieties").update(update_dict).eq("id", str(variety_id)).execute()
        
        if not result.data:
            raise DatabaseError("Failed to update plant variety")
        
        variety = PlantVariety(**result.data[0])
        
        logger.info(f"API: Successfully updated plant variety {variety.name}", 
                   extra={"request_id": request_id, "record_id": str(variety_id)})
        
        return PlantVarietyResponse(
            success=True,
            message="Plant variety updated successfully",
            data=variety
        )
        
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"API: Failed to update plant variety: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to update plant variety: {str(e)}")


@router.delete(
    "/varieties/{variety_id}",
    response_model=PlantVarietyResponse,
    summary="Delete plant variety",
    description="Delete a plant variety entry permanently."
)
async def delete_plant_variety(
    variety_id: UUID,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantVarietyResponse:
    """Delete a plant variety permanently."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Deleting plant variety with ID {variety_id}", 
                   extra={"request_id": request_id, "record_id": str(variety_id)})
        
        # Check if variety exists and get its data before deletion
        existing = client.table("plant_varieties").select("*").eq("id", str(variety_id)).execute()
        if not existing.data:
            raise NotFoundError(f"Plant variety with ID {variety_id} not found")
        
        # Check if any plants are using this variety
        plants_using_variety = client.table("plants").select("id").eq("variety_id", str(variety_id)).execute()
        if plants_using_variety.data:
            raise ValidationException(f"Cannot delete plant variety: {len(plants_using_variety.data)} plants are using this variety")
        
        # Delete the variety
        result = client.table("plant_varieties").delete().eq("id", str(variety_id)).execute()
        
        if not result.data:
            raise DatabaseError("Failed to delete plant variety")
        
        variety = PlantVariety(**existing.data[0])
        
        logger.info(f"API: Successfully deleted plant variety {variety.name}", 
                   extra={"request_id": request_id, "record_id": str(variety_id)})
        
        return PlantVarietyResponse(
            success=True,
            message=f"Plant variety '{variety.name}' deleted successfully",
            data=variety
        )
        
    except (NotFoundError, ValidationException):
        raise
    except Exception as e:
        logger.error(f"API: Failed to delete plant variety: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to delete plant variety: {str(e)}")


# Plant endpoints
@router.post(
    "/",
    response_model=PlantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create plant",
    description="Create a new plant instance."
)
async def create_plant(
    plant_data: PlantCreate,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantResponse:
    """
    Create a new plant.
    
    - **name**: Name of the individual plant (required)
    - **variety_id**: ID of the plant variety (optional)
    - **planted_date**: Date when the plant was planted (optional)
    
    - **status**: Current status (active, harvested, deceased, dormant)
    - **notes**: Additional notes about the plant (optional)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Creating new plant '{plant_data.name}'", 
                   extra={"request_id": request_id})
        
        # Convert to database format
        plant_dict = plant_data.model_dump()
        plant_dict["status"] = plant_data.status.value
        
        # Convert UUID fields to strings for JSON serialization
        if plant_dict.get("variety_id"):
            plant_dict["variety_id"] = str(plant_dict["variety_id"])
        
        logger.debug("API: Inserting plant into database", 
                    extra={
                        "request_id": request_id,
                        "table": "plants",
                        "db_operation": "insert"
                    })
        
        result = client.table("plants").insert(plant_dict).execute()
        
        if not result.data:
            raise DatabaseError("Failed to create plant")
        
        # Fetch the complete plant with variety info
        plant_id = result.data[0]["id"]
        complete_plant = await get_plant_by_id(plant_id, client, request_id)
        
        logger.info(f"API: Successfully created plant with ID {plant_id}", 
                   extra={"request_id": request_id, "record_id": str(plant_id)})
        
        return PlantResponse(
            success=True,
            message="Plant created successfully",
            data=complete_plant
        )
        
    except Exception as e:
        logger.error(f"API: Failed to create plant: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to create plant: {str(e)}")


@router.get(
    "/",
    response_model=PlantListResponse,
    summary="Get plants",
    description="Retrieve all plants with optional filtering."
)
async def get_plants(
    request: Request,
    status: Optional[PlantStatus] = Query(None, description="Filter by plant status"),
    variety_id: Optional[UUID] = Query(None, description="Filter by variety ID"),
    limit: int = Query(default=50, ge=1, le=100, description="Number of plants to return"),
    offset: int = Query(default=0, ge=0, description="Number of plants to skip"),
    client = Depends(get_supabase_client)
) -> PlantListResponse:
    """
    Get plants with optional filtering.
    
    - **status**: Filter by plant status
    - **variety_id**: Filter by plant variety
    - **location**: Filter by location
    - **limit/offset**: Pagination parameters
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info("API: Retrieving plants", 
                   extra={
                       "request_id": request_id,
                       "status": status.value if status else None,
                       "variety_id": str(variety_id) if variety_id else None,
                       "limit": limit,
                       "offset": offset
                   })
        
        # Build query for plants
        query = client.table("plants").select("*")
        
        # Apply filters
        if status:
            query = query.eq("status", status.value)
        
        if variety_id:
            query = query.eq("variety_id", str(variety_id))
        
        
        
        # Apply pagination and ordering
        query = query.order("name").range(offset, offset + limit - 1)
        
        logger.debug("API: Executing plants query", 
                    extra={
                        "request_id": request_id,
                        "table": "plants",
                        "db_operation": "select"
                    })
        
        result = query.execute()
        
        # Convert to Plant models
        plants = [Plant(**plant_data) for plant_data in result.data]
        
        logger.info(f"API: Successfully retrieved {len(plants)} plants", 
                   extra={"request_id": request_id})
        
        return PlantListResponse(
            success=True,
            message=f"Retrieved {len(plants)} plants",
            data=plants,
            total=len(plants)
        )
        
    except Exception as e:
        logger.error(f"API: Failed to retrieve plants: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve plants: {str(e)}")


@router.get(
    "/{plant_id}",
    response_model=PlantResponse,
    summary="Get plant by ID",
    description="Retrieve a specific plant by its unique identifier."
)
async def get_plant(
    plant_id: UUID,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantResponse:
    """Get a specific plant by ID."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Retrieving plant with ID {plant_id}", 
                   extra={"request_id": request_id, "record_id": str(plant_id)})
        
        plant = await get_plant_by_id(plant_id, client, request_id)
        if not plant:
            logger.warning(f"API: Plant not found: {plant_id}", 
                          extra={"request_id": request_id, "record_id": str(plant_id)})
            raise NotFoundError("Plant", str(plant_id))
        
        logger.info(f"API: Successfully retrieved plant {plant_id}", 
                   extra={"request_id": request_id, "record_id": str(plant_id)})
        
        return PlantResponse(
            success=True,
            message="Plant retrieved successfully",
            data=plant
        )
        
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"API: Failed to retrieve plant {plant_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(plant_id)}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve plant: {str(e)}")


@router.get(
    "/{plant_id}/events",
    response_model=PlantEventListResponse,
    summary="Get plant events timeline",
    description="Retrieve all events for a specific plant."
)
async def get_plant_events(
    plant_id: UUID,
    request: Request,
    event_type: Optional[EventType] = Query(None, description="Filter by event type"),
    date_from: Optional[datetime] = Query(None, description="Filter events from this date"),
    date_to: Optional[datetime] = Query(None, description="Filter events to this date"),
    limit: int = Query(default=50, ge=1, le=100, description="Number of events to return"),
    offset: int = Query(default=0, ge=0, description="Number of events to skip"),
    client = Depends(get_supabase_client)
) -> PlantEventListResponse:
    """
    Get all events for a specific plant.
    
    - **plant_id**: ID of the plant
    - **event_type**: Filter by event type (harvest, bloom, snapshot)
    - **date_from/date_to**: Filter by date range
    - **limit/offset**: Pagination parameters
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        # Import here to avoid circular imports
        from app.routers.events import get_plant_events as get_events
        
        logger.info(f"API: Retrieving events for plant {plant_id}", 
                   extra={"request_id": request_id, "record_id": str(plant_id)})
        
        # Verify plant exists
        plant = await get_plant_by_id(plant_id, client, request_id)
        if not plant:
            logger.warning(f"API: Plant not found: {plant_id}", 
                          extra={"request_id": request_id, "record_id": str(plant_id)})
            raise NotFoundError("Plant", str(plant_id))
        
        # Call the events endpoint with plant filter
        return await get_events(
            request=request,
            plant_id=plant_id,
            event_type=event_type,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset,
            client=client
        )
        
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"API: Failed to retrieve events for plant {plant_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(plant_id)}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve plant events: {str(e)}")


@router.put(
    "/{plant_id}",
    response_model=PlantResponse,
    summary="Update plant",
    description="Update an existing plant with new information."
)
async def update_plant(
    plant_id: UUID,
    plant_update: PlantUpdate,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantResponse:
    """
    Update an existing plant.
    
    - **plant_id**: Unique identifier of the plant to update
    - Only provided fields will be updated, others remain unchanged
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Updating plant {plant_id}", 
                   extra={"request_id": request_id, "record_id": str(plant_id)})
        
        # Build update data, excluding None values
        update_data = {}
        for field, value in plant_update.model_dump(exclude_unset=True).items():
            if value is not None:
                if field == "status" and hasattr(value, 'value'):
                    update_data[field] = value.value
                elif field == "variety_id" and isinstance(value, UUID):
                    # Convert UUID to string for JSON serialization
                    update_data[field] = str(value)
                else:
                    update_data[field] = value
        
        if not update_data:
            raise ValidationException("No fields provided for update")
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.now()
        
        logger.debug("API: Updating plant in database", 
                    extra={
                        "request_id": request_id,
                        "table": "plants",
                        "db_operation": "update",
                        "record_id": str(plant_id)
                    })
        
        result = client.table("plants").update(update_data).eq("id", str(plant_id)).execute()
        
        if not result.data:
            logger.warning(f"API: Plant not found for update: {plant_id}", 
                          extra={"request_id": request_id, "record_id": str(plant_id)})
            raise NotFoundError("Plant", str(plant_id))
        
        # Fetch the updated plant
        updated_plant = await get_plant_by_id(plant_id, client, request_id)
        
        logger.info(f"API: Successfully updated plant {plant_id}", 
                   extra={"request_id": request_id, "record_id": str(plant_id)})
        
        return PlantResponse(
            success=True,
            message="Plant updated successfully",
            data=updated_plant
        )
        
    except NotFoundError:
        raise
    except ValidationException as e:
        logger.warning(f"API: Validation error updating plant: {str(e)}", 
                      extra={"request_id": request_id})
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"API: Failed to update plant {plant_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(plant_id)}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to update plant: {str(e)}")


@router.delete(
    "/{plant_id}",
    response_model=PlantResponse,
    summary="Delete plant",
    description="Delete a plant entry permanently."
)
async def delete_plant(
    plant_id: UUID,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantResponse:
    """
    Delete a plant by ID.
    
    - **plant_id**: Unique identifier of the plant to delete
    - All associated events and images will also be deleted
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Deleting plant {plant_id}", 
                   extra={"request_id": request_id, "record_id": str(plant_id)})
        
        # First fetch the plant to return it in response
        plant_to_delete = await get_plant_by_id(plant_id, client, request_id)
        if not plant_to_delete:
            logger.warning(f"API: Plant not found for deletion: {plant_id}", 
                          extra={"request_id": request_id, "record_id": str(plant_id)})
            raise NotFoundError("Plant", str(plant_id))
        
        # Delete the plant (cascade will handle related events and images)
        logger.debug("API: Deleting plant from database", 
                    extra={
                        "request_id": request_id,
                        "table": "plants",
                        "db_operation": "delete",
                        "record_id": str(plant_id)
                    })
        
        result = client.table("plants").delete().eq("id", str(plant_id)).execute()
        
        if not result.data:
            raise DatabaseError("Failed to delete plant")
        
        logger.info(f"API: Successfully deleted plant {plant_id}", 
                   extra={"request_id": request_id, "record_id": str(plant_id)})
        
        return PlantResponse(
            success=True,
            message="Plant deleted successfully",
            data=plant_to_delete
        )
        
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"API: Failed to delete plant {plant_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(plant_id)}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to delete plant: {str(e)}")


# Helper functions
async def get_plant_by_id(plant_id: UUID, client, request_id: str) -> Optional[Plant]:
    """Helper function to get a plant by ID with all related data"""
    try:
        logger.debug(f"DB: Fetching plant {plant_id}", 
                    extra={
                        "request_id": request_id,
                        "table": "plants",
                        "db_operation": "select",
                        "record_id": str(plant_id)
                    })
        
        result = client.table("plants").select("*").eq("id", str(plant_id)).execute()
        
        if not result.data:
            return None
        
        return Plant(**result.data[0])
        
    except Exception as e:
        logger.error(f"DB: Failed to fetch plant {plant_id}: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to fetch plant: {str(e)}")