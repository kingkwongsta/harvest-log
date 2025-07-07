#!/usr/bin/env python3
"""
Test script to demonstrate logging functionality.
Run this to see various log levels and formats in action.
"""

import os
import asyncio
from app.logging_config import setup_logging, get_api_logger, get_database_logger, get_app_logger

def test_logging():
    """Test different logging levels and formats"""
    
    # Test with colored console logs (default)
    print("=== Testing Colored Console Logs ===")
    setup_logging(level="DEBUG", json_logs=False)
    
    # Get different loggers
    app_logger = get_app_logger()
    api_logger = get_api_logger()
    db_logger = get_database_logger()
    
    # Test different log levels
    app_logger.debug("This is a DEBUG message - detailed diagnostic info")
    app_logger.info("This is an INFO message - general operation info")
    app_logger.warning("This is a WARNING message - something needs attention")
    app_logger.error("This is an ERROR message - error condition occurred")
    
    # Test structured logging with extra fields
    api_logger.info("API request processed", extra={
        "request_id": "12345-67890",
        "method": "POST",
        "url": "/api/v1/events",
        "status_code": 201,
        "duration_ms": 45.67
    })
    
    db_logger.info("Database operation completed", extra={
        "db_operation": "INSERT",
        "table": "plant_events",
        "record_id": "uuid-12345",
        "duration_ms": 12.34
    })
    
    print("\n=== Testing JSON Logs ===")
    # Test with JSON logs
    setup_logging(level="INFO", json_logs=True)
    
    app_logger = get_app_logger()
    api_logger = get_api_logger()
    db_logger = get_database_logger()
    
    app_logger.info("Application started successfully")
    
    api_logger.info("Processing plant event creation", extra={
        "request_id": "req-98765",
        "method": "POST",
        "url": "/api/v1/events",
        "event_type": "harvest",
        "plant_name": "Tomatoes"
    })
    
    db_logger.info("Record created successfully", extra={
        "db_operation": "INSERT",
        "table": "plant_events",
        "record_id": "event-uuid-54321",
        "affected_rows": 1
    })
    
    # Test error logging with exception
    try:
        raise ValueError("This is a test exception")
    except Exception as e:
        api_logger.error("Test error with exception", exc_info=True, extra={
            "request_id": "req-error-123",
            "operation": "test_exception"
        })
    
    print("\n=== Logging Test Complete ===")
    print("You can also test with LOG_FILE environment variable set to see file output")

if __name__ == "__main__":
    test_logging() 