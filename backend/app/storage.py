"""
Storage service for handling file uploads to Supabase Storage
"""

import os
import uuid
import mimetypes
from typing import Optional, Tuple, BinaryIO
from datetime import datetime
from PIL import Image
import io

from supabase import create_client, Client
from app.config import settings


class StorageService:
    """Service for handling file storage operations with Supabase Storage"""
    
    def __init__(self):
        self.supabase: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_key or settings.supabase_anon_key
        )
        self.bucket_name = "harvest-images"
    
    def _generate_filename(self, original_filename: str, harvest_log_id: str) -> str:
        """Generate a unique filename for storage"""
        # Get file extension
        _, ext = os.path.splitext(original_filename)
        
        # Generate unique filename with timestamp and UUID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        return f"{harvest_log_id}/{timestamp}_{unique_id}{ext}"
    
    def _get_image_dimensions(self, file_content: bytes, mime_type: str) -> Tuple[Optional[int], Optional[int]]:
        """Get image dimensions from file content"""
        try:
            if mime_type.startswith('image/'):
                image = Image.open(io.BytesIO(file_content))
                return image.width, image.height
        except Exception as e:
            print(f"Error getting image dimensions: {e}")
        
        return None, None
    
    def _validate_file(self, file_content: bytes, filename: str) -> Tuple[bool, str, str]:
        """Validate uploaded file"""
        # Check file size (10MB limit)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(file_content) > max_size:
            return False, "File size exceeds 10MB limit", ""
        
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(filename)
        if not mime_type:
            mime_type = "application/octet-stream"
        
        # Check if it's an allowed image type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if mime_type not in allowed_types:
            return False, f"File type {mime_type} not allowed. Allowed types: {', '.join(allowed_types)}", ""
        
        return True, "Valid file", mime_type
    
    async def upload_image(
        self, 
        file_content: bytes, 
        original_filename: str, 
        harvest_log_id: str
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Upload an image to Supabase Storage
        
        Returns:
            Tuple[bool, str, Optional[dict]]: (success, message, file_info)
        """
        try:
            # Validate file
            is_valid, message, mime_type = self._validate_file(file_content, original_filename)
            if not is_valid:
                return False, message, None
            
            # Generate unique filename
            filename = self._generate_filename(original_filename, harvest_log_id)
            
            # Get image dimensions
            width, height = self._get_image_dimensions(file_content, mime_type)
            
            # Upload to Supabase Storage
            response = self.supabase.storage.from_(self.bucket_name).upload(
                path=filename,
                file=file_content,
                file_options={
                    "content-type": mime_type,
                    "upsert": False
                }
            )
            
            # Check if upload was successful
            if hasattr(response, 'error') and response.error:
                return False, f"Upload failed: {response.error}", None
            
            # Get public URL
            public_url_response = self.supabase.storage.from_(self.bucket_name).get_public_url(filename)
            public_url = public_url_response if isinstance(public_url_response, str) else public_url_response.get('publicUrl', '')
            
            # Prepare file info
            file_info = {
                'filename': filename,
                'original_filename': original_filename,
                'file_path': filename,
                'file_size': len(file_content),
                'mime_type': mime_type,
                'width': width,
                'height': height,
                'public_url': public_url
            }
            
            return True, "File uploaded successfully", file_info
            
        except Exception as e:
            return False, f"Upload error: {str(e)}", None
    
    async def delete_image(self, file_path: str) -> Tuple[bool, str]:
        """Delete an image from Supabase Storage"""
        try:
            response = self.supabase.storage.from_(self.bucket_name).remove([file_path])
            
            if hasattr(response, 'error') and response.error:
                return False, f"Delete failed: {response.error}"
            
            return True, "File deleted successfully"
            
        except Exception as e:
            return False, f"Delete error: {str(e)}"
    
    def get_public_url(self, file_path: str) -> str:
        """Get public URL for a file"""
        try:
            public_url_response = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
            return public_url_response if isinstance(public_url_response, str) else public_url_response.get('publicUrl', '')
        except Exception as e:
            print(f"Error getting public URL: {e}")
            return ""


# Global storage service instance
storage_service = StorageService() 