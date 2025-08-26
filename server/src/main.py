from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import test_cases, websocket
from .core.config import settings

app = FastAPI(
    title="JBTestSuite API",
    description="Full-Stack Web Automation Platform with AI Integration",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(test_cases.router, prefix="/api")
app.include_router(websocket.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "JBTestSuite API",
        "environment": settings.environment,
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

