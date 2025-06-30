from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID, uuid4
import re

from app.validators import InputSanitizer, InputValidator


class HarvestLogBase(BaseModel):
    """Base model for harvest log data"""
    crop_name: str = Field(..., min_length=1, max_length=100, description="Name of the crop harvested")
    quantity: float = Field(..., gt=0, description="Quantity harvested")
    unit: str = Field(..., min_length=1, max_length=50, description="Unit of measurement (e.g., pounds, kilograms, pieces)")
    harvest_date: datetime = Field(..., description="Date and time of harvest")
    notes: Optional[str] = Field(None, max_length=2000, description="Additional notes about the harvest")
    
    @field_validator('crop_name')
    @classmethod
    def validate_crop_name(cls, v: str) -> str:
        """Validate and sanitize crop name"""
        return InputSanitizer.sanitize_crop_name(v)
    
    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: Any) -> float:
        """Validate quantity value"""
        return InputValidator.validate_quantity(v)
    
    @field_validator('unit')
    @classmethod
    def validate_unit(cls, v: str) -> str:
        """Validate and sanitize unit"""
        return InputSanitizer.sanitize_unit(v)
    
    @field_validator('harvest_date')
    @classmethod
    def validate_harvest_date(cls, v: Any) -> datetime:
        """Validate harvest date"""
        if isinstance(v, str):
            return InputValidator.validate_datetime(v, 'harvest_date')
        return v
    
    @field_validator('notes')
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize notes"""
        if v is None:
            return None
        return InputSanitizer.sanitize_notes(v)


class HarvestImageBase(BaseModel):
    """Base model for harvest image data"""
    filename: str = Field(..., min_length=1, max_length=255, description="Generated filename in storage")
    original_filename: str = Field(..., min_length=1, max_length=255, description="Original filename from upload")
    file_path: str = Field(..., min_length=1, max_length=500, description="Full path in Supabase storage")
    file_size: int = Field(..., gt=0, description="File size in bytes")
    mime_type: str = Field(..., min_length=1, max_length=100, description="MIME type of the file")
    width: Optional[int] = Field(None, gt=0, description="Image width in pixels")
    height: Optional[int] = Field(None, gt=0, description="Image height in pixels")
    upload_order: int = Field(default=0, ge=0, description="Order of image in upload sequence")
    
    @field_validator('filename', 'original_filename')
    @classmethod
    def validate_filenames(cls, v: str) -> str:
        """Validate and sanitize filenames"""
        # For existing data, be more lenient with validation
        try:
            sanitized = InputSanitizer.sanitize_string(v, max_length=255)
            
            # Check for dangerous characters in filename - allow more characters for existing data
            if re.search(r'[<>:"|?*\x00-\x1f]', sanitized):
                from app.exceptions import ValidationException
                raise ValidationException("Filename contains invalid characters")
            
            return sanitized
        except Exception:
            # For existing data that might not pass validation, return as-is but truncated
            return v[:255] if len(v) > 255 else v
    
    @field_validator('file_path')
    @classmethod
    def validate_file_path(cls, v: str) -> str:
        """Validate file path"""
        sanitized = InputSanitizer.sanitize_string(v, max_length=500)
        
        # Basic path validation - should not contain dangerous patterns
        if '..' in sanitized or sanitized.startswith('/'):
            from app.exceptions import ValidationException
            raise ValidationException("Invalid file path")
        
        return sanitized
    
    @field_validator('file_size')
    @classmethod
    def validate_file_size(cls, v: int) -> int:
        """Validate file size"""
        max_size = 10 * 1024 * 1024  # 10MB
        if v > max_size:
            from app.exceptions import ValidationException
            raise ValidationException(f"File too large: {v} bytes > {max_size} bytes")
        
        if v < 100:
            from app.exceptions import ValidationException
            raise ValidationException("File too small or corrupted")
        
        return v
    
    @field_validator('mime_type')
    @classmethod
    def validate_mime_type(cls, v: str) -> str:
        """Validate MIME type"""
        allowed_types = {
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/webp', 'image/bmp', 'image/tiff'
        }
        
        if v.lower() not in allowed_types:
            from app.exceptions import ValidationException
            raise ValidationException(f"Invalid MIME type: {v}")
        
        return v.lower()


class HarvestImageCreate(HarvestImageBase):
    """Model for creating a harvest image"""
    harvest_log_id: UUID = Field(..., description="ID of the associated harvest log")


class HarvestImageUpdate(BaseModel):
    """Model for updating a harvest image"""
    upload_order: Optional[int] = Field(None, ge=0, description="Order of image in upload sequence")


class HarvestImage(HarvestImageBase):
    """Complete harvest image model with all fields"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the harvest image")
    harvest_log_id: UUID = Field(..., description="ID of the associated harvest log")
    created_at: datetime = Field(default_factory=datetime.now, description="Timestamp when the image was uploaded")
    updated_at: datetime = Field(default_factory=datetime.now, description="Timestamp when the image was last updated")
    public_url: Optional[str] = Field(default=None, description="Public URL for accessing the image")


class HarvestLogCreate(HarvestLogBase):
    """Model for creating a harvest log"""
    pass


class HarvestLogUpdate(BaseModel):
    """Model for updating a harvest log"""
    crop_name: Optional[str] = Field(None, min_length=1, max_length=100)
    quantity: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, min_length=1, max_length=50)
    harvest_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=1000)


class HarvestLog(HarvestLogBase):
    """Complete harvest log model with all fields"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the harvest log")
    created_at: datetime = Field(default_factory=datetime.now, description="Timestamp when the log was created")
    updated_at: datetime = Field(default_factory=datetime.now, description="Timestamp when the log was last updated")
    images: List[HarvestImage] = Field(default_factory=list, description="Associated images for this harvest")


class FileUploadResponse(BaseModel):
    """Response model for file upload operations"""
    success: bool = Field(..., description="Whether the upload was successful")
    message: str = Field(..., description="Response message")
    data: Optional[HarvestImage] = Field(None, description="The uploaded image data if successful")


class HarvestLogResponse(BaseModel):
    """Response model for API operations"""
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    data: Optional[HarvestLog] = Field(None, description="The harvest log data if applicable")


class HarvestLogListResponse(BaseModel):
    """Response model for list operations"""
    success: bool = Field(..., description="Whether the operation was successful") 
    message: str = Field(..., description="Response message")
    data: list[HarvestLog] = Field(default_factory=list, description="List of harvest logs")
    total: int = Field(..., description="Total number of harvest logs")


class ImageUploadRequest(BaseModel):
    """Request model for image upload"""
    harvest_log_id: UUID = Field(..., description="ID of the harvest log to associate the image with")


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = Field(default=False, description="Always false for errors")
    message: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information") 