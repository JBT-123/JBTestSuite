import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        case_sensitive=True
    )
    
    DATABASE_URL: str = "postgresql+asyncpg://jbuser:jbpass@postgres:5432/jbtestsuite"
    SELENIUM_HUB_URL: str = "http://selenium:4444/wd/hub"
    OPENAI_API_KEY: str = ""
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return ["http://localhost:3000", "http://127.0.0.1:3000"]
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()