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
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the storage bucket exists"""
        try:
            # List buckets to check if our bucket exists
            buckets = self.supabase.storage.list_buckets()
            bucket_exists = any(bucket.name == self.bucket_name if hasattr(bucket, 'name') else bucket.get('name') == self.bucket_name for bucket in buckets)
            
            if not bucket_exists:
                print(f"Creating bucket: {self.bucket_name}")
                result = self.supabase.storage.create_bucket(
                    self.bucket_name, 
                    {'public': True}
                )
                print(f"Bucket creation result: {result}")
        except Exception as e:
            print(f"Warning: Could not verify/create bucket: {e}")
    
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
            
            # Upload to Supabase Storage with proper content-type
            try:
                response = self.supabase.storage.from_(self.bucket_name).upload(
                    path=filename,
                    file=file_content,
                    file_options={
                        "content-type": mime_type,
                        "cache-control": "3600"
                    }
                )
                
                # Check if upload was successful
                if not response or response.status_code != 200:
                    return False, f"Upload failed with status: {response.status_code if response else 'No response'}", None
                    
            except Exception as upload_error:
                return False, f"Upload error: {str(upload_error)}", None
            
            # Get public URL
            try:
                public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(filename)
            except Exception as url_error:
                print(f"Warning: Could not get public URL: {url_error}")
                public_url = ""
            
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
            
            if response and isinstance(response, dict) and 'error' in response:
                return False, f"Delete failed: {response['error']}"
            
            return True, "File deleted successfully"
            
        except Exception as e:
            return False, f"Delete error: {str(e)}"
    
    def get_public_url(self, file_path: str) -> str:
        """Get public URL for a file"""
        try:
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
            return public_url if isinstance(public_url, str) else ""
        except Exception as e:
            print(f"Error getting public URL: {e}")
            return ""


# Global storage service instance
storage_service = StorageService() 