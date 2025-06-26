from typing import List
from uuid import UUID
from app.models import HarvestLog


# In-memory storage (will be replaced with database in the future)
harvest_logs_db: List[HarvestLog] = []


def get_harvest_logs_db() -> List[HarvestLog]:
    """Dependency to get the harvest logs database"""
    return harvest_logs_db


def get_harvest_log_by_id(log_id: UUID, db: List[HarvestLog]) -> HarvestLog | None:
    """Helper function to find a harvest log by ID"""
    for log in db:
        if log.id == log_id:
            return log
    return None 