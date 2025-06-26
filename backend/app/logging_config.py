import logging
import logging.config
import sys
from datetime import datetime
from typing import Dict, Any
import json


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add extra fields if they exist
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'duration_ms'):
            log_entry['duration_ms'] = record.duration_ms
        if hasattr(record, 'status_code'):
            log_entry['status_code'] = record.status_code
        if hasattr(record, 'method'):
            log_entry['method'] = record.method
        if hasattr(record, 'url'):
            log_entry['url'] = record.url
        if hasattr(record, 'db_operation'):
            log_entry['db_operation'] = record.db_operation
        if hasattr(record, 'table'):
            log_entry['table'] = record.table
        if hasattr(record, 'record_id'):
            log_entry['record_id'] = record.record_id
            
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
            
        return json.dumps(log_entry)


class ColoredFormatter(logging.Formatter):
    """
    Colored formatter for console output
    """
    
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{color}{record.levelname}{self.RESET}"
        return super().format(record)


def setup_logging(
    level: str = "INFO",
    json_logs: bool = False,
    log_file: str = None
) -> None:
    """
    Setup logging configuration
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: Whether to use JSON formatting
        log_file: Optional log file path
    """
    
    # Convert string level to logging constant
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    
    # Base configuration
    config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "colored": {
                "()": ColoredFormatter,
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "json": {
                "()": JSONFormatter,
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": level.upper(),
                "formatter": "json" if json_logs else "colored",
                "stream": sys.stdout,
            },
        },
        "loggers": {
            # Our application loggers
            "harvest_log": {
                "level": level.upper(),
                "handlers": ["console"],
                "propagate": False,
            },
            "harvest_log.api": {
                "level": level.upper(),
                "handlers": ["console"],
                "propagate": False,
            },
            "harvest_log.database": {
                "level": level.upper(),
                "handlers": ["console"],
                "propagate": False,
            },
            "harvest_log.middleware": {
                "level": level.upper(),
                "handlers": ["console"],
                "propagate": False,
            },
            # Third-party loggers
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "WARNING",  # Reduce noise from access logs
                "handlers": ["console"],
                "propagate": False,
            },
            "fastapi": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
        },
        "root": {
            "level": level.upper(),
            "handlers": ["console"],
        },
    }
    
    # Add file handler if log_file is specified
    if log_file:
        config["handlers"]["file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "level": level.upper(),
            "formatter": "json",
            "filename": log_file,
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
        }
        
        # Add file handler to all loggers
        for logger_config in config["loggers"].values():
            logger_config["handlers"].append("file")
        config["root"]["handlers"].append("file")
    
    logging.config.dictConfig(config)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name
    
    Args:
        name: Logger name (e.g., 'harvest_log.api', 'harvest_log.database')
    
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


# Convenience functions for common loggers
def get_api_logger() -> logging.Logger:
    """Get API logger"""
    return get_logger("harvest_log.api")


def get_database_logger() -> logging.Logger:
    """Get database logger"""
    return get_logger("harvest_log.database")


def get_app_logger() -> logging.Logger:
    """Get main application logger"""
    return get_logger("harvest_log")


def get_middleware_logger() -> logging.Logger:
    """Get middleware logger"""
    return get_logger("harvest_log.middleware") 