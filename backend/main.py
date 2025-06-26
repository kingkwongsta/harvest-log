from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os

app = FastAPI(title="Harvest Log API", version="1.0.0")

# CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class HarvestLog(BaseModel):
    id: Optional[str] = None
    crop_name: str
    quantity: float
    unit: str  # e.g., "pounds", "kilograms", "pieces"
    harvest_date: datetime
    location: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

class HarvestLogResponse(BaseModel):
    success: bool
    message: str
    data: Optional[HarvestLog] = None

# In-memory storage (for now - would be replaced with database)
harvest_logs: List[HarvestLog] = []

@app.get("/")
async def root():
    return {"message": "Harvest Log API is running"}

@app.post("/api/harvest-logs", response_model=HarvestLogResponse)
async def create_harvest_log(harvest_log: HarvestLog):
    """
    Create a new harvest log entry
    """
    try:
        # Generate a simple ID and set creation timestamp
        harvest_log.id = f"harvest_{len(harvest_logs) + 1}"
        harvest_log.created_at = datetime.now()
        
        # Add to storage
        harvest_logs.append(harvest_log)
        
        return HarvestLogResponse(
            success=True,
            message="Harvest log created successfully",
            data=harvest_log
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create harvest log: {str(e)}")

@app.get("/api/harvest-logs", response_model=List[HarvestLog])
async def get_harvest_logs():
    """
    Get all harvest logs
    """
    return harvest_logs

@app.get("/api/harvest-logs/{log_id}", response_model=HarvestLog)
async def get_harvest_log(log_id: str):
    """
    Get a specific harvest log by ID
    """
    for log in harvest_logs:
        if log.id == log_id:
            return log
    raise HTTPException(status_code=404, detail="Harvest log not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 