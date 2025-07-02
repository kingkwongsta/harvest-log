"""
Unified event image upload and management API endpoints
Supports all event types: harvest, bloom, snapshot
"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, Request, HTTPException
from typing import List, Optional
from uuid import UUID

from app.plant_models import (
    EventImage, 
    EventImageCreate,
    EventImageResponse,
    EventType
)
from app.storage import storage_service
from app.database import get_supabase
from app.dependencies import get_db
from app.logging_config import get_api_logger
from app.exceptions import NotFoundError, StorageError, ValidationException, DatabaseError
from app.validators import DataSanitizer

# Set up proper structured logging
logger = get_api_logger()

router = APIRouter(prefix="/api/images", tags=["event-images"])


@router.post("/upload/{event_id}", response_model=EventImageResponse)
async def upload_event_image(
    event_id: UUID,
    request: Request,
    file: UploadFile = File(...),
    upload_order: int = Form(0),
    supabase=Depends(get_db)
):
    """
    Upload a single image for any event type (harvest, bloom, snapshot)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Starting image upload for event {event_id}", 
                   extra={
                       "request_id": request_id,
                       "event_id": str(event_id),
                       "file_name": file.filename,
                       "content_type": file.content_type,
                       "upload_order": upload_order
                   })
        
        # Verify event exists and get event type
        logger.debug(f"API: Verifying event {event_id} exists", 
                    extra={"request_id": request_id, "record_id": str(event_id)})
        
        event_check = supabase.table("plant_events").select("id, event_type").eq("id", str(event_id)).execute()
        if not event_check.data:
            logger.warning(f"API: Event not found: {event_id}", 
                          extra={"request_id": request_id, "record_id": str(event_id)})
            raise NotFoundError("Event", str(event_id))
        
        event_data = event_check.data[0]
        event_type = event_data.get("event_type", "event")
        
        # Read and validate file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file upload using our sanitizer
        try:
            validated_data = DataSanitizer.sanitize_image_data(
                filename=file.filename or "unknown",
                file_content=file_content
            )
        except ValidationException:
            raise  # Re-raise validation exceptions
        except Exception as e:
            logger.error(f"File validation failed: {e}", extra={"request_id": request_id})
            raise ValidationException(f"File validation failed: {str(e)}")
        
        logger.info(f"API: Uploading file to storage - size: {file_size} bytes", 
                   extra={
                       "request_id": request_id,
                       "file_size": file_size,
                       "file_name": file.filename,
                       "event_type": event_type
                   })
        
        # Upload to Supabase Storage using validated data
        success, message, file_info = await storage_service.upload_event_image(
            file_content=validated_data['file_content'],
            original_filename=validated_data['filename'],
            event_id=str(event_id),
            event_type=event_type
        )
        
        if not success:
            logger.error(f"API: Storage upload failed: {message}", 
                        extra={
                            "request_id": request_id,
                            "event_id": str(event_id),
                            "file_name": file.filename,
                            "error": message
                        })
            raise StorageError(message)
        
        logger.info(f"API: File uploaded to storage successfully: {file_info['file_path']}", 
                   extra={
                       "request_id": request_id,
                       "file_path": file_info["file_path"],
                       "storage_filename": file_info["filename"]
                   })
        
        # Save image metadata to database using EventImage model
        image_data = {
            "event_id": str(event_id),
            "filename": file_info["filename"],
            "original_filename": file_info["original_filename"],
            "file_path": file_info["file_path"],
            "file_size": file_info["file_size"],
            "mime_type": file_info["mime_type"],
            "width": file_info["width"],
            "height": file_info["height"],
            "upload_order": upload_order,
            "public_url": file_info["public_url"]
        }
        
        logger.debug("API: Saving image metadata to database", 
                    extra={
                        "request_id": request_id,
                        "table": "event_images",
                        "db_operation": "insert"
                    })
        
        result = supabase.table("event_images").insert(image_data).execute()
        
        if not result.data:
            logger.error("API: Failed to save image metadata to database", 
                        extra={
                            "request_id": request_id,
                            "table": "event_images",
                            "db_operation": "insert",
                            "event_id": str(event_id)
                        })
            # If database insert fails, clean up uploaded file
            await storage_service.delete_image(file_info["file_path"])
            raise DatabaseError("Failed to save image metadata")
        
        # Create response with the saved image data
        saved_image = result.data[0]
        event_image = EventImage(
            id=saved_image["id"],
            event_id=saved_image["event_id"],
            filename=saved_image["filename"],
            original_filename=saved_image["original_filename"],
            file_path=saved_image["file_path"],
            file_size=saved_image["file_size"],
            mime_type=saved_image["mime_type"],
            width=saved_image["width"],
            height=saved_image["height"],
            upload_order=saved_image["upload_order"],
            created_at=saved_image["created_at"],
            updated_at=saved_image["updated_at"],
            public_url=saved_image.get("public_url") or file_info["public_url"]
        )
        
        logger.info(f"API: Image upload completed successfully - ID: {saved_image['id']}", 
                   extra={
                       "request_id": request_id,
                       "record_id": saved_image["id"],
                       "event_id": str(event_id),
                       "file_name": file_info["filename"],
                       "file_size": file_info["file_size"]
                   })
        
        return EventImageResponse(
            success=True,
            message="Image uploaded successfully",
            data=event_image
        )
        
    except (NotFoundError, StorageError, DatabaseError, ValidationException):
        raise
    except Exception as e:
        logger.error(f"API: Failed to upload image: {str(e)}", 
                    extra={
                        "request_id": request_id,
                        "event_id": str(event_id),
                        "file_name": file.filename if file else "unknown"
                    }, 
                    exc_info=True)
        raise StorageError(f"Failed to upload image: {str(e)}")


@router.post("/upload-multiple/{event_id}")
async def upload_multiple_event_images(
    event_id: UUID,
    request: Request,
    files: List[UploadFile] = File(...),
    supabase=Depends(get_db)
):
    """
    Upload multiple images for any event type (harvest, bloom, snapshot)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Starting multiple image upload for event {event_id}", 
                   extra={
                       "request_id": request_id,
                       "event_id": str(event_id),
                       "file_count": len(files)
                   })
        
        # Verify event exists and get event type
        event_check = supabase.table("plant_events").select("id, event_type").eq("id", str(event_id)).execute()
        if not event_check.data:
            logger.warning(f"API: Event not found for multiple upload: {event_id}", 
                          extra={"request_id": request_id, "record_id": str(event_id)})
            raise NotFoundError("Event", str(event_id))
        
        event_data = event_check.data[0]
        event_type = event_data.get("event_type", "event")
        
        # Limit to 5 files
        if len(files) > 5:
            logger.warning(f"API: Too many files in upload request: {len(files)}", 
                          extra={
                              "request_id": request_id,
                              "file_count": len(files),
                              "max_allowed": 5
                          })
            raise ValidationException("Maximum 5 images allowed per upload")
        
        uploaded_images = []
        failed_uploads = []
        
        for i, file in enumerate(files):
            try:
                logger.debug(f"API: Processing file {i+1}/{len(files)}: {file.filename}", 
                           extra={
                               "request_id": request_id,
                               "file_index": i,
                               "file_name": file.filename,
                               "content_type": file.content_type
                           })
                
                # Read and validate file content
                file_content = await file.read()
                file_size = len(file_content)
                
                # Validate file upload
                try:
                    validated_data = DataSanitizer.sanitize_image_data(
                        filename=file.filename or f"unknown_{i}",
                        file_content=file_content
                    )
                except ValidationException as e:
                    logger.warning(f"File validation failed for {file.filename}: {e}", 
                                 extra={"request_id": request_id})
                    failed_uploads.append({"filename": file.filename, "error": str(e)})
                    continue
                except Exception as e:
                    logger.error(f"Unexpected validation error for {file.filename}: {e}", 
                               extra={"request_id": request_id})
                    failed_uploads.append({"filename": file.filename, "error": f"Validation error: {str(e)}"})
                    continue
                
                print(f"🔄 Processing file {i+1}/{len(files)}: {file.filename}")
                print(f"   Content type: {file.content_type}")
                print(f"   Size: {file_size} bytes")
                print(f"   Event type: {event_type}")
                
                # Upload to Supabase Storage using validated data
                success, message, file_info = await storage_service.upload_event_image(
                    file_content=validated_data['file_content'],
                    original_filename=validated_data['filename'],
                    event_id=str(event_id),
                    event_type=event_type
                )
                
                if not success:
                    logger.warning(f"API: Failed to upload file {file.filename}: {message}", 
                                 extra={
                                     "request_id": request_id,
                                     "file_name": file.filename,
                                     "error": message,
                                     "file_index": i
                                 })
                    failed_uploads.append({"filename": file.filename, "error": message})
                    continue
                
                # Save image metadata to database using EventImage model
                image_data = {
                    "event_id": str(event_id),
                    "filename": file_info["filename"],
                    "original_filename": file_info["original_filename"],
                    "file_path": file_info["file_path"],
                    "file_size": file_info["file_size"],
                    "mime_type": file_info["mime_type"],
                    "width": file_info["width"],
                    "height": file_info["height"],
                    "upload_order": i,
                    "public_url": file_info["public_url"]
                }
                
                result = supabase.table("event_images").insert(image_data).execute()
                
                if result.data:
                    uploaded_images.append(result.data[0])
                    logger.info(f"API: Successfully uploaded and saved image {file.filename}", 
                               extra={
                                   "request_id": request_id,
                                   "record_id": result.data[0]["id"],
                                   "file_name": file.filename,
                                   "file_size": file_size
                               })
                else:
                    # Clean up uploaded file if database insert fails
                    await storage_service.delete_image(file_info["file_path"])
                    failed_uploads.append({"filename": file.filename, "error": "Failed to save metadata"})
                    logger.error(f"API: Failed to save metadata for {file.filename}", 
                               extra={
                                   "request_id": request_id,
                                   "file_name": file.filename,
                                   "table": "event_images",
                                   "db_operation": "insert"
                               })
                    
            except Exception as e:
                logger.error(f"API: Error processing file {file.filename}: {str(e)}", 
                           extra={
                               "request_id": request_id,
                               "file_name": file.filename,
                               "file_index": i
                           }, 
                           exc_info=True)
                failed_uploads.append({"filename": file.filename, "error": str(e)})
        
        logger.info(f"API: Multiple upload completed - {len(uploaded_images)} success, {len(failed_uploads)} failed", 
                   extra={
                       "request_id": request_id,
                       "event_id": str(event_id),
                       "total_uploaded": len(uploaded_images),
                       "total_failed": len(failed_uploads)
                   })
        
        return {
            "success": len(uploaded_images) > 0,
            "message": f"Uploaded {len(uploaded_images)} images successfully",
            "data": {
                "uploaded_images": uploaded_images,
                "failed_uploads": failed_uploads,
                "total_uploaded": len(uploaded_images),
                "total_failed": len(failed_uploads)
            }
        }
        
    except (NotFoundError, ValidationException):
        raise
    except Exception as e:
        logger.error(f"API: Failed multiple image upload: {str(e)}", 
                    extra={
                        "request_id": request_id,
                        "event_id": str(event_id)
                    }, 
                    exc_info=True)
        raise StorageError(f"Failed multiple image upload: {str(e)}")


@router.get("/event/{event_id}")
async def get_event_images(
    event_id: UUID,
    request: Request,
    supabase=Depends(get_db)
):
    """
    Get all images for a specific event (any event type)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Retrieving images for event {event_id}", 
                   extra={
                       "request_id": request_id,
                       "event_id": str(event_id),
                       "table": "event_images",
                       "db_operation": "select"
                   })
        
        result = supabase.table("event_images").select("*").eq("event_id", str(event_id)).order("upload_order").execute()
        
        images = result.data or []
        
        logger.info(f"API: Retrieved {len(images)} images for event {event_id}", 
                   extra={
                       "request_id": request_id,
                       "event_id": str(event_id),
                       "image_count": len(images)
                   })
        
        return {
            "success": True,
            "message": f"Retrieved {len(images)} images",
            "data": images
        }
        
    except Exception as e:
        logger.error(f"API: Failed to retrieve images for event {event_id}: {str(e)}", 
                    extra={
                        "request_id": request_id,
                        "event_id": str(event_id)
                    }, 
                    exc_info=True)
        raise DatabaseError(f"Failed to retrieve images: {str(e)}")


@router.delete("/{image_id}")
async def delete_event_image(
    image_id: UUID,
    request: Request,
    supabase=Depends(get_db)
):
    """
    Delete an event image (any event type)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Deleting event image {image_id}", 
                   extra={
                       "request_id": request_id,
                       "record_id": str(image_id),
                       "table": "event_images",
                       "db_operation": "delete"
                   })
        
        # Get image info first
        image_result = supabase.table("event_images").select("*").eq("id", str(image_id)).execute()
        
        if not image_result.data:
            logger.warning(f"API: Image not found for deletion: {image_id}", 
                          extra={"request_id": request_id, "record_id": str(image_id)})
            raise NotFoundError("Image", str(image_id))
        
        image_data = image_result.data[0]
        file_path = image_data.get("file_path")
        
        # Delete from storage first
        if file_path:
            logger.debug(f"API: Deleting image from storage: {file_path}", 
                        extra={
                            "request_id": request_id,
                            "file_path": file_path
                        })
            await storage_service.delete_image(file_path)
        
        # Delete from database
        delete_result = supabase.table("event_images").delete().eq("id", str(image_id)).execute()
        
        if not delete_result.data:
            logger.error(f"API: Failed to delete image from database: {image_id}", 
                        extra={
                            "request_id": request_id,
                            "record_id": str(image_id),
                            "table": "event_images"
                        })
            raise DatabaseError("Failed to delete image from database")
        
        logger.info(f"API: Successfully deleted event image {image_id}", 
                   extra={
                       "request_id": request_id,
                       "record_id": str(image_id),
                       "file_path": file_path
                   })
        
        return {
            "success": True,
            "message": "Image deleted successfully",
            "data": {"deleted_image_id": str(image_id)}
        }
        
    except (NotFoundError, DatabaseError):
        raise
    except Exception as e:
        logger.error(f"API: Failed to delete event image {image_id}: {str(e)}", 
                    extra={
                        "request_id": request_id,
                        "record_id": str(image_id)
                    }, 
                    exc_info=True)
        raise StorageError(f"Failed to delete image: {str(e)}")