"""
Pagination utilities for API endpoints.

This module provides cursor-based pagination functionality for efficient
pagination of large datasets in the harvest log application.
"""

import base64
import json
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field
from app.exceptions import ValidationException


class PaginationCursor(BaseModel):
    """Pagination cursor model."""
    
    created_at: datetime = Field(..., description="Timestamp for cursor positioning")
    id: UUID = Field(..., description="ID for cursor positioning")
    
    def encode(self) -> str:
        """Encode cursor to base64 string."""
        cursor_data = {
            "created_at": self.created_at.isoformat(),
            "id": str(self.id)
        }
        cursor_json = json.dumps(cursor_data, sort_keys=True)
        cursor_bytes = cursor_json.encode('utf-8')
        return base64.b64encode(cursor_bytes).decode('utf-8')
    
    @classmethod
    def decode(cls, cursor_str: str) -> 'PaginationCursor':
        """Decode cursor from base64 string."""
        try:
            cursor_bytes = base64.b64decode(cursor_str.encode('utf-8'))
            cursor_json = cursor_bytes.decode('utf-8')
            cursor_data = json.loads(cursor_json)
            
            return cls(
                created_at=datetime.fromisoformat(cursor_data['created_at']),
                id=UUID(cursor_data['id'])
            )
        except (ValueError, KeyError, json.JSONDecodeError) as e:
            raise ValidationException(f"Invalid cursor format: {str(e)}")


class PaginationParams(BaseModel):
    """Pagination parameters for API requests."""
    
    limit: int = Field(default=20, ge=1, le=100, description="Number of items per page")
    cursor: Optional[str] = Field(None, description="Cursor for pagination")
    order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")
    
    def get_cursor_obj(self) -> Optional[PaginationCursor]:
        """Get decoded cursor object."""
        if not self.cursor:
            return None
        return PaginationCursor.decode(self.cursor)


class PaginationResult(BaseModel):
    """Pagination result with metadata."""
    
    items: List[Any] = Field(..., description="List of items in current page")
    has_next: bool = Field(..., description="Whether there are more items")
    has_previous: bool = Field(..., description="Whether there are previous items")
    next_cursor: Optional[str] = Field(None, description="Cursor for next page")
    previous_cursor: Optional[str] = Field(None, description="Cursor for previous page")
    total_count: Optional[int] = Field(None, description="Total count if available")
    
    class Config:
        arbitrary_types_allowed = True


class PaginationHelper:
    """Helper class for implementing cursor-based pagination."""
    
    @staticmethod
    def build_harvest_logs_query(
        client,
        params: PaginationParams,
        additional_filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[Any, Optional[PaginationCursor]]:
        """
        Build paginated query for harvest logs.
        
        Args:
            client: Supabase client
            params: Pagination parameters
            additional_filters: Additional query filters
        
        Returns:
            Query object and cursor for positioning
        """
        # Start with base query
        query = client.table("harvest_logs").select("*")
        
        # Apply additional filters
        if additional_filters:
            for field, value in additional_filters.items():
                if value is not None:
                    if field == "crop_name_search":
                        query = query.ilike("crop_name", f"%{value}%")
                    elif field == "harvest_date_from":
                        query = query.gte("harvest_date", value.isoformat())
                    elif field == "harvest_date_to":
                        query = query.lte("harvest_date", value.isoformat())
                    else:
                        query = query.eq(field, value)
        
        # Handle cursor positioning
        cursor_obj = params.get_cursor_obj()
        if cursor_obj:
            if params.order == "desc":
                # For descending order: created_at < cursor OR (created_at = cursor AND id < cursor_id)
                query = query.or_(
                    f"created_at.lt.{cursor_obj.created_at.isoformat()},"
                    f"and(created_at.eq.{cursor_obj.created_at.isoformat()},id.lt.{cursor_obj.id})"
                )
            else:
                # For ascending order: created_at > cursor OR (created_at = cursor AND id > cursor_id)
                query = query.or_(
                    f"created_at.gt.{cursor_obj.created_at.isoformat()},"
                    f"and(created_at.eq.{cursor_obj.created_at.isoformat()},id.gt.{cursor_obj.id})"
                )
        
        # Apply ordering
        if params.order == "desc":
            query = query.order("created_at", desc=True).order("id", desc=True)
        else:
            query = query.order("created_at", desc=False).order("id", desc=False)
        
        # Apply limit (fetch one extra to determine if there are more items)
        query = query.limit(params.limit + 1)
        
        return query, cursor_obj
    
    @staticmethod
    def process_harvest_logs_result(
        data: List[Dict[str, Any]],
        params: PaginationParams,
        current_cursor: Optional[PaginationCursor] = None
    ) -> PaginationResult:
        """
        Process paginated query result for harvest logs.
        
        Args:
            data: Query result data
            params: Pagination parameters
            current_cursor: Current cursor position
        
        Returns:
            Pagination result with metadata
        """
        has_next = len(data) > params.limit
        items = data[:params.limit]  # Remove extra item used for has_next check
        
        # Determine next cursor
        next_cursor = None
        if has_next and items:
            last_item = items[-1]
            next_cursor_obj = PaginationCursor(
                created_at=datetime.fromisoformat(last_item['created_at']),
                id=UUID(last_item['id'])
            )
            next_cursor = next_cursor_obj.encode()
        
        # Determine previous cursor (simplified - just use current cursor's reverse)
        has_previous = current_cursor is not None
        previous_cursor = None
        if has_previous and items:
            # For previous cursor, we'd typically need to reverse the query
            # This is a simplified implementation
            first_item = items[0]
            prev_cursor_obj = PaginationCursor(
                created_at=datetime.fromisoformat(first_item['created_at']),
                id=UUID(first_item['id'])
            )
            previous_cursor = prev_cursor_obj.encode()
        
        return PaginationResult(
            items=items,
            has_next=has_next,
            has_previous=has_previous,
            next_cursor=next_cursor,
            previous_cursor=previous_cursor if has_previous else None
        )
    
    @staticmethod
    def get_total_count(
        client,
        additional_filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Get total count for harvest logs with filters.
        
        Args:
            client: Supabase client
            additional_filters: Additional query filters
        
        Returns:
            Total count of matching records
        """
        query = client.table("harvest_logs").select("id", count="exact")
        
        # Apply additional filters
        if additional_filters:
            for field, value in additional_filters.items():
                if value is not None:
                    if field == "crop_name_search":
                        query = query.ilike("crop_name", f"%{value}%")
                    elif field == "harvest_date_from":
                        query = query.gte("harvest_date", value.isoformat())
                    elif field == "harvest_date_to":
                        query = query.lte("harvest_date", value.isoformat())
                    else:
                        query = query.eq(field, value)
        
        result = query.execute()
        return result.count or 0


class FilterParams(BaseModel):
    """Filter parameters for harvest logs."""
    
    crop_name_search: Optional[str] = Field(None, max_length=100, description="Search in crop names")
    harvest_date_from: Optional[datetime] = Field(None, description="Filter from date")
    harvest_date_to: Optional[datetime] = Field(None, description="Filter to date")
    location: Optional[str] = Field(None, max_length=200, description="Filter by location")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for query building."""
        return self.model_dump(exclude_none=True)


class PaginatedHarvestLogResponse(BaseModel):
    """Response model for paginated harvest logs."""
    
    success: bool = Field(True, description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    data: List[Any] = Field(..., description="List of harvest logs")
    pagination: Dict[str, Any] = Field(..., description="Pagination metadata")
    
    class Config:
        arbitrary_types_allowed = True