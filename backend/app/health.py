"""
Comprehensive health check utilities for the harvest log application.

This module provides detailed health monitoring for all application components
including database, storage, cache, and background tasks.
"""

import asyncio
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum

from app.database import health_check as db_health_check
from app.cache import get_cache
from app.background_tasks import get_background_task_status
from app.config import settings
from app.logging_config import get_api_logger

logger = get_api_logger()


class HealthStatus(str, Enum):
    """Health status enumeration."""
    HEALTHY = "healthy"
    DEGRADED = "degraded" 
    UNHEALTHY = "unhealthy"


class ComponentHealth:
    """Individual component health information."""
    
    def __init__(self, name: str, status: HealthStatus, message: str, 
                 details: Optional[Dict[str, Any]] = None, response_time_ms: Optional[float] = None):
        self.name = name
        self.status = status
        self.message = message
        self.details = details or {}
        self.response_time_ms = response_time_ms
        self.timestamp = datetime.utcnow().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "status": self.status.value,
            "message": self.message,
            "details": self.details,
            "response_time_ms": self.response_time_ms,
            "timestamp": self.timestamp
        }


class HealthChecker:
    """Comprehensive health checker for all application components."""
    
    def __init__(self):
        self.checks: Dict[str, callable] = {
            "database": self._check_database,
            "cache": self._check_cache,
            "storage": self._check_storage,
            "background_tasks": self._check_background_tasks,
            "configuration": self._check_configuration,
            "memory": self._check_memory,
            "disk": self._check_disk
        }
    
    async def check_all(self, include_detailed: bool = False) -> Dict[str, Any]:
        """
        Run all health checks.
        
        Args:
            include_detailed: Include detailed component information
        
        Returns:
            Overall health status and component details
        """
        start_time = time.time()
        
        # Run all checks concurrently
        check_results = await asyncio.gather(
            *[self._run_single_check(name, check_func) for name, check_func in self.checks.items()],
            return_exceptions=True
        )
        
        components = {}
        overall_status = HealthStatus.HEALTHY
        failed_components = []
        degraded_components = []
        
        for i, result in enumerate(check_results):
            check_name = list(self.checks.keys())[i]
            
            if isinstance(result, Exception):
                # Check failed with exception
                component = ComponentHealth(
                    name=check_name,
                    status=HealthStatus.UNHEALTHY,
                    message=f"Check failed: {str(result)}"
                )
                failed_components.append(check_name)
                overall_status = HealthStatus.UNHEALTHY
            else:
                component = result
                if component.status == HealthStatus.UNHEALTHY:
                    failed_components.append(check_name)
                    overall_status = HealthStatus.UNHEALTHY
                elif component.status == HealthStatus.DEGRADED:
                    degraded_components.append(check_name)
                    if overall_status == HealthStatus.HEALTHY:
                        overall_status = HealthStatus.DEGRADED
            
            components[check_name] = component.to_dict() if include_detailed else {
                "status": component.status.value,
                "message": component.message
            }
        
        total_time_ms = round((time.time() - start_time) * 1000, 2)
        
        # Build response
        health_response = {
            "status": overall_status.value,
            "timestamp": datetime.utcnow().isoformat(),
            "total_check_time_ms": total_time_ms,
            "components": components,
            "summary": {
                "total_components": len(components),
                "healthy_components": len([c for c in components.values() if c["status"] == "healthy"]),
                "degraded_components": len(degraded_components),
                "failed_components": len(failed_components)
            }
        }
        
        if failed_components:
            health_response["failed_components"] = failed_components
        if degraded_components:
            health_response["degraded_components"] = degraded_components
        
        return health_response
    
    async def _run_single_check(self, name: str, check_func: callable) -> ComponentHealth:
        """Run a single health check with timing."""
        start_time = time.time()
        
        try:
            result = await check_func()
            response_time_ms = round((time.time() - start_time) * 1000, 2)
            
            if isinstance(result, ComponentHealth):
                result.response_time_ms = response_time_ms
                return result
            else:
                # Assume successful check if not ComponentHealth
                return ComponentHealth(
                    name=name,
                    status=HealthStatus.HEALTHY,
                    message="Check passed",
                    response_time_ms=response_time_ms
                )
        
        except Exception as e:
            response_time_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(f"Health check failed for {name}: {e}", exc_info=True)
            
            return ComponentHealth(
                name=name,
                status=HealthStatus.UNHEALTHY,
                message=f"Check failed: {str(e)}",
                response_time_ms=response_time_ms
            )
    
    async def _check_database(self) -> ComponentHealth:
        """Check database connectivity and performance."""
        try:
            db_status = await db_health_check()
            
            if db_status["status"] == "healthy":
                return ComponentHealth(
                    name="database",
                    status=HealthStatus.HEALTHY,
                    message="Database connection successful",
                    details=db_status
                )
            else:
                return ComponentHealth(
                    name="database",
                    status=HealthStatus.UNHEALTHY,
                    message=db_status.get("message", "Database check failed"),
                    details=db_status
                )
        
        except Exception as e:
            return ComponentHealth(
                name="database",
                status=HealthStatus.UNHEALTHY,
                message=f"Database check failed: {str(e)}"
            )
    
    async def _check_cache(self) -> ComponentHealth:
        """Check cache functionality."""
        try:
            cache = get_cache()
            
            # Test cache operations
            test_key = "health_check_test"
            test_value = {"timestamp": datetime.utcnow().isoformat()}
            
            await cache.set(test_key, test_value, ttl=10)
            retrieved_value = await cache.get(test_key)
            await cache.delete(test_key)
            
            if retrieved_value == test_value:
                stats = await cache.get_stats()
                return ComponentHealth(
                    name="cache",
                    status=HealthStatus.HEALTHY,
                    message="Cache operations successful",
                    details=stats
                )
            else:
                return ComponentHealth(
                    name="cache",
                    status=HealthStatus.UNHEALTHY,
                    message="Cache test failed - value mismatch"
                )
        
        except Exception as e:
            return ComponentHealth(
                name="cache",
                status=HealthStatus.UNHEALTHY,
                message=f"Cache check failed: {str(e)}"
            )
    
    async def _check_storage(self) -> ComponentHealth:
        """Check storage service availability."""
        try:
            # For now, just check if storage service is importable and configured
            from app.storage import storage_service
            
            # Check if Supabase storage is configured
            if hasattr(storage_service, 'supabase') and storage_service.supabase:
                return ComponentHealth(
                    name="storage",
                    status=HealthStatus.HEALTHY,
                    message="Storage service available",
                    details={
                        "service": "supabase_storage",
                        "configured": True
                    }
                )
            else:
                return ComponentHealth(
                    name="storage",
                    status=HealthStatus.DEGRADED,
                    message="Storage service not fully configured"
                )
        
        except Exception as e:
            return ComponentHealth(
                name="storage",
                status=HealthStatus.UNHEALTHY,
                message=f"Storage check failed: {str(e)}"
            )
    
    async def _check_background_tasks(self) -> ComponentHealth:
        """Check background task status."""
        try:
            task_status = await get_background_task_status()
            
            if task_status["status"] == "running":
                return ComponentHealth(
                    name="background_tasks",
                    status=HealthStatus.HEALTHY,
                    message="Background tasks running",
                    details=task_status
                )
            else:
                return ComponentHealth(
                    name="background_tasks",
                    status=HealthStatus.DEGRADED,
                    message="Background tasks not running",
                    details=task_status
                )
        
        except Exception as e:
            return ComponentHealth(
                name="background_tasks",
                status=HealthStatus.DEGRADED,
                message=f"Background task check failed: {str(e)}"
            )
    
    async def _check_configuration(self) -> ComponentHealth:
        """Check application configuration."""
        try:
            issues = []
            
            # Check critical configuration
            if not settings.supabase_url:
                issues.append("SUPABASE_URL not configured")
            
            if not settings.supabase_service_key:
                issues.append("SUPABASE_SERVICE_KEY not configured")
            
            # Check optional but important configuration
            warnings = []
            if not settings.secret_key or settings.secret_key == "dev-secret-key":
                warnings.append("Using default secret key (not secure for production)")
            
            if issues:
                return ComponentHealth(
                    name="configuration",
                    status=HealthStatus.UNHEALTHY,
                    message=f"Configuration issues: {', '.join(issues)}",
                    details={"issues": issues, "warnings": warnings}
                )
            elif warnings:
                return ComponentHealth(
                    name="configuration",
                    status=HealthStatus.DEGRADED,
                    message=f"Configuration warnings: {', '.join(warnings)}",
                    details={"warnings": warnings}
                )
            else:
                return ComponentHealth(
                    name="configuration",
                    status=HealthStatus.HEALTHY,
                    message="Configuration valid"
                )
        
        except Exception as e:
            return ComponentHealth(
                name="configuration",
                status=HealthStatus.UNHEALTHY,
                message=f"Configuration check failed: {str(e)}"
            )
    
    async def _check_memory(self) -> ComponentHealth:
        """Check memory usage."""
        try:
            import psutil
            
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            if memory_percent > 90:
                status = HealthStatus.UNHEALTHY
                message = f"High memory usage: {memory_percent}%"
            elif memory_percent > 80:
                status = HealthStatus.DEGRADED  
                message = f"Elevated memory usage: {memory_percent}%"
            else:
                status = HealthStatus.HEALTHY
                message = f"Memory usage normal: {memory_percent}%"
            
            return ComponentHealth(
                name="memory",
                status=status,
                message=message,
                details={
                    "percent_used": memory_percent,
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2)
                }
            )
        
        except ImportError:
            return ComponentHealth(
                name="memory",
                status=HealthStatus.DEGRADED,
                message="psutil not available for memory monitoring"
            )
        except Exception as e:
            return ComponentHealth(
                name="memory",
                status=HealthStatus.DEGRADED,
                message=f"Memory check failed: {str(e)}"
            )
    
    async def _check_disk(self) -> ComponentHealth:
        """Check disk usage."""
        try:
            import psutil
            
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            
            if disk_percent > 90:
                status = HealthStatus.UNHEALTHY
                message = f"High disk usage: {disk_percent:.1f}%"
            elif disk_percent > 80:
                status = HealthStatus.DEGRADED
                message = f"Elevated disk usage: {disk_percent:.1f}%"
            else:
                status = HealthStatus.HEALTHY
                message = f"Disk usage normal: {disk_percent:.1f}%"
            
            return ComponentHealth(
                name="disk",
                status=status,
                message=message,
                details={
                    "percent_used": round(disk_percent, 1),
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2)
                }
            )
        
        except ImportError:
            return ComponentHealth(
                name="disk",
                status=HealthStatus.DEGRADED,
                message="psutil not available for disk monitoring"
            )
        except Exception as e:
            return ComponentHealth(
                name="disk",
                status=HealthStatus.DEGRADED,
                message=f"Disk check failed: {str(e)}"
            )


# Global health checker instance
health_checker = HealthChecker()