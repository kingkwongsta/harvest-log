from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import ConfigDict, field_validator


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Allow extra environment variables to be ignored
    )
    
    # API Configuration
    app_name: str = "Harvest Log API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # CORS Configuration - can be overridden via CORS_ORIGINS env var (comma-separated)
    cors_origins: Union[str, List[str]] = [
        "http://localhost:3000",  # Local development
        "https://harvest-log-git-main-bkwongs-projects.vercel.app",  # Vercel deployment
        "https://harvest-log-bkwongs-projects.vercel.app",  # Vercel production
        "https://harvest-log.vercel.app",  # If you have a custom domain
    ]
    cors_credentials: bool = True
    cors_methods: List[str] = ["*"]
    cors_headers: List[str] = ["*"]
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Supabase Configuration
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""
    
    # Database Configuration
    database_url: str = ""
    
    # Security Configuration (for future use)
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Logging Configuration
    log_level: str = "INFO"
    log_file: str = ""  # Optional log file path
    json_logs: bool = False  # Whether to output logs in JSON format
    slow_request_threshold: float = 1000.0  # Milliseconds

    @field_validator('cors_origins', mode='before')
    @classmethod
    def validate_cors_origins(cls, v) -> List[str]:
        """Allow CORS origins to be set via comma-separated string from env var"""
        if v is None or v == "":
            return []
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        if isinstance(v, list):
            return v
        return []


# Create a global settings instance
settings = Settings() 