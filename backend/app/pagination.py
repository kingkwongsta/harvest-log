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
    def build_events_query(
        client,
        params: PaginationParams,
        table_name: str = "plant_events",
        additional_filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[Any, Optional[PaginationCursor]]:
        """
        Build paginated query for plant events.
        
        Args:
            client: Supabase client
            params: Pagination parameters
            table_name: Name of the table to query
            additional_filters: Additional query filters
        
        Returns:
            Query object and cursor for positioning
        """
        # Start with base query
        query = client.table(table_name).select("*")
        
        # Apply additional filters
        if additional_filters:
            for field, value in additional_filters.items():
                if value is not None:
                    if field.endswith("_search"):
                        # Handle search fields with ilike
                        base_field = field.replace("_search", "")
                        query = query.ilike(base_field, f"%{value}%")
                    elif field.endswith("_from"):
                        # Handle date range filters
                        base_field = field.replace("_from", "")
                        query = query.gte(base_field, value.isoformat())
                    elif field.endswith("_to"):
                        # Handle date range filters
                        base_field = field.replace("_to", "")
                        query = query.lte(base_field, value.isoformat())
                    else:
                        query = query.eq(field, value)
        
        # Handle cursor positioning
        cursor_obj = params.get_cursor_obj()
        if cursor_obj:
            if params.order == "desc":
                query = query.or_(
                    f"created_at.lt.{cursor_obj.created_at.isoformat()},"
                    f"and(created_at.eq.{cursor_obj.created_at.isoformat()},id.lt.{cursor_obj.id})"
                )
            else:
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
    def process_events_result(
        data: List[Dict[str, Any]],
        params: PaginationParams,
        current_cursor: Optional[PaginationCursor] = None
    ) -> PaginationResult:
        """
        Process paginated query result for plant events.
        
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
        
        # Determine previous cursor
        has_previous = current_cursor is not None
        previous_cursor = None
        if has_previous and items:
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
        table_name: str = "plant_events",
        additional_filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Get total count for events with filters.
        
        Args:
            client: Supabase client
            table_name: Name of the table to query
            additional_filters: Additional query filters
        
        Returns:
            Total count of matching records
        """
        query = client.table(table_name).select("id", count="exact")
        
        # Apply additional filters
        if additional_filters:
            for field, value in additional_filters.items():
                if value is not None:
                    if field.endswith("_search"):
                        base_field = field.replace("_search", "")
                        query = query.ilike(base_field, f"%{value}%")
                    elif field.endswith("_from"):
                        base_field = field.replace("_from", "")
                        query = query.gte(base_field, value.isoformat())
                    elif field.endswith("_to"):
                        base_field = field.replace("_to", "")
                        query = query.lte(base_field, value.isoformat())
                    else:
                        query = query.eq(field, value)
        
        result = query.execute()
        return result.count or 0


class EventFilterParams(BaseModel):
    """Filter parameters for plant events."""
    
    notes_search: Optional[str] = Field(None, max_length=100, description="Search in notes")
    event_date_from: Optional[datetime] = Field(None, description="Filter from date")
    event_date_to: Optional[datetime] = Field(None, description="Filter to date")
    event_type: Optional[str] = Field(None, description="Filter by event type")
    plant_id: Optional[str] = Field(None, description="Filter by plant ID")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for query building."""
        return self.model_dump(exclude_none=True)


class PaginatedEventResponse(BaseModel):
    """Response model for paginated events."""
    
    success: bool = Field(True, description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    data: List[Any] = Field(..., description="List of events")
    pagination: Dict[str, Any] = Field(..., description="Pagination metadata")
    
    class Config:
        arbitrary_types_allowed = True