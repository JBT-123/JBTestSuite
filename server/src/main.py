from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import health, tests, websockets
from src.api.v1 import tests as v1_tests, executions, suites, artifacts, configurations, selenium, ai, debug
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
    
    # Start the test execution orchestrator
    from src.services.test_execution_orchestrator import orchestrator
    await orchestrator.start()
    logger.info("Test execution orchestrator started")
    
    yield
    
    # Shutdown the test execution orchestrator
    logger.info("Shutting down JBTestSuite API server...")
    await orchestrator.stop()
    logger.info("Test execution orchestrator stopped")


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
# Legacy router removed - using enhanced v1 router instead
app.include_router(websockets.router, prefix="/api/v1")  # WebSocket API

# V1 API routers with enhanced features
app.include_router(v1_tests.router, prefix="/api/v1")
app.include_router(executions.router, prefix="/api/v1")
app.include_router(suites.router, prefix="/api/v1")
app.include_router(artifacts.router, prefix="/api/v1")
app.include_router(configurations.router, prefix="/api/v1")
app.include_router(selenium.router, prefix="/api/v1")  # Selenium API
app.include_router(ai.router, prefix="/api/v1")  # AI API
app.include_router(debug.router, prefix="/api/v1")  # Debug API (development only)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "JBTestSuite API - Full-Stack Web Automation Platform"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "jbtestsuite-server"}