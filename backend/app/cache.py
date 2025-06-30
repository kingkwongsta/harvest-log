"""
Caching utilities for the harvest log application.

This module provides in-memory caching functionality to improve performance
for frequently accessed data.
"""

import json
import hashlib
from typing import Any, Optional, Dict, List, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
from functools import wraps
import asyncio

from app.logging_config import get_api_logger

logger = get_api_logger()


@dataclass
class CacheEntry:
    """Cache entry with metadata."""
    value: Any
    created_at: datetime
    expires_at: Optional[datetime]
    access_count: int = 0
    last_accessed: Optional[datetime] = None


class InMemoryCache:
    """Thread-safe in-memory cache implementation."""
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        """
        Initialize cache.
        
        Args:
            max_size: Maximum number of entries in cache
            default_ttl: Default time-to-live in seconds
        """
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        async with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            
            # Check if expired
            if entry.expires_at and datetime.now() > entry.expires_at:
                del self._cache[key]
                logger.debug(f"Cache entry expired and removed: {key}")
                return None
            
            # Update access stats
            entry.access_count += 1
            entry.last_accessed = datetime.now()
            
            logger.debug(f"Cache hit: {key} (accessed {entry.access_count} times)")
            return entry.value
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache."""
        async with self._lock:
            ttl = ttl or self.default_ttl
            expires_at = datetime.now() + timedelta(seconds=ttl) if ttl > 0 else None
            
            # Remove oldest entries if cache is full
            if len(self._cache) >= self.max_size and key not in self._cache:
                await self._evict_lru()
            
            entry = CacheEntry(
                value=value,
                created_at=datetime.now(),
                expires_at=expires_at
            )
            
            self._cache[key] = entry
            logger.debug(f"Cache set: {key} (TTL: {ttl}s)")
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                logger.debug(f"Cache deleted: {key}")
                return True
            return False
    
    async def clear(self) -> None:
        """Clear all cache entries."""
        async with self._lock:
            self._cache.clear()
            logger.info("Cache cleared")
    
    async def _evict_lru(self) -> None:
        """Evict least recently used entry."""
        if not self._cache:
            return
        
        # Find entry with oldest last_accessed (or created_at if never accessed)
        lru_key = None
        lru_time = datetime.max
        
        for key, entry in self._cache.items():
            access_time = entry.last_accessed or entry.created_at
            if access_time < lru_time:
                lru_time = access_time
                lru_key = key
        
        if lru_key:
            del self._cache[lru_key]
            logger.debug(f"Cache LRU eviction: {lru_key}")
    
    async def cleanup_expired(self) -> int:
        """Remove expired entries and return count removed."""
        async with self._lock:
            now = datetime.now()
            expired_keys = [
                key for key, entry in self._cache.items()
                if entry.expires_at and now > entry.expires_at
            ]
            
            for key in expired_keys:
                del self._cache[key]
            
            if expired_keys:
                logger.info(f"Cache cleanup: removed {len(expired_keys)} expired entries")
            
            return len(expired_keys)
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        async with self._lock:
            total_entries = len(self._cache)
            total_accesses = sum(entry.access_count for entry in self._cache.values())
            expired_count = sum(
                1 for entry in self._cache.values()
                if entry.expires_at and datetime.now() > entry.expires_at
            )
            
            return {
                "total_entries": total_entries,
                "max_size": self.max_size,
                "total_accesses": total_accesses,
                "expired_entries": expired_count,
                "hit_rate": 0.0 if total_accesses == 0 else (total_accesses / total_entries),
            }


# Global cache instance
_cache = InMemoryCache(max_size=1000, default_ttl=300)


def get_cache() -> InMemoryCache:
    """Get the global cache instance."""
    return _cache


def cache_key(*args, **kwargs) -> str:
    """Generate cache key from arguments."""
    # Create a stable string representation
    key_data = {
        "args": args,
        "kwargs": sorted(kwargs.items())
    }
    key_str = json.dumps(key_data, sort_keys=True, default=str)
    
    # Hash to create fixed-length key
    return hashlib.md5(key_str.encode()).hexdigest()


def cached(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator for caching function results.
    
    Args:
        ttl: Time-to-live in seconds
        key_prefix: Prefix for cache keys
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            func_key = f"{key_prefix}:{func.__name__}" if key_prefix else func.__name__
            arg_key = cache_key(*args, **kwargs)
            full_key = f"{func_key}:{arg_key}"
            
            # Try to get from cache
            cached_result = await _cache.get(full_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await _cache.set(full_key, result, ttl)
            
            return result
        
        # Add cache management methods
        wrapper.cache_clear = lambda: _cache.clear()
        wrapper.cache_delete = lambda *args, **kwargs: _cache.delete(
            f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
        )
        
        return wrapper
    return decorator


class CacheManager:
    """High-level cache management for specific data types."""
    
    def __init__(self, cache: InMemoryCache):
        self.cache = cache
    
    async def get_harvest_logs_list(self, filters: Dict[str, Any]) -> Optional[List[Dict]]:
        """Get cached harvest logs list."""
        key = f"harvest_logs:list:{cache_key(**filters)}"
        return await self.cache.get(key)
    
    async def set_harvest_logs_list(self, filters: Dict[str, Any], data: List[Dict], ttl: int = 300) -> None:
        """Cache harvest logs list."""
        key = f"harvest_logs:list:{cache_key(**filters)}"
        await self.cache.set(key, data, ttl)
    
    async def get_harvest_log(self, log_id: str) -> Optional[Dict]:
        """Get cached individual harvest log."""
        key = f"harvest_log:{log_id}"
        return await self.cache.get(key)
    
    async def set_harvest_log(self, log_id: str, data: Dict, ttl: int = 600) -> None:
        """Cache individual harvest log."""
        key = f"harvest_log:{log_id}"
        await self.cache.set(key, data, ttl)
    
    async def invalidate_harvest_log(self, log_id: str) -> None:
        """Invalidate cached harvest log."""
        await self.cache.delete(f"harvest_log:{log_id}")
        # Also invalidate list caches (simplified - in production you'd track dependencies)
        await self.invalidate_harvest_logs_lists()
    
    async def invalidate_harvest_logs_lists(self) -> None:
        """Invalidate all cached harvest logs lists."""
        # In a production system, you'd track which list caches exist
        # For now, we'll clear all entries starting with the prefix
        keys_to_delete = []
        async with self.cache._lock:
            for key in self.cache._cache.keys():
                if key.startswith("harvest_logs:list:"):
                    keys_to_delete.append(key)
        
        for key in keys_to_delete:
            await self.cache.delete(key)
    
    async def get_harvest_stats(self) -> Optional[Dict]:
        """Get cached harvest statistics."""
        return await self.cache.get("harvest_stats")
    
    async def set_harvest_stats(self, data: Dict, ttl: int = 180) -> None:
        """Cache harvest statistics."""
        await self.cache.set("harvest_stats", data, ttl)
    
    async def invalidate_harvest_stats(self) -> None:
        """Invalidate cached harvest statistics."""
        await self.cache.delete("harvest_stats")
    
    # Plant events cache methods
    async def get_plant_event(self, event_id: str) -> Optional[Dict]:
        """Get cached individual plant event."""
        key = f"plant_event:{event_id}"
        return await self.cache.get(key)
    
    async def set_plant_event(self, event_id: str, data: Dict, ttl: int = 600) -> None:
        """Cache individual plant event."""
        key = f"plant_event:{event_id}"
        await self.cache.set(key, data, ttl)
    
    async def invalidate_plant_event(self, event_id: str) -> None:
        """Invalidate cached plant event."""
        await self.cache.delete(f"plant_event:{event_id}")
        # Also invalidate list caches
        await self.invalidate_plant_events_lists()
    
    async def invalidate_plant_events_lists(self) -> None:
        """Invalidate all cached plant events lists."""
        keys_to_delete = []
        async with self.cache._lock:
            for key in self.cache._cache.keys():
                if key.startswith("plant_events:list:"):
                    keys_to_delete.append(key)
        
        for key in keys_to_delete:
            await self.cache.delete(key)
    
    async def get_event_stats(self) -> Optional[Dict]:
        """Get cached event statistics."""
        return await self.cache.get("event_stats")
    
    async def set_event_stats(self, data: Dict, ttl: int = 180) -> None:
        """Cache event statistics."""
        await self.cache.set("event_stats", data, ttl)
    
    async def invalidate_event_stats(self) -> None:
        """Invalidate cached event statistics."""
        await self.cache.delete("event_stats")


# Global cache manager instance
cache_manager = CacheManager(_cache)


async def cleanup_cache_task():
    """Background task to cleanup expired cache entries."""
    while True:
        try:
            await _cache.cleanup_expired()
            # Run cleanup every 5 minutes
            await asyncio.sleep(300)
        except Exception as e:
            logger.error(f"Cache cleanup task error: {e}", exc_info=True)
            await asyncio.sleep(60)  # Retry after 1 minute on error