import time
import uuid
import asyncio
from typing import Callable, Dict, Optional
from datetime import datetime, timedelta
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse

from app.logging_config import get_middleware_logger
from app.exceptions import RateLimitError

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


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using sliding window algorithm.
    """
    
    def __init__(self, app, requests_per_minute: int = 60, burst_limit: int = 10):
        """
        Initialize rate limiting middleware.
        
        Args:
            app: FastAPI application
            requests_per_minute: Maximum requests per minute per IP
            burst_limit: Maximum burst requests in 10 seconds
        """
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst_limit = burst_limit
        self.clients: Dict[str, Dict] = {}
        self._lock = asyncio.Lock()
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address from request."""
        # Check for forwarded headers first
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        return request.client.host if request.client else "unknown"
    
    async def _is_rate_limited(self, client_ip: str) -> bool:
        """Check if client is rate limited."""
        async with self._lock:
            now = datetime.now()
            
            # Initialize client data if not exists
            if client_ip not in self.clients:
                self.clients[client_ip] = {
                    "requests": [],
                    "burst_requests": []
                }
            
            client_data = self.clients[client_ip]
            
            # Clean old requests (older than 1 minute)
            minute_ago = now - timedelta(minutes=1)
            client_data["requests"] = [
                req_time for req_time in client_data["requests"] 
                if req_time > minute_ago
            ]
            
            # Clean old burst requests (older than 10 seconds)
            ten_seconds_ago = now - timedelta(seconds=10)
            client_data["burst_requests"] = [
                req_time for req_time in client_data["burst_requests"] 
                if req_time > ten_seconds_ago
            ]
            
            # Check rate limits
            minute_requests = len(client_data["requests"])
            burst_requests = len(client_data["burst_requests"])
            
            if minute_requests >= self.requests_per_minute:
                logger.warning(
                    f"Rate limit exceeded for {client_ip}: {minute_requests} requests in last minute",
                    extra={
                        "client_ip": client_ip,
                        "requests_count": minute_requests,
                        "limit": self.requests_per_minute,
                        "limit_type": "per_minute"
                    }
                )
                return True
            
            if burst_requests >= self.burst_limit:
                logger.warning(
                    f"Burst limit exceeded for {client_ip}: {burst_requests} requests in last 10 seconds",
                    extra={
                        "client_ip": client_ip,
                        "requests_count": burst_requests,
                        "limit": self.burst_limit,
                        "limit_type": "burst"
                    }
                )
                return True
            
            # Add current request
            client_data["requests"].append(now)
            client_data["burst_requests"].append(now)
            
            return False
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        client_ip = self._get_client_ip(request)
        
        # Skip rate limiting for health checks
        if request.url.path in ["/", "/health"]:
            return await call_next(request)
        
        # Check rate limit
        if await self._is_rate_limited(client_ip):
            request_id = getattr(request.state, 'request_id', 'unknown')
            
            logger.info(
                f"Rate limit blocked request from {client_ip}",
                extra={
                    "client_ip": client_ip,
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "blocked": True
                }
            )
            
            # Return rate limit error
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please try again later.",
                        "status_code": 429
                    }
                },
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": "0"
                }
            )
        
        # Process request normally
        response = await call_next(request)
        
        # Add rate limit headers
        async with self._lock:
            if client_ip in self.clients:
                remaining = max(0, self.requests_per_minute - len(self.clients[client_ip]["requests"]))
                response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
                response.headers["X-RateLimit-Remaining"] = str(remaining)
        
        return response
    
    async def get_rate_limit_stats(self) -> Dict[str, any]:
        """Get rate limiting statistics."""
        async with self._lock:
            total_clients = len(self.clients)
            active_clients = sum(
                1 for client_data in self.clients.values()
                if client_data["requests"]
            )
            
            return {
                "total_clients": total_clients,
                "active_clients": active_clients,
                "requests_per_minute_limit": self.requests_per_minute,
                "burst_limit": self.burst_limit
            } 