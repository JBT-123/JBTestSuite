from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from src.core.database import get_async_session

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "jbtestsuite-server"}


@router.get("/database")
async def database_health(session: AsyncSession = Depends(get_async_session)) -> dict[str, str]:
    try:
        result = await session.execute(text("SELECT 1"))
        result.scalar_one()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": f"error: {str(e)}"}