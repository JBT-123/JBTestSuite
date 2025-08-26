import os
import secrets
from typing import Any, Dict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    
    # Database
    database_host: str = os.getenv("DB_HOST", "postgres")
    database_port: int = int(os.getenv("DB_PORT", "5432"))
    database_name: str = os.getenv("DB_NAME", "jbtestsuite")
    database_user: str = os.getenv("DB_USER", "user")
    database_password: str = os.getenv("DB_PASSWORD", "password")
    
    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.database_user}:{self.database_password}@{self.database_host}:{self.database_port}/{self.database_name}"
    
    # External APIs
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # Services
    selenium_hub_url: str = os.getenv("SELENIUM_HUB_URL", "http://selenium:4444/wd/hub")
    
    # CORS
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()