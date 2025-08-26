from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import health, tests
from src.api.v1 import tests as v1_tests, executions, suites, artifacts, configurations
from src.core.config import settings
from src.core.database import engine, create_tables
from src.core.logging import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting JBTestSuite API server...")
    await create_tables()
    logger.info("Database tables created/verified")
    yield
    logger.info("Shutting down JBTestSuite API server...")


app = FastAPI(
    title="JBTestSuite API",
    description="Full-Stack Web Automation Platform with AI Integration",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(tests.router, prefix="/api/v1")  # Legacy router for backward compatibility

# V1 API routers with enhanced features
app.include_router(v1_tests.router, prefix="/api/v1")
app.include_router(executions.router, prefix="/api/v1")
app.include_router(suites.router, prefix="/api/v1")
app.include_router(artifacts.router, prefix="/api/v1")
app.include_router(configurations.router, prefix="/api/v1")


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "JBTestSuite API - Full-Stack Web Automation Platform"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "jbtestsuite-server"}