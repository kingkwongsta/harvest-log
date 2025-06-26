"""
Image upload and management API endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from typing import List, Optional
from uuid import UUID

from app.models import (
    FileUploadResponse, 
    HarvestImage, 
    HarvestImageCreate,
    ErrorResponse
)
from app.storage import storage_service
from app.database import get_supabase
from app.dependencies import get_db
from app.logging_config import get_api_logger

# Set up proper structured logging
logger = get_api_logger()

router = APIRouter(prefix="/api/images", tags=["images"])


@router.post("/upload/{harvest_log_id}", response_model=FileUploadResponse)
async def upload_harvest_image(
    harvest_log_id: UUID,
    request: Request,
    file: UploadFile = File(...),
    upload_order: int = Form(0),
    supabase=Depends(get_db)
):
    """
    Upload an image for a harvest log to Supabase Storage
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Starting image upload for harvest log {harvest_log_id}", 
                   extra={
                       "request_id": request_id,
                       "harvest_log_id": str(harvest_log_id),
                       "file_name": file.filename,
                       "content_type": file.content_type,
                       "upload_order": upload_order
                   })
        
        # Verify harvest log exists
        logger.debug(f"API: Verifying harvest log {harvest_log_id} exists", 
                    extra={"request_id": request_id, "record_id": str(harvest_log_id)})
        
        harvest_check = supabase.table("harvest_logs").select("id").eq("id", str(harvest_log_id)).execute()
        if not harvest_check.data:
            logger.warning(f"API: Harvest log not found: {harvest_log_id}", 
                          extra={"request_id": request_id, "record_id": str(harvest_log_id)})
            raise HTTPException(status_code=404, detail="Harvest log not found")
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        logger.info(f"API: Uploading file to storage - size: {file_size} bytes", 
                   extra={
                       "request_id": request_id,
                       "file_size": file_size,
                       "file_name": file.filename
                   })
        
        # Upload to Supabase Storage
        success, message, file_info = await storage_service.upload_image(
            file_content=file_content,
            original_filename=file.filename or "unknown",
            harvest_log_id=str(harvest_log_id)
        )
        
        if not success:
            logger.error(f"API: Storage upload failed: {message}", 
                        extra={
                            "request_id": request_id,
                            "harvest_log_id": str(harvest_log_id),
                            "file_name": file.filename,
                            "error": message
                        })
            return FileUploadResponse(
                success=False,
                message=message,
                data=None
            )
        
        logger.info(f"API: File uploaded to storage successfully: {file_info['file_path']}", 
                   extra={
                       "request_id": request_id,
                       "file_path": file_info["file_path"],
                       "storage_filename": file_info["filename"]
                   })
        
        # Save image metadata to database
        image_data = {
            "harvest_log_id": str(harvest_log_id),
            "filename": file_info["filename"],
            "original_filename": file_info["original_filename"],
            "file_path": file_info["file_path"],
            "file_size": file_info["file_size"],
            "mime_type": file_info["mime_type"],
            "width": file_info["width"],
            "height": file_info["height"],
            "upload_order": upload_order
        }
        
        logger.debug("API: Saving image metadata to database", 
                    extra={
                        "request_id": request_id,
                        "table": "harvest_images",
                        "db_operation": "insert"
                    })
        
        result = supabase.table("harvest_images").insert(image_data).execute()
        
        if not result.data:
            logger.error("API: Failed to save image metadata to database", 
                        extra={
                            "request_id": request_id,
                            "table": "harvest_images",
                            "db_operation": "insert",
                            "harvest_log_id": str(harvest_log_id)
                        })
            # If database insert fails, clean up uploaded file
            await storage_service.delete_image(file_info["file_path"])
            return FileUploadResponse(
                success=False,
                message="Failed to save image metadata",
                data=None
            )
        
        # Create response with the saved image data
        saved_image = result.data[0]
        harvest_image = HarvestImage(
            id=saved_image["id"],
            harvest_log_id=saved_image["harvest_log_id"],
            filename=saved_image["filename"],
            original_filename=saved_image["original_filename"],
            file_path=saved_image["file_path"],
            file_size=saved_image["file_size"],
            mime_type=saved_image["mime_type"],
            width=saved_image["width"],
            height=saved_image["height"],
            upload_order=saved_image["upload_order"],
            created_at=saved_image["created_at"],
            updated_at=saved_image["updated_at"]
        )
        
        logger.info(f"API: Image upload completed successfully - ID: {saved_image['id']}", 
                   extra={
                       "request_id": request_id,
                       "record_id": saved_image["id"],
                       "harvest_log_id": str(harvest_log_id),
                       "file_name": file_info["filename"],
                       "file_size": file_info["file_size"]
                   })
        
        return FileUploadResponse(
            success=True,
            message="Image uploaded successfully",
            data=harvest_image
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Failed to upload image: {str(e)}", 
                    extra={
                        "request_id": request_id,
                        "harvest_log_id": str(harvest_log_id),
                        "file_name": file.filename if file else "unknown"
                    }, 
                    exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during image upload")


@router.post("/upload-multiple/{harvest_log_id}")
async def upload_multiple_harvest_images(
    harvest_log_id: UUID,
    request: Request,
    files: List[UploadFile] = File(...),
    supabase=Depends(get_db)
):
    """
    Upload multiple images for a harvest log
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Starting multiple image upload for harvest log {harvest_log_id}", 
                   extra={
                       "request_id": request_id,
                       "harvest_log_id": str(harvest_log_id),
                       "file_count": len(files)
                   })
        
        # Verify harvest log exists
        harvest_check = supabase.table("harvest_logs").select("id").eq("id", str(harvest_log_id)).execute()
        if not harvest_check.data:
            logger.warning(f"API: Harvest log not found for multiple upload: {harvest_log_id}", 
                          extra={"request_id": request_id, "record_id": str(harvest_log_id)})
            raise HTTPException(status_code=404, detail="Harvest log not found")
        
        # Limit to 5 files
        if len(files) > 5:
            logger.warning(f"API: Too many files in upload request: {len(files)}", 
                          extra={
                              "request_id": request_id,
                              "file_count": len(files),
                              "max_allowed": 5
                          })
            raise HTTPException(status_code=400, detail="Maximum 5 images allowed per upload")
        
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
                
                # Read file content
                file_content = await file.read()
                file_size = len(file_content)
                
                print(f"🔄 Processing file {i+1}/{len(files)}: {file.filename}")
                print(f"   Content type: {file.content_type}")
                print(f"   Size: {file_size} bytes")
                print(f"   First 16 bytes: {file_content[:16].hex() if len(file_content) >= 16 else 'N/A'}")
                
                # Upload to Supabase Storage
                success, message, file_info = await storage_service.upload_image(
                    file_content=file_content,
                    original_filename=file.filename or f"unknown_{i}",
                    harvest_log_id=str(harvest_log_id)
                )
                
                if not success:
                    logger.warning(f"API: Failed to upload file {file.filename}: {message}", 
                                 extra={
                                     "request_id": request_id,
                                     "file_name": file.filename,
                                     "error": message,
                                     "file_index": i
                                 })
                    # Add detailed logging for debugging
                    print(f"🚨 UPLOAD FAILURE DEBUG:")
                    print(f"   File: {file.filename}")
                    print(f"   Content Type: {file.content_type}")
                    print(f"   Size: {len(file_content)} bytes")
                    print(f"   Error: {message}")
                    failed_uploads.append({"filename": file.filename, "error": message})
                    continue
                
                # Save image metadata to database
                image_data = {
                    "harvest_log_id": str(harvest_log_id),
                    "filename": file_info["filename"],
                    "original_filename": file_info["original_filename"],
                    "file_path": file_info["file_path"],
                    "file_size": file_info["file_size"],
                    "mime_type": file_info["mime_type"],
                    "width": file_info["width"],
                    "height": file_info["height"],
                    "upload_order": i
                }
                
                result = supabase.table("harvest_images").insert(image_data).execute()
                
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
                                   "table": "harvest_images",
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
                       "harvest_log_id": str(harvest_log_id),
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Failed multiple image upload: {str(e)}", 
                    extra={
                        "request_id": request_id,
                        "harvest_log_id": str(harvest_log_id)
                    }, 
                    exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during multiple image upload")


@router.get("/harvest/{harvest_log_id}")
async def get_harvest_images(
    harvest_log_id: UUID,
    request: Request,
    supabase=Depends(get_db)
):
    """
    Get all images for a specific harvest log
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Retrieving images for harvest log {harvest_log_id}", 
                   extra={
                       "request_id": request_id,
                       "harvest_log_id": str(harvest_log_id),
                       "table": "harvest_images",
                       "db_operation": "select"
                   })
        
        result = supabase.table("harvest_images").select("*").eq("harvest_log_id", str(harvest_log_id)).order("upload_order").execute()
        
        images = result.data or []
        
        logger.info(f"API: Retrieved {len(images)} images for harvest log {harvest_log_id}", 
                   extra={
                       "request_id": request_id,
                       "harvest_log_id": str(harvest_log_id),
                       "image_count": len(images)
                   })
        
        return {
            "success": True,
            "message": f"Retrieved {len(images)} images",
            "data": images
        }
        
    except Exception as e:
        logger.error(f"API: Failed to retrieve images for harvest log {harvest_log_id}: {str(e)}", 
                    extra={
                        "request_id": request_id,
                        "harvest_log_id": str(harvest_log_id)
                    }, 
                    exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error while retrieving images")


@router.delete("/{image_id}")
async def delete_harvest_image(
    image_id: UUID,
    request: Request,
    supabase=Depends(get_db)
):
    """
    Delete a harvest image
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"API: Deleting harvest image {image_id}", 
                   extra={
                       "request_id": request_id,
                       "record_id": str(image_id),
                       "table": "harvest_images",
                       "db_operation": "delete"
                   })
        
        # Get image info first
        image_result = supabase.table("harvest_images").select("*").eq("id", str(image_id)).execute()
        
        if not image_result.data:
            logger.warning(f"API: Image not found for deletion: {image_id}", 
                          extra={"request_id": request_id, "record_id": str(image_id)})
            raise HTTPException(status_code=404, detail="Image not found")
        
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
        delete_result = supabase.table("harvest_images").delete().eq("id", str(image_id)).execute()
        
        if not delete_result.data:
            logger.error(f"API: Failed to delete image from database: {image_id}", 
                        extra={
                            "request_id": request_id,
                            "record_id": str(image_id),
                            "table": "harvest_images"
                        })
            raise HTTPException(status_code=500, detail="Failed to delete image from database")
        
        logger.info(f"API: Successfully deleted harvest image {image_id}", 
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Failed to delete harvest image {image_id}: {str(e)}", 
                    extra={
                        "request_id": request_id,
                        "record_id": str(image_id)
                    }, 
                    exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error while deleting image") 