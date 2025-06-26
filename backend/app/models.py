from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4


class HarvestLogBase(BaseModel):
    """Base model for harvest log data"""
    crop_name: str = Field(..., min_length=1, max_length=100, description="Name of the crop harvested")
    quantity: float = Field(..., gt=0, description="Quantity harvested")
    unit: str = Field(..., min_length=1, max_length=50, description="Unit of measurement (e.g., pounds, kilograms, pieces)")
    harvest_date: datetime = Field(..., description="Date and time of harvest")
    location: Optional[str] = Field(None, max_length=200, description="Location where crop was harvested")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes about the harvest")


class HarvestLogCreate(HarvestLogBase):
    """Model for creating a harvest log"""
    pass


class HarvestLogUpdate(BaseModel):
    """Model for updating a harvest log"""
    crop_name: Optional[str] = Field(None, min_length=1, max_length=100)
    quantity: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, min_length=1, max_length=50)
    harvest_date: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=1000)


class HarvestLog(HarvestLogBase):
    """Complete harvest log model with all fields"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the harvest log")
    created_at: datetime = Field(default_factory=datetime.now, description="Timestamp when the log was created")
    updated_at: datetime = Field(default_factory=datetime.now, description="Timestamp when the log was last updated")


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


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = Field(default=False, description="Always false for errors")
    message: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information") 