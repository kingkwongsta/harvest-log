"""
Image upload and management API endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
import logging

from app.models import (
    FileUploadResponse, 
    HarvestImage, 
    HarvestImageCreate,
    ErrorResponse
)
from app.storage import storage_service
from app.database import get_supabase_client
from app.dependencies import get_db

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/images", tags=["images"])


@router.post("/upload/{harvest_log_id}", response_model=FileUploadResponse)
async def upload_harvest_image(
    harvest_log_id: UUID,
    file: UploadFile = File(...),
    upload_order: int = Form(0),
    supabase=Depends(get_db)
):
    """
    Upload an image for a harvest log to Supabase Storage
    """
    try:
        # Verify harvest log exists
        harvest_check = supabase.table("harvest_logs").select("id").eq("id", str(harvest_log_id)).execute()
        if not harvest_check.data:
            raise HTTPException(status_code=404, detail="Harvest log not found")
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Supabase Storage
        success, message, file_info = await storage_service.upload_image(
            file_content=file_content,
            original_filename=file.filename or "unknown",
            harvest_log_id=str(harvest_log_id)
        )
        
        if not success:
            return FileUploadResponse(
                success=False,
                message=message,
                data=None
            )
        
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
        
        result = supabase.table("harvest_images").insert(image_data).execute()
        
        if not result.data:
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
        
        return FileUploadResponse(
            success=True,
            message="Image uploaded successfully",
            data=harvest_image
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during image upload")


@router.post("/upload-multiple/{harvest_log_id}")
async def upload_multiple_harvest_images(
    harvest_log_id: UUID,
    files: List[UploadFile] = File(...),
    supabase=Depends(get_db)
):
    """
    Upload multiple images for a harvest log
    """
    try:
        # Verify harvest log exists
        harvest_check = supabase.table("harvest_logs").select("id").eq("id", str(harvest_log_id)).execute()
        if not harvest_check.data:
            raise HTTPException(status_code=404, detail="Harvest log not found")
        
        # Limit to 5 files
        if len(files) > 5:
            raise HTTPException(status_code=400, detail="Maximum 5 images allowed per upload")
        
        uploaded_images = []
        failed_uploads = []
        
        for i, file in enumerate(files):
            try:
                # Read file content
                file_content = await file.read()
                
                # Upload to Supabase Storage
                success, message, file_info = await storage_service.upload_image(
                    file_content=file_content,
                    original_filename=file.filename or f"unknown_{i}",
                    harvest_log_id=str(harvest_log_id)
                )
                
                if not success:
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
                else:
                    # Clean up uploaded file if database insert fails
                    await storage_service.delete_image(file_info["file_path"])
                    failed_uploads.append({"filename": file.filename, "error": "Failed to save metadata"})
                    
            except Exception as e:
                failed_uploads.append({"filename": file.filename, "error": str(e)})
        
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
        logger.error(f"Error uploading multiple images: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during multiple image upload")


@router.get("/harvest/{harvest_log_id}")
async def get_harvest_images(
    harvest_log_id: UUID,
    supabase=Depends(get_db)
):
    """
    Get all images for a specific harvest log
    """
    try:
        result = supabase.table("harvest_images").select("*").eq("harvest_log_id", str(harvest_log_id)).order("upload_order").execute()
        
        # Add public URLs to each image
        images_with_urls = []
        for image in result.data:
            image["public_url"] = storage_service.get_public_url(image["file_path"])
            images_with_urls.append(image)
        
        return {
            "success": True,
            "message": f"Retrieved {len(images_with_urls)} images",
            "data": images_with_urls
        }
        
    except Exception as e:
        logger.error(f"Error retrieving harvest images: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{image_id}")
async def delete_harvest_image(
    image_id: UUID,
    supabase=Depends(get_db)
):
    """
    Delete a specific harvest image
    """
    try:
        # Get image info from database
        image_result = supabase.table("harvest_images").select("*").eq("id", str(image_id)).execute()
        
        if not image_result.data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_data = image_result.data[0]
        
        # Delete from Supabase Storage
        storage_success, storage_message = await storage_service.delete_image(image_data["file_path"])
        
        # Delete from database (even if storage deletion fails, we should clean up the metadata)
        db_result = supabase.table("harvest_images").delete().eq("id", str(image_id)).execute()
        
        if not storage_success:
            logger.warning(f"Storage deletion failed for image {image_id}: {storage_message}")
        
        return {
            "success": True,
            "message": "Image deleted successfully",
            "data": {
                "deleted_image_id": str(image_id),
                "storage_deletion_success": storage_success,
                "storage_message": storage_message if not storage_success else "File deleted from storage"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") 