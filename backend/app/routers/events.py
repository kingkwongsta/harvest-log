from fastapi import APIRouter, Depends, status, Request, Query, HTTPException
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta

from app.plant_models import (
    PlantEvent,
    PlantEventCreate,
    PlantEventUpdate,
    PlantEventResponse,
    PlantEventListResponse,
    HarvestEventCreate,
    BloomEventCreate,
    SnapshotEventCreate,
    EventType,
    EventStats,
    EventStatsResponse,
    ErrorResponse,
    get_event_create_model,
    validate_event_data
)
from app.weather import Coordinates
from app.dependencies import get_supabase_client
from app.logging_config import get_api_logger
from app.exceptions import NotFoundError, DatabaseError, ValidationException
from app.weather import get_weather_data
from app.storage import storage_service
from app.cache import cache_manager

logger = get_api_logger()

router = APIRouter(
    prefix="/api/events",
    tags=["plant-events"],
    responses={
        404: {"model": ErrorResponse, "description": "Event not found"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)


@router.post(
    "/",
    response_model=PlantEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create plant event",
    description="Create a new plant event (harvest, bloom, or snapshot) with dynamic validation based on event type."
)
async def create_plant_event(
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantEventResponse:
    """
    Create a new plant event with dynamic validation.
    
    The event_type field determines which validation model is used:
    - **harvest**: Requires produce, quantity
    - **bloom**: Requires plant_id (no additional fields)
    - **snapshot**: Optional metrics for growth tracking
    
    All events support: plant_id, event_date, description, notes, location
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        # Parse request body
        body = await request.json()
        event_type = body.get("event_type")
        
        if not event_type:
            raise ValidationException("event_type is required")
        
        logger.info(f"API: Creating new {event_type} event", 
                   extra={"request_id": request_id, "event_type": event_type})
        
        # Validate data with appropriate model
        validated_data = validate_event_data(event_type, body)
        
        # Fetch weather data if coordinates are provided
        weather_data = None
        if validated_data.coordinates:
            # Extract the date from the event_date for weather data
            event_date = validated_data.event_date.date() if validated_data.event_date else None
            weather_data = await get_weather_data(validated_data.coordinates, event_date)

        # Convert to database format
        event_data = {
            "plant_id": str(validated_data.plant_id) if validated_data.plant_id else None,
            "event_type": validated_data.event_type.value,
            "event_date": validated_data.event_date.isoformat() if validated_data.event_date else None,
            "description": validated_data.description,
            "notes": validated_data.notes,
            "location": validated_data.location,
            "latitude": validated_data.coordinates.latitude if validated_data.coordinates else None,
            "longitude": validated_data.coordinates.longitude if validated_data.coordinates else None,
            "weather": weather_data.dict() if weather_data else None
        }
        
        # Add event-type specific fields
        if event_type == EventType.HARVEST.value:
            event_data.update({
                "produce": validated_data.produce,
                "quantity": validated_data.quantity
            })
        elif event_type == EventType.BLOOM.value:
            # For bloom events, we need to set the plant_variety field
            variety_name = None
            
            # First, check if plant_variety_id was provided from the form
            if hasattr(validated_data, 'plant_variety_id') and validated_data.plant_variety_id:
                try:
                    variety_query = client.table("plant_varieties").select("name").eq("id", str(validated_data.plant_variety_id)).execute()
                    if variety_query.data and len(variety_query.data) > 0:
                        variety_name = variety_query.data[0].get("name")
                        logger.info(f"Using selected plant variety: {variety_name}", extra={"request_id": request_id})
                except Exception as e:
                    logger.warning(f"Failed to fetch selected plant variety: {str(e)}", 
                                  extra={"request_id": request_id})
            
            # If no variety from form selection, fall back to plant's associated variety
            if not variety_name:
                try:
                    plant_query = client.table("plants").select("*, variety:plant_varieties(name)").eq("id", str(validated_data.plant_id)).execute()
                    if plant_query.data and len(plant_query.data) > 0:
                        plant = plant_query.data[0]
                        variety_name = plant.get("variety", {}).get("name") if plant.get("variety") else None
                        if variety_name:
                            logger.info(f"Using plant's associated variety: {variety_name}", extra={"request_id": request_id})
                        else:
                            # Fallback to plant name if no variety is available
                            variety_name = plant.get("name", "Unknown")
                            logger.info(f"Using plant name as variety fallback: {variety_name}", extra={"request_id": request_id})
                    else:
                        # Fallback if plant not found
                        variety_name = "Unknown"
                        logger.warning("Plant not found, using 'Unknown' as variety", extra={"request_id": request_id})
                except Exception as e:
                    logger.warning(f"Failed to fetch plant variety for bloom event: {str(e)}", 
                                  extra={"request_id": request_id})
                    variety_name = "Unknown"
            
            # Set the plant_variety field for database constraint
            event_data["plant_variety"] = variety_name
        elif event_type == EventType.SNAPSHOT.value:
            event_data.update({
                "metrics": validated_data.metrics
            })
        
        # Insert into database
        logger.debug("API: Inserting event into database", 
                    extra={
                        "request_id": request_id,
                        "table": "plant_events",
                        "db_operation": "insert"
                    })
        
        result = client.table("plant_events").insert(event_data).execute()
        
        if not result.data:
            raise DatabaseError("Failed to create plant event")
        
        # Fetch the complete event with related data
        event_id = result.data[0]["id"]
        complete_event = await get_plant_event_by_id(event_id, client, request_id)
        
        # Invalidate event stats cache since we added a new event
        await cache_manager.invalidate_event_stats()
        
        logger.info(f"API: Successfully created {event_type} event with ID {event_id}", 
                   extra={"request_id": request_id, "record_id": str(event_id)})
        
        return PlantEventResponse(
            success=True,
            message=f"{event_type.title()} event created successfully",
            data=complete_event
        )
        
    except ValidationException as e:
        logger.warning(f"API: Validation error creating event: {str(e)}", 
                      extra={"request_id": request_id})
        raise HTTPException(status_code=422, detail=str(e))
    except AttributeError as e:
        logger.warning(f"API: Missing required field for event creation: {str(e)}", 
                      extra={"request_id": request_id})
        raise HTTPException(status_code=422, detail=f"Missing required field: {str(e)}")
    except Exception as e:
        logger.error(f"API: Failed to create plant event: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to create plant event: {str(e)}")


@router.get(
    "/",
    response_model=PlantEventListResponse,
    summary="Get plant events",
    description="Retrieve plant events with filtering options."
)
async def get_plant_events(
    request: Request,
    plant_id: Optional[UUID] = Query(None, description="Filter by plant ID"),
    event_type: Optional[EventType] = Query(None, description="Filter by event type"),
    date_from: Optional[datetime] = Query(None, description="Filter events from this date"),
    date_to: Optional[datetime] = Query(None, description="Filter events to this date"),
    limit: int = Query(default=50, ge=1, le=100, description="Number of events to return"),
    offset: int = Query(default=0, ge=0, description="Number of events to skip"),
    client = Depends(get_supabase_client)
) -> PlantEventListResponse:
    """
    Get plant events with optional filtering.
    
    - **plant_id**: Filter events for a specific plant
    - **event_type**: Filter by harvest, bloom, or snapshot events
    - **date_from/date_to**: Filter by date range
    - **limit/offset**: Pagination parameters
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info("API: Retrieving plant events", 
                   extra={
                       "request_id": request_id,
                       "plant_id": str(plant_id) if plant_id else None,
                       "event_type": event_type.value if event_type else None,
                       "limit": limit,
                       "offset": offset
                   })
        
        # Build query with filters
        query = client.table("plant_events").select("""
            *,
            plant:plants(id, name, variety:plant_varieties(id, name, category)),
            images:event_images(*)
        """)
        
        # Apply filters
        if plant_id:
            query = query.eq("plant_id", str(plant_id))
        
        if event_type:
            query = query.eq("event_type", event_type.value)
        
        if date_from:
            query = query.gte("event_date", date_from.isoformat())
        
        if date_to:
            query = query.lte("event_date", date_to.isoformat())
        
        # Apply pagination and ordering
        query = query.order("event_date", desc=True).range(offset, offset + limit - 1)
        
        logger.debug("API: Executing events query", 
                    extra={
                        "request_id": request_id,
                        "table": "plant_events",
                        "db_operation": "select"
                    })
        
        result = query.execute()
        
        # Convert to PlantEvent models
        events = []
        for event_data in result.data:
            # Add public URLs to images
            if event_data.get("images"):
                from app.storage import storage_service
                for image in event_data["images"]:
                    image["public_url"] = storage_service.get_public_url(image["file_path"])
            
            # Reconstruct coordinates object from separate latitude/longitude fields
            if event_data.get("latitude") is not None and event_data.get("longitude") is not None:
                from app.weather import Coordinates
                event_data["coordinates"] = Coordinates(
                    latitude=event_data["latitude"],
                    longitude=event_data["longitude"]
                )
            
            event = PlantEvent(**event_data)
            events.append(event)
        
        logger.info(f"API: Successfully retrieved {len(events)} plant events", 
                   extra={"request_id": request_id})
        
        return PlantEventListResponse(
            success=True,
            message=f"Retrieved {len(events)} plant events",
            data=events,
            total=len(events)
        )
        
    except Exception as e:
        logger.error(f"API: Failed to retrieve plant events: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve plant events: {str(e)}")


@router.get(
    "/stats",
    response_model=EventStatsResponse,
    summary="Get event statistics",
    description="Retrieve comprehensive statistics for all plant events."
)
async def get_event_stats(
    request: Request,
    client = Depends(get_supabase_client)
) -> EventStatsResponse:
    """
    Get comprehensive event statistics.
    
    Returns statistics including:
    - Total event count across all types
    - This month's event count
    - This week's event count
    - Count by event type (harvest, bloom, snapshot)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info("API: Retrieving event statistics", extra={"request_id": request_id})
        
        # Try to get from cache first
        cached_stats = await cache_manager.get_event_stats()
        if cached_stats:
            logger.info("API: Retrieved event stats from cache", extra={"request_id": request_id})
            return EventStatsResponse(
                success=True,
                message="Event statistics retrieved successfully",
                data=EventStats(**cached_stats)
            )
        
        # Get current date info
        now = datetime.now()
        
        # Start of current month
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Start of current week (Monday)
        days_since_monday = now.weekday()
        week_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_since_monday)
        
        # Query total count
        total_response = client.table('plant_events').select('id', count='exact').execute()
        total_count = total_response.count or 0
        
        # Query this month count
        month_response = client.table('plant_events').select('id', count='exact').gte('event_date', month_start.isoformat()).execute()
        month_count = month_response.count or 0
        
        # Query this week count
        week_response = client.table('plant_events').select('id', count='exact').gte('event_date', week_start.isoformat()).execute()
        week_count = week_response.count or 0
        
        # Query count by event type
        harvest_response = client.table('plant_events').select('id', count='exact').eq('event_type', 'harvest').execute()
        harvest_count = harvest_response.count or 0
        
        bloom_response = client.table('plant_events').select('id', count='exact').eq('event_type', 'bloom').execute()
        bloom_count = bloom_response.count or 0
        
        snapshot_response = client.table('plant_events').select('id', count='exact').eq('event_type', 'snapshot').execute()
        snapshot_count = snapshot_response.count or 0
        
        stats = EventStats(
            total_events=total_count,
            this_month=month_count,
            this_week=week_count,
            harvest_events=harvest_count,
            bloom_events=bloom_count,
            snapshot_events=snapshot_count
        )
        
        # Cache the results for 3 minutes
        await cache_manager.set_event_stats(stats.dict(), ttl=180)
        
        logger.info(f"API: Successfully retrieved event stats", 
                   extra={
                       "request_id": request_id,
                       "total_events": total_count,
                       "this_month": month_count,
                       "this_week": week_count,
                       "harvest_events": harvest_count,
                       "bloom_events": bloom_count,
                       "snapshot_events": snapshot_count
                   })
        
        return EventStatsResponse(
            success=True,
            message="Event statistics retrieved successfully",
            data=stats
        )
        
    except Exception as e:
        logger.error(f"API: Failed to retrieve event stats: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve event statistics: {str(e)}")


@router.get(
    "/{event_id}",
    response_model=PlantEventResponse,
    summary="Get plant event by ID",
    description="Retrieve a specific plant event by its unique identifier."
)
async def get_plant_event(
    event_id: UUID,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantEventResponse:
    """
    Get a specific plant event by ID.
    
    - **event_id**: Unique identifier of the plant event (UUID format)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Retrieving plant event with ID {event_id}", 
                   extra={"request_id": request_id, "record_id": str(event_id)})
        
        event = await get_plant_event_by_id(event_id, client, request_id)
        if not event:
            logger.warning(f"API: Plant event not found: {event_id}", 
                          extra={"request_id": request_id, "record_id": str(event_id)})
            raise NotFoundError("Plant event", str(event_id))
        
        logger.info(f"API: Successfully retrieved plant event {event_id}", 
                   extra={"request_id": request_id, "record_id": str(event_id)})
        
        return PlantEventResponse(
            success=True,
            message="Plant event retrieved successfully",
            data=event
        )
        
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"API: Failed to retrieve plant event {event_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(event_id)}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve plant event: {str(e)}")


@router.put(
    "/{event_id}",
    response_model=PlantEventResponse,
    summary="Update plant event",
    description="Update an existing plant event with new information."
)
async def update_plant_event(
    event_id: UUID,
    event_update: PlantEventUpdate,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantEventResponse:
    """
    Update an existing plant event.
    
    - **event_id**: Unique identifier of the plant event to update
    - Only provided fields will be updated, others remain unchanged
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Updating plant event {event_id}", 
                   extra={"request_id": request_id, "record_id": str(event_id)})
        
        # Build update data, excluding None values
        update_data = {}
        for field, value in event_update.model_dump(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        if not update_data:
            raise ValidationException("No fields provided for update")
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.now().isoformat()
        
        logger.debug("API: Updating event in database", 
                    extra={
                        "request_id": request_id,
                        "table": "plant_events",
                        "db_operation": "update",
                        "record_id": str(event_id)
                    })
        
        result = client.table("plant_events").update(update_data).eq("id", str(event_id)).execute()
        
        if not result.data:
            logger.warning(f"API: Plant event not found for update: {event_id}", 
                          extra={"request_id": request_id, "record_id": str(event_id)})
            raise NotFoundError("Plant event", str(event_id))
        
        # Fetch the updated event
        updated_event = await get_plant_event_by_id(event_id, client, request_id)
        
        # Invalidate event stats cache since event was modified
        await cache_manager.invalidate_event_stats()
        
        logger.info(f"API: Successfully updated plant event {event_id}", 
                   extra={"request_id": request_id, "record_id": str(event_id)})
        
        return PlantEventResponse(
            success=True,
            message="Plant event updated successfully",
            data=updated_event
        )
        
    except NotFoundError:
        raise
    except ValidationException as e:
        logger.warning(f"API: Validation error updating event: {str(e)}", 
                      extra={"request_id": request_id})
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"API: Failed to update plant event {event_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(event_id)}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to update plant event: {str(e)}")


@router.delete(
    "/{event_id}",
    response_model=PlantEventResponse,
    summary="Delete plant event",
    description="Delete a plant event entry permanently."
)
async def delete_plant_event(
    event_id: UUID,
    request: Request,
    client = Depends(get_supabase_client)
) -> PlantEventResponse:
    """
    Delete a plant event by ID.
    
    - **event_id**: Unique identifier of the plant event to delete
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Deleting plant event {event_id}", 
                   extra={"request_id": request_id, "record_id": str(event_id)})
        
        # First fetch the event to return it in response (with images for cleanup)
        event_to_delete = await get_plant_event_by_id(event_id, client, request_id)
        if not event_to_delete:
            logger.warning(f"API: Plant event not found for deletion: {event_id}", 
                          extra={"request_id": request_id, "record_id": str(event_id)})
            raise NotFoundError("Plant event", str(event_id))
        
        # Delete associated images from storage before database deletion
        if event_to_delete.images:
            for image in event_to_delete.images:
                try:
                    await storage_service.delete_image(image.file_path)
                    logger.debug(f"API: Deleted image from storage: {image.file_path}", 
                               extra={
                                   "request_id": request_id,
                                   "file_path": image.file_path,
                                   "image_id": str(image.id)
                               })
                except Exception as e:
                    logger.warning(f"API: Failed to delete image from storage {image.file_path}: {e}", 
                                  extra={
                                      "request_id": request_id,
                                      "file_path": image.file_path,
                                      "image_id": str(image.id)
                                  })
        
        # Delete the event from database (cascade will handle image metadata)
        logger.debug("API: Deleting event from database", 
                    extra={
                        "request_id": request_id,
                        "table": "plant_events",
                        "db_operation": "delete",
                        "record_id": str(event_id)
                    })
        
        result = client.table("plant_events").delete().eq("id", str(event_id)).execute()
        
        if not result.data:
            raise DatabaseError("Failed to delete plant event")
        
        # Invalidate relevant caches
        await cache_manager.invalidate_plant_event(str(event_id))
        await cache_manager.invalidate_event_stats()
        
        logger.info(f"API: Successfully deleted plant event {event_id} and {len(event_to_delete.images or [])} associated images", 
                   extra={
                       "request_id": request_id, 
                       "record_id": str(event_id),
                       "deleted_images": len(event_to_delete.images or []),
                       "event_type": event_to_delete.event_type
                   })
        
        return PlantEventResponse(
            success=True,
            message="Plant event deleted successfully",
            data=event_to_delete
        )
        
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"API: Failed to delete plant event {event_id}: {str(e)}", 
                    extra={"request_id": request_id, "record_id": str(event_id)}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to delete plant event: {str(e)}")


# Helper functions
async def get_plant_event_by_id(event_id: UUID, client, request_id: str) -> Optional[PlantEvent]:
    """Helper function to get a plant event by ID with all related data"""
    try:
        logger.debug(f"DB: Fetching plant event {event_id}", 
                    extra={
                        "request_id": request_id,
                        "table": "plant_events",
                        "db_operation": "select",
                        "record_id": str(event_id)
                    })
        
        result = client.table("plant_events").select("""
            *,
            plant:plants(
                id, name, variety_id, planted_date, location, status, notes,
                variety:plant_varieties(id, name, category, description)
            ),
            images:event_images(*)
        """).eq("id", str(event_id)).execute()
        
        if not result.data:
            return None
        
        event_data = result.data[0]
        
        # Add public URLs to images
        if event_data.get("images"):
            from app.storage import storage_service
            for image in event_data["images"]:
                image["public_url"] = storage_service.get_public_url(image["file_path"])
        
        # Reconstruct coordinates object from separate latitude/longitude fields
        if event_data.get("latitude") is not None and event_data.get("longitude") is not None:
            from app.weather import Coordinates
            event_data["coordinates"] = Coordinates(
                latitude=event_data["latitude"],
                longitude=event_data["longitude"]
            )
        
        return PlantEvent(**event_data)
        
    except Exception as e:
        logger.error(f"DB: Failed to fetch plant event {event_id}: {str(e)}", 
                    extra={"request_id": request_id}, 
                    exc_info=True)
        raise DatabaseError(f"Failed to fetch plant event: {str(e)}")


