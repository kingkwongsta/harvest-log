from pydantic_settings import BaseSettings
from typing import List
from pydantic import ConfigDict


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
    
    # CORS Configuration
    cors_origins: List[str] = ["http://localhost:3000"]
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


# Create a global settings instance
settings = Settings() 