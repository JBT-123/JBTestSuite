from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://jbuser:jbpass@postgres:5432/jbtestsuite"
    SELENIUM_HUB_URL: str = "http://selenium:4444/wd/hub"
    OPENAI_API_KEY: str = ""
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()