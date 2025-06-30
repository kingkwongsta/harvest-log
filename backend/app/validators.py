"""
Input validation and sanitization utilities.

This module provides comprehensive input validation and sanitization functions
for the harvest log application to ensure data integrity and security.
"""

import re
import html
from typing import Optional, List, Any, Dict
from uuid import UUID
from datetime import datetime
from decimal import Decimal, InvalidOperation

from app.exceptions import ValidationException


class InputSanitizer:
    """Input sanitization utilities."""
    
    @staticmethod
    def sanitize_string(value: str, max_length: Optional[int] = None, allow_html: bool = False) -> str:
        """
        Sanitize string input by removing/escaping dangerous characters.
        
        Args:
            value: Input string to sanitize
            max_length: Maximum allowed length
            allow_html: Whether to allow HTML tags (default: False)
        
        Returns:
            Sanitized string
        
        Raises:
            ValidationException: If input is invalid
        """
        if not isinstance(value, str):
            raise ValidationException(f"Expected string, got {type(value).__name__}")
        
        # Remove null bytes and control characters except newlines and tabs
        sanitized = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', value)
        
        # Escape HTML if not allowed
        if not allow_html:
            sanitized = html.escape(sanitized)
        
        # Trim whitespace
        sanitized = sanitized.strip()
        
        # Check length
        if max_length and len(sanitized) > max_length:
            raise ValidationException(f"String too long: {len(sanitized)} > {max_length}")
        
        return sanitized
    
    @staticmethod
    def sanitize_crop_name(crop_name: str) -> str:
        """Sanitize crop name input."""
        if not crop_name or not crop_name.strip():
            raise ValidationException("Crop name cannot be empty")
        
        sanitized = InputSanitizer.sanitize_string(crop_name, max_length=100)
        
        # Only allow letters, numbers, spaces, hyphens, and common punctuation (including HTML entities)
        if not re.match(r'^[a-zA-Z0-9\s\-_\'\.\&\,\(\);]+$', sanitized):
            raise ValidationException("Crop name contains invalid characters")
        
        return sanitized
    
    @staticmethod
    def sanitize_unit(unit: str) -> str:
        """Sanitize unit input."""
        if not unit or not unit.strip():
            raise ValidationException("Unit cannot be empty")
        
        sanitized = InputSanitizer.sanitize_string(unit, max_length=50)
        
        # Only allow letters, spaces, and common unit symbols
        if not re.match(r'^[a-zA-Z0-9\s\-_\/\.]+$', sanitized):
            raise ValidationException("Unit contains invalid characters")
        
        return sanitized
    
    
    
    @staticmethod
    def sanitize_notes(notes: Optional[str]) -> Optional[str]:
        """Sanitize notes input."""
        if not notes:
            return None
        
        sanitized = InputSanitizer.sanitize_string(notes, max_length=2000, allow_html=False)
        return sanitized if sanitized else None


class InputValidator:
    """Input validation utilities."""
    
    @staticmethod
    def validate_quantity(quantity: Any) -> float:
        """
        Validate and convert quantity input.
        
        Args:
            quantity: Quantity value to validate
        
        Returns:
            Validated quantity as float
        
        Raises:
            ValidationException: If quantity is invalid
        """
        try:
            # Handle string input
            if isinstance(quantity, str):
                quantity = quantity.strip()
                if not quantity:
                    raise ValidationException("Quantity cannot be empty")
                
                # Try to convert to Decimal first for precision
                decimal_qty = Decimal(quantity)
                quantity = float(decimal_qty)
            
            # Convert to float
            quantity = float(quantity)
            
            # Check if it's a valid number
            if not isinstance(quantity, (int, float)) or quantity != quantity:  # NaN check
                raise ValidationException("Quantity must be a valid number")
            
            # Check if positive
            if quantity <= 0:
                raise ValidationException("Quantity must be greater than 0")
            
            # Check reasonable range (0.001 to 1,000,000)
            if quantity < 0.001 or quantity > 1_000_000:
                raise ValidationException("Quantity must be between 0.001 and 1,000,000")
            
            return quantity
            
        except (ValueError, InvalidOperation, TypeError) as e:
            raise ValidationException(f"Invalid quantity format: {str(e)}")
    
    @staticmethod
    def validate_uuid(uuid_str: str, field_name: str = "ID") -> UUID:
        """
        Validate UUID format.
        
        Args:
            uuid_str: UUID string to validate
            field_name: Name of the field for error messages
        
        Returns:
            Validated UUID object
        
        Raises:
            ValidationException: If UUID is invalid
        """
        try:
            return UUID(str(uuid_str))
        except (ValueError, TypeError) as e:
            raise ValidationException(f"Invalid {field_name} format: {str(e)}")
    
    @staticmethod
    def validate_datetime(date_str: str, field_name: str = "date") -> datetime:
        """
        Validate datetime format.
        
        Args:
            date_str: Datetime string to validate
            field_name: Name of the field for error messages
        
        Returns:
            Validated datetime object
        
        Raises:
            ValidationException: If datetime is invalid
        """
        try:
            # Try ISO format first
            if isinstance(date_str, str):
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                dt = date_str
            
            # Check if date is reasonable (not too far in past or future)
            now = datetime.now()
            min_date = datetime(1900, 1, 1)
            max_date = datetime(2100, 12, 31)
            
            if dt < min_date or dt > max_date:
                raise ValidationException(f"{field_name} must be between 1900 and 2100")
            
            return dt
            
        except (ValueError, TypeError) as e:
            raise ValidationException(f"Invalid {field_name} format: {str(e)}")
    
    @staticmethod
    def validate_file_upload(file_content: bytes, filename: str, max_size: int = 10 * 1024 * 1024) -> None:
        """
        Validate file upload.
        
        Args:
            file_content: File content bytes
            filename: Original filename
            max_size: Maximum file size in bytes (default: 10MB)
        
        Raises:
            ValidationException: If file is invalid
        """
        # Check file size
        if len(file_content) > max_size:
            raise ValidationException(f"File too large: {len(file_content)} bytes > {max_size} bytes")
        
        # Check minimum size
        if len(file_content) < 100:
            raise ValidationException("File too small or corrupted")
        
        # Validate filename
        if not filename or not filename.strip():
            raise ValidationException("Filename cannot be empty")
        
        filename = filename.strip()
        
        # Check filename length
        if len(filename) > 255:
            raise ValidationException("Filename too long")
        
        # Check for dangerous characters in filename
        if re.search(r'[<>:"/\\|?*\x00-\x1f]', filename):
            raise ValidationException("Filename contains invalid characters")
        
        # Check file extension
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'}
        file_ext = '.' + filename.split('.')[-1].lower() if '.' in filename else ''
        
        if file_ext not in allowed_extensions:
            raise ValidationException(f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}")
        
        # Check file magic bytes for common image formats
        image_signatures = {
            b'\xFF\xD8\xFF': 'JPEG',
            b'\x89PNG\r\n\x1A\n': 'PNG',
            b'GIF87a': 'GIF',
            b'GIF89a': 'GIF',
            b'RIFF': 'WEBP',  # WebP files start with RIFF
            b'BM': 'BMP',
            b'II*\x00': 'TIFF',
            b'MM\x00*': 'TIFF'
        }
        
        file_type_detected = False
        for signature, file_type in image_signatures.items():
            if file_content.startswith(signature):
                file_type_detected = True
                break
        
        if not file_type_detected:
            raise ValidationException("File does not appear to be a valid image")


class DataSanitizer:
    """High-level data sanitization for API endpoints."""
    
    @staticmethod
    def sanitize_harvest_log_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize harvest log data comprehensively.
        
        Args:
            data: Raw harvest log data
        
        Returns:
            Sanitized data dictionary
        
        Raises:
            ValidationException: If data is invalid
        """
        sanitized = {}
        
        # Required fields
        if 'crop_name' in data:
            sanitized['crop_name'] = InputSanitizer.sanitize_crop_name(data['crop_name'])
        
        if 'quantity' in data:
            sanitized['quantity'] = InputValidator.validate_quantity(data['quantity'])
        
        if 'unit' in data:
            sanitized['unit'] = InputSanitizer.sanitize_unit(data['unit'])
        
        if 'harvest_date' in data:
            sanitized['harvest_date'] = InputValidator.validate_datetime(data['harvest_date'], 'harvest_date')
        
        # Optional fields
        
        
        if 'notes' in data:
            sanitized['notes'] = InputSanitizer.sanitize_notes(data['notes'])
        
        return sanitized
    
    @staticmethod
    def sanitize_image_data(filename: str, file_content: bytes) -> Dict[str, Any]:
        """
        Sanitize image upload data.
        
        Args:
            filename: Original filename
            file_content: File content bytes
        
        Returns:
            Sanitized data dictionary
        
        Raises:
            ValidationException: If data is invalid
        """
        # Validate file upload
        InputValidator.validate_file_upload(file_content, filename)
        
        # Sanitize filename
        sanitized_filename = InputSanitizer.sanitize_string(filename, max_length=255)
        
        return {
            'filename': sanitized_filename,
            'file_content': file_content,
            'file_size': len(file_content)
        }