from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.database import get_async_session
from src.models.test_case import TestCase
from src.api.schemas import TestCaseCreate, TestCaseResponse

router = APIRouter(prefix="/tests", tags=["tests"])


@router.get("/", response_model=List[TestCaseResponse])
async def get_tests(session: AsyncSession = Depends(get_async_session)) -> List[TestCase]:
    result = await session.execute(select(TestCase))
    return result.scalars().all()


@router.post("/", response_model=TestCaseResponse)
async def create_test(
    test_data: TestCaseCreate, session: AsyncSession = Depends(get_async_session)
) -> TestCase:
    test_case = TestCase(**test_data.model_dump())
    session.add(test_case)
    await session.commit()
    await session.refresh(test_case)
    return test_case


@router.get("/{test_id}", response_model=TestCaseResponse)
async def get_test(test_id: UUID, session: AsyncSession = Depends(get_async_session)) -> TestCase:
    result = await session.execute(select(TestCase).where(TestCase.id == test_id))
    test_case = result.scalar_one_or_none()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return test_case