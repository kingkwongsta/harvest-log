"""
Entry point for running the FastAPI application.

This file serves as the main entry point when running with 'python main.py'
For development, use: fastapi dev app/main.py
For production, use: uvicorn app.main:app
"""

import uvicorn
from app.main import app
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        reload_dirs=["app"] if settings.debug else None,
    ) 