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
        self.bucket_name = settings.supabase_storage_bucket
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the storage bucket exists"""
        try:
            print(f"🔍 Checking if bucket '{self.bucket_name}' exists...")
            
            # List buckets to check if our bucket exists
            buckets = self.supabase.storage.list_buckets()
            print(f"📦 Found {len(buckets)} buckets total")
            
            bucket_exists = any(bucket.name == self.bucket_name if hasattr(bucket, 'name') else bucket.get('name') == self.bucket_name for bucket in buckets)
            
            if bucket_exists:
                print(f"✅ Bucket '{self.bucket_name}' already exists")
                return
            
            print(f"⚠️ Bucket '{self.bucket_name}' does not exist, attempting to create...")
            
            # Try to create the bucket
            result = self.supabase.storage.create_bucket(
                self.bucket_name, 
                options={'public': True}
            )
            
            print(f"✅ Bucket '{self.bucket_name}' created successfully: {result}")
            
        except Exception as e:
            error_msg = f"❌ Could not verify/create bucket '{self.bucket_name}': {str(e)}"
            print(error_msg)
            
            # Check if it's a permissions error
            if "insufficient_privilege" in str(e).lower() or "unauthorized" in str(e).lower():
                print("💡 SOLUTION: You need to manually create the bucket in Supabase Dashboard:")
                print(f"   1. Go to your Supabase project dashboard")
                print(f"   2. Navigate to Storage")
                print(f"   3. Create a new bucket named: {self.bucket_name}")
                print(f"   4. Make sure the bucket is set to 'Public' for image access")
            
            # Don't raise the exception to prevent app startup failure
            # The upload will show a clearer error message
    
    def _generate_filename(self, original_filename: str, event_id: str, event_type: str = "event") -> str:
        """Generate a unique filename for storage with event organization"""
        # Get file extension
        _, ext = os.path.splitext(original_filename)
        
        # Generate unique filename with timestamp and UUID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        # Organize by event type and event ID
        return f"{event_type}/{event_id}/{timestamp}_{unique_id}{ext}"
    
    
    def _detect_mime_from_content(self, file_content: bytes) -> Optional[str]:
        """Detect MIME type from file content using magic bytes"""
        if len(file_content) < 12:
            return None
            
        # Check for common image formats by magic bytes
        if file_content.startswith(b'\xff\xd8\xff'):
            return 'image/jpeg'
        elif file_content.startswith(b'\x89PNG\r\n\x1a\n'):
            return 'image/png'
        elif file_content.startswith(b'GIF87a') or file_content.startswith(b'GIF89a'):
            return 'image/gif'
        elif file_content.startswith(b'RIFF') and file_content[8:12] == b'WEBP':
            return 'image/webp'
        
        return None

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
        print(f"🔍 Validating file: {filename} ({len(file_content)} bytes)")
        
        # Check file size (10MB limit)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(file_content) > max_size:
            error_msg = "File size exceeds 10MB limit"
            print(f"❌ File validation failed: {error_msg}")
            return False, error_msg, ""
        
        # Get MIME type from filename
        mime_type, _ = mimetypes.guess_type(filename)
        print(f"🔍 MIME type from filename: {mime_type}")
        
        # Also check actual file signature for better detection
        actual_mime_type = self._detect_mime_from_content(file_content)
        print(f"🔍 MIME type from content: {actual_mime_type}")
        
        # Use content-based detection if available, otherwise fall back to filename
        if actual_mime_type:
            mime_type = actual_mime_type
            print(f"✅ Using content-based MIME type: {mime_type}")
        elif not mime_type:
            mime_type = "application/octet-stream"
            print(f"⚠️ No MIME type detected, using: {mime_type}")
        
        # Check if it's an allowed image type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if mime_type not in allowed_types:
            error_msg = f"File type {mime_type} not allowed. Allowed types: {', '.join(allowed_types)}"
            print(f"❌ File validation failed: {error_msg}")
            return False, error_msg, ""
        
        print(f"✅ File validation passed: {filename} ({mime_type})")
        return True, "Valid file", mime_type
    
    async def upload_event_image(
        self, 
        file_content: bytes, 
        original_filename: str, 
        event_id: str,
        event_type: str = "event"
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Upload an image for an event to Supabase Storage (unified method)
        
        Returns:
            Tuple[bool, str, Optional[dict]]: (success, message, file_info)
        """
        try:
            print(f"🔄 Starting event image upload for: {original_filename} (Event: {event_id}, Type: {event_type})")
            
            # Validate file
            is_valid, message, mime_type = self._validate_file(file_content, original_filename)
            if not is_valid:
                print(f"❌ Upload failed at validation: {message}")
                return False, message, None
            
            # Generate unique filename with event organization
            filename = self._generate_filename(original_filename, event_id, event_type)
            
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