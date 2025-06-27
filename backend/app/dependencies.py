from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models import HarvestLog, HarvestLogCreate, HarvestLogUpdate, HarvestImage
from app.database import get_supabase
from app.logging_config import get_database_logger
from app.storage import storage_service

logger = get_database_logger()


def get_supabase_client() -> Client:
    """Dependency to get Supabase client"""
    return get_supabase()


def get_db() -> Client:
    """Alternative dependency name for Supabase client"""
    return get_supabase()


async def _fetch_harvest_images(harvest_log_id: str, client: Client, request_id: str = "unknown") -> List[HarvestImage]:
    """Helper function to fetch images for a harvest log"""
    try:
        logger.debug(f"DB: Fetching images for harvest log {harvest_log_id}", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_images",
                        "db_operation": "select",
                        "harvest_log_id": harvest_log_id
                    })
        
        result = client.table("harvest_images").select("*").eq("harvest_log_id", harvest_log_id).order("upload_order").execute()
        
        images = []
        for image_data in result.data:
            # Add public URL to each image
            image_data["public_url"] = storage_service.get_public_url(image_data["file_path"])
            images.append(HarvestImage(**image_data))
        
        logger.debug(f"DB: Successfully fetched {len(images)} images", 
                    extra={
                        "request_id": request_id,
                        "harvest_log_id": harvest_log_id,
                        "image_count": len(images)
                    })
        
        return images
    except Exception as e:
        logger.warning(f"DB: Failed to fetch images for harvest log {harvest_log_id}: {e}", 
                      extra={
                          "request_id": request_id,
                          "harvest_log_id": harvest_log_id,
                          "table": "harvest_images",
                          "db_operation": "select"
                      })
        return []


async def create_harvest_log_in_db(harvest_log_data: HarvestLogCreate, client: Client, request_id: str = "unknown") -> HarvestLog:
    """Create a new harvest log in Supabase"""
    logger.info(f"DB: Creating new harvest log for crop: {harvest_log_data.crop_name}", 
               extra={
                   "request_id": request_id,
                   "table": "harvest_logs",
                   "db_operation": "insert",
                   "crop_name": harvest_log_data.crop_name,
                   "quantity": float(harvest_log_data.quantity)
               })
    logger.debug(f"DB: Harvest log data: {harvest_log_data.model_dump()}", 
                extra={"request_id": request_id})
    
    try:
        # Convert Pydantic model to dict for Supabase
        data = harvest_log_data.model_dump()
        
        # Convert datetime to ISO string for Supabase
        if data.get('harvest_date'):
            data['harvest_date'] = data['harvest_date'].isoformat()
        
        # Insert into Supabase
        logger.debug("DB: Executing INSERT query on harvest_logs table", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_logs",
                        "db_operation": "insert"
                    })
        result = client.table("harvest_logs").insert(data).execute()
        
        if result.data:
            # Convert back to HarvestLog model
            log_data = result.data[0]
            new_log = HarvestLog(**log_data)
            logger.info(f"DB: ✓ Successfully created harvest log with ID: {new_log.id}", 
                       extra={
                           "request_id": request_id,
                           "record_id": str(new_log.id),
                           "table": "harvest_logs",
                           "crop_name": new_log.crop_name
                       })
            return new_log
        else:
            logger.error("DB: Failed to create harvest log - no data returned", 
                        extra={
                            "request_id": request_id,
                            "table": "harvest_logs",
                            "db_operation": "insert"
                        })
            raise Exception("Failed to create harvest log")
            
    except Exception as e:
        logger.error(f"DB: Database error creating harvest log: {e}", 
                    extra={
                        "request_id": request_id,
                        "db_operation": "insert", 
                        "table": "harvest_logs",
                        "crop_name": harvest_log_data.crop_name
                    }, 
                    exc_info=True)
        raise


async def get_all_harvest_logs_from_db(client: Client, request_id: str = "unknown") -> List[HarvestLog]:
    """Get all harvest logs from Supabase with their associated images"""
    logger.info("DB: Retrieving all harvest logs", 
               extra={
                   "request_id": request_id,
                   "table": "harvest_logs",
                   "db_operation": "select"
               })
    
    try:
        logger.debug("DB: Executing SELECT * query on harvest_logs table", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_logs",
                        "db_operation": "select"
                    })
        result = client.table("harvest_logs").select("*").order("created_at", desc=True).execute()
        
        if result.data:
            logs = []
            harvest_log_ids = [log_data["id"] for log_data in result.data]
            
            # Fetch all images for all harvest logs in a single query
            logger.debug(f"DB: Fetching images for {len(harvest_log_ids)} harvest logs", 
                        extra={
                            "request_id": request_id,
                            "table": "harvest_images",
                            "db_operation": "select",
                            "batch_size": len(harvest_log_ids)
                        })
            
            images_result = client.table("harvest_images").select("*").in_("harvest_log_id", harvest_log_ids).order("harvest_log_id, upload_order").execute()
            
            # Group images by harvest_log_id for efficient lookup
            images_by_log_id = {}
            for image_data in images_result.data:
                # Add public URL to each image
                image_data["public_url"] = storage_service.get_public_url(image_data["file_path"])
                harvest_log_id = image_data["harvest_log_id"]
                if harvest_log_id not in images_by_log_id:
                    images_by_log_id[harvest_log_id] = []
                images_by_log_id[harvest_log_id].append(HarvestImage(**image_data))
            
            logger.debug(f"DB: Successfully fetched {len(images_result.data)} images for batch", 
                        extra={
                            "request_id": request_id,
                            "table": "harvest_images",
                            "total_images": len(images_result.data)
                        })
            
            # Create HarvestLog models and assign images
            for log_data in result.data:
                harvest_log = HarvestLog(**log_data)
                # Convert UUID to string for lookup since images_by_log_id uses string keys
                harvest_log.images = images_by_log_id.get(str(harvest_log.id), [])
                logs.append(harvest_log)
            
            logger.info(f"DB: ✓ Successfully retrieved {len(logs)} harvest logs with images", 
                       extra={
                           "request_id": request_id,
                           "table": "harvest_logs",
                           "record_count": len(logs)
                       })
            return logs
        else:
            logger.info("DB: No harvest logs found in database", 
                       extra={
                           "request_id": request_id,
                           "table": "harvest_logs",
                           "record_count": 0
                       })
            return []
            
    except Exception as e:
        logger.error(f"DB: Database error retrieving harvest logs: {e}", 
                    extra={
                        "request_id": request_id,
                        "db_operation": "select", 
                        "table": "harvest_logs"
                    }, 
                    exc_info=True)
        raise


async def get_harvest_log_by_id_from_db(log_id: UUID, client: Client, request_id: str = "unknown") -> Optional[HarvestLog]:
    """Get a harvest log by ID from Supabase with its associated images"""
    logger.info(f"DB: Retrieving harvest log by ID: {log_id}", 
               extra={
                   "request_id": request_id,
                   "table": "harvest_logs",
                   "db_operation": "select",
                   "record_id": str(log_id)
               })
    
    try:
        logger.debug(f"DB: Executing SELECT query for ID: {log_id}", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_logs",
                        "db_operation": "select",
                        "record_id": str(log_id)
                    })
        result = client.table("harvest_logs").select("*").eq("id", str(log_id)).execute()
        
        if result.data and len(result.data) > 0:
            log_data = result.data[0]
            harvest_log = HarvestLog(**log_data)
            
            # Fetch associated images
            harvest_log.images = await _fetch_harvest_images(str(harvest_log.id), client, request_id)
            
            logger.info(f"DB: ✓ Successfully retrieved harvest log: {log_id} with {len(harvest_log.images)} images", 
                       extra={
                           "request_id": request_id,
                           "record_id": str(log_id),
                           "table": "harvest_logs",
                           "image_count": len(harvest_log.images),
                           "crop_name": harvest_log.crop_name
                       })
            return harvest_log
        else:
            logger.info(f"DB: Harvest log not found: {log_id}", 
                       extra={
                           "request_id": request_id,
                           "record_id": str(log_id),
                           "table": "harvest_logs"
                       })
            return None
            
    except Exception as e:
        logger.error(f"DB: Database error retrieving harvest log {log_id}: {e}", 
                    extra={
                        "request_id": request_id,
                        "db_operation": "select", 
                        "table": "harvest_logs", 
                        "record_id": str(log_id)
                    }, 
                    exc_info=True)
        raise


async def update_harvest_log_in_db(log_id: UUID, harvest_log_update: HarvestLogUpdate, client: Client, request_id: str = "unknown") -> Optional[HarvestLog]:
    """Update a harvest log in Supabase"""
    logger.info(f"DB: Updating harvest log: {log_id}", 
               extra={
                   "request_id": request_id,
                   "table": "harvest_logs",
                   "db_operation": "update",
                   "record_id": str(log_id)
               })
    
    try:
        # Convert Pydantic model to dict, excluding unset fields
        update_data = harvest_log_update.model_dump(exclude_unset=True)
        logger.debug(f"DB: Update data: {update_data}", 
                    extra={
                        "request_id": request_id,
                        "record_id": str(log_id),
                        "fields_to_update": list(update_data.keys())
                    })
        
        # Convert datetime to ISO string for Supabase if present
        if update_data.get('harvest_date'):
            update_data['harvest_date'] = update_data['harvest_date'].isoformat()
        
        if not update_data:
            # No fields to update
            logger.info(f"DB: No fields to update for harvest log: {log_id}", 
                       extra={
                           "request_id": request_id,
                           "record_id": str(log_id),
                           "table": "harvest_logs"
                       })
            return await get_harvest_log_by_id_from_db(log_id, client, request_id)
        
        # Update in Supabase
        logger.debug(f"DB: Executing UPDATE query for ID: {log_id}", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_logs",
                        "db_operation": "update",
                        "record_id": str(log_id)
                    })
        result = client.table("harvest_logs").update(update_data).eq("id", str(log_id)).execute()
        
        if result.data and len(result.data) > 0:
            log_data = result.data[0]
            updated_log = HarvestLog(**log_data)
            
            # Fetch associated images
            updated_log.images = await _fetch_harvest_images(str(updated_log.id), client, request_id)
            
            logger.info(f"DB: ✓ Successfully updated harvest log: {log_id}", 
                       extra={
                           "request_id": request_id,
                           "record_id": str(log_id),
                           "table": "harvest_logs",
                           "fields_updated": list(update_data.keys()),
                           "crop_name": updated_log.crop_name
                       })
            return updated_log
        else:
            logger.warning(f"DB: Harvest log not found for update: {log_id}", 
                          extra={
                              "request_id": request_id,
                              "record_id": str(log_id),
                              "table": "harvest_logs"
                          })
            return None
            
    except Exception as e:
        logger.error(f"DB: Database error updating harvest log {log_id}: {e}", 
                    extra={
                        "request_id": request_id,
                        "db_operation": "update", 
                        "table": "harvest_logs", 
                        "record_id": str(log_id)
                    }, 
                    exc_info=True)
        raise


async def delete_harvest_log_from_db(log_id: UUID, client: Client, request_id: str = "unknown") -> Optional[HarvestLog]:
    """Delete a harvest log from Supabase (images will be cascade deleted)"""
    logger.info(f"DB: Deleting harvest log: {log_id}", 
               extra={
                   "request_id": request_id,
                   "table": "harvest_logs",
                   "db_operation": "delete",
                   "record_id": str(log_id)
               })
    
    try:
        # Get the log first with its images
        log = await get_harvest_log_by_id_from_db(log_id, client, request_id)
        if not log:
            logger.warning(f"DB: Harvest log not found for deletion: {log_id}", 
                          extra={
                              "request_id": request_id,
                              "record_id": str(log_id),
                              "table": "harvest_logs"
                          })
            return None
        
        # Delete associated images from storage
        for image in log.images:
            try:
                await storage_service.delete_image(image.file_path)
                logger.debug(f"DB: Deleted image from storage: {image.file_path}", 
                           extra={
                               "request_id": request_id,
                               "file_path": image.file_path,
                               "image_id": str(image.id)
                           })
            except Exception as e:
                logger.warning(f"DB: Failed to delete image from storage {image.file_path}: {e}", 
                              extra={
                                  "request_id": request_id,
                                  "file_path": image.file_path,
                                  "image_id": str(image.id)
                              })
        
        # Delete from Supabase (this will cascade delete images due to foreign key constraint)
        logger.debug(f"DB: Executing DELETE query for ID: {log_id}", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_logs",
                        "db_operation": "delete",
                        "record_id": str(log_id)
                    })
        result = client.table("harvest_logs").delete().eq("id", str(log_id)).execute()
        
        logger.info(f"DB: ✓ Successfully deleted harvest log: {log_id} and {len(log.images)} associated images", 
                   extra={
                       "request_id": request_id,
                       "record_id": str(log_id),
                       "table": "harvest_logs",
                       "deleted_images": len(log.images),
                       "crop_name": log.crop_name
                   })
        # Return the deleted log
        return log
            
    except Exception as e:
        logger.error(f"DB: Database error deleting harvest log {log_id}: {e}", 
                    extra={
                        "request_id": request_id,
                        "db_operation": "delete", 
                        "table": "harvest_logs", 
                        "record_id": str(log_id)
                    }, 
                    exc_info=True)
        raise 