import time
import uuid
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse

from app.logging_config import get_middleware_logger

logger = get_middleware_logger()


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests and responses
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        
        # Start timing
        start_time = time.time()
        
        # Extract request info
        method = request.method
        url = str(request.url)
        client_host = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Log incoming request
        logger.info(
            f"Incoming request: {method} {url}",
            extra={
                "request_id": request_id,
                "method": method,
                "url": url,
                "client_host": client_host,
                "user_agent": user_agent,
                "content_type": request.headers.get("content-type"),
                "content_length": request.headers.get("content-length"),
            }
        )
        
        # Add request ID to request state for use in other parts of the application
        request.state.request_id = request_id
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = round((time.time() - start_time) * 1000, 2)
            
            # Log response
            logger.info(
                f"Request completed: {method} {url} - {response.status_code}",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "url": url,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                    "response_size": response.headers.get("content-length"),
                }
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Calculate duration for failed requests
            duration_ms = round((time.time() - start_time) * 1000, 2)
            
            # Log error
            logger.error(
                f"Request failed: {method} {url} - {str(e)}",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "url": url,
                    "duration_ms": duration_ms,
                    "error": str(e),
                },
                exc_info=True
            )
            
            # Return error response
            error_response = JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "request_id": request_id,
                    "message": str(e)
                }
            )
            error_response.headers["X-Request-ID"] = request_id
            
            return error_response


class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log performance metrics and slow requests
    """
    
    def __init__(self, app, slow_request_threshold: float = 1000.0):
        """
        Initialize performance middleware
        
        Args:
            app: FastAPI application
            slow_request_threshold: Threshold in milliseconds to consider a request slow
        """
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = round((time.time() - start_time) * 1000, 2)
        
        # Get request ID if available
        request_id = getattr(request.state, 'request_id', 'unknown')
        
        # Log slow requests
        if duration_ms > self.slow_request_threshold:
            logger.warning(
                f"Slow request detected: {request.method} {request.url} took {duration_ms}ms",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "duration_ms": duration_ms,
                    "slow_request": True,
                }
            )
        
        # Add performance headers
        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        
        return response 