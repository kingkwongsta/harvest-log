"""
Background task utilities for the harvest log application.

This module provides background task functionality for long-running operations
like image processing, data cleanup, and cache management.
"""

import asyncio
from typing import Optional, Callable, Any, Dict
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks
from app.logging_config import get_api_logger
from app.cache import cleanup_cache_task

logger = get_api_logger()


class BackgroundTaskManager:
    """Manager for background tasks and periodic jobs."""
    
    def __init__(self):
        self._tasks: Dict[str, asyncio.Task] = {}
        self._running = False
    
    async def start(self):
        """Start background task manager."""
        if self._running:
            return
        
        self._running = True
        logger.info("Starting background task manager")
        
        # Start periodic tasks
        self._tasks["cache_cleanup"] = asyncio.create_task(
            self._run_periodic_task(cleanup_cache_task, 300, "Cache cleanup")
        )
        
        logger.info("✓ Background tasks started")
    
    async def stop(self):
        """Stop background task manager."""
        if not self._running:
            return
        
        self._running = False
        logger.info("Stopping background task manager")
        
        # Cancel all tasks
        for name, task in self._tasks.items():
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    logger.debug(f"Background task cancelled: {name}")
        
        self._tasks.clear()
        logger.info("✓ Background tasks stopped")
    
    async def _run_periodic_task(self, task_func: Callable, interval: int, name: str):
        """Run a periodic task."""
        logger.info(f"Starting periodic task: {name} (interval: {interval}s)")
        
        while self._running:
            try:
                await task_func()
            except Exception as e:
                logger.error(f"Error in periodic task {name}: {e}", exc_info=True)
            
            try:
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
        
        logger.info(f"Periodic task stopped: {name}")


# Global task manager
_task_manager = BackgroundTaskManager()


async def start_background_tasks():
    """Start all background tasks."""
    await _task_manager.start()


async def stop_background_tasks():
    """Stop all background tasks."""
    await _task_manager.stop()


# Image processing tasks
async def process_image_metadata(image_id: str, file_path: str) -> None:
    """
    Background task to process image metadata.
    
    Args:
        image_id: ID of the image record
        file_path: Path to the image file
    """
    logger.info(f"Processing image metadata for {image_id}")
    
    try:
        # This is where you'd add actual image processing
        # For example: thumbnail generation, EXIF data extraction, etc.
        
        # Simulate processing time
        await asyncio.sleep(1)
        
        logger.info(f"✓ Image metadata processed: {image_id}")
        
    except Exception as e:
        logger.error(f"Failed to process image metadata {image_id}: {e}", exc_info=True)


async def cleanup_old_temp_files() -> None:
    """Clean up old temporary files."""
    logger.info("Starting cleanup of old temporary files")
    
    try:
        # This is where you'd add actual file cleanup logic
        # For example: removing temporary uploads older than 24 hours
        
        cutoff_time = datetime.now() - timedelta(days=1)
        logger.debug(f"Cleanup cutoff time: {cutoff_time}")
        
        # Simulate cleanup
        await asyncio.sleep(0.5)
        
        logger.info("✓ Temporary file cleanup completed")
        
    except Exception as e:
        logger.error(f"Failed to cleanup temporary files: {e}", exc_info=True)


async def generate_daily_summary() -> None:
    """Generate daily harvest summary."""
    logger.info("Generating daily harvest summary")
    
    try:
        # This is where you'd add actual summary generation
        # For example: daily statistics, reports, notifications
        
        # Simulate processing
        await asyncio.sleep(2)
        
        logger.info("✓ Daily summary generated")
        
    except Exception as e:
        logger.error(f"Failed to generate daily summary: {e}", exc_info=True)


# Utility functions for adding tasks to FastAPI BackgroundTasks
def add_image_processing_task(background_tasks: BackgroundTasks, image_id: str, file_path: str):
    """Add image processing to background tasks."""
    background_tasks.add_task(process_image_metadata, image_id, file_path)


def add_cleanup_task(background_tasks: BackgroundTasks):
    """Add cleanup task to background tasks."""
    background_tasks.add_task(cleanup_old_temp_files)


# Scheduled task decorators
def scheduled_task(interval: int, name: Optional[str] = None):
    """
    Decorator for scheduled tasks.
    
    Args:
        interval: Interval in seconds
        name: Optional task name
    """
    def decorator(func: Callable):
        task_name = name or func.__name__
        
        async def wrapper():
            logger.info(f"Starting scheduled task: {task_name}")
            try:
                await func()
                logger.debug(f"Scheduled task completed: {task_name}")
            except Exception as e:
                logger.error(f"Scheduled task failed {task_name}: {e}", exc_info=True)
        
        # Add to task manager if it's running
        if _task_manager._running:
            _task_manager._tasks[task_name] = asyncio.create_task(
                _task_manager._run_periodic_task(wrapper, interval, task_name)
            )
        
        return wrapper
    return decorator


# Context manager for background tasks
@asynccontextmanager
async def background_task_context():
    """Context manager for background tasks in lifespan."""
    await start_background_tasks()
    try:
        yield
    finally:
        await stop_background_tasks()


# Health check for background tasks
async def get_background_task_status() -> Dict[str, Any]:
    """Get status of background tasks."""
    if not _task_manager._running:
        return {
            "status": "stopped",
            "tasks": {},
            "message": "Background task manager is not running"
        }
    
    task_status = {}
    for name, task in _task_manager._tasks.items():
        if task.done():
            if task.exception():
                task_status[name] = {
                    "status": "failed",
                    "error": str(task.exception())
                }
            else:
                task_status[name] = {"status": "completed"}
        else:
            task_status[name] = {"status": "running"}
    
    return {
        "status": "running",
        "tasks": task_status,
        "message": f"Background task manager running with {len(_task_manager._tasks)} tasks"
    }