from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.database import get_db
from ..models.test_case import TestCase
from ..services import TestExecutor
from .schemas import TestCaseCreate, TestCaseResponse, TestCaseUpdate

router = APIRouter(prefix="/test-cases", tags=["test-cases"])


@router.post("/", response_model=TestCaseResponse)
async def create_test_case(
    test_case: TestCaseCreate,
    db: AsyncSession = Depends(get_db)
):
    db_test_case = TestCase(**test_case.model_dump())
    db.add(db_test_case)
    await db.commit()
    await db.refresh(db_test_case)
    return db_test_case


@router.get("/", response_model=List[TestCaseResponse])
async def get_test_cases(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TestCase).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{test_case_id}", response_model=TestCaseResponse)
async def get_test_case(
    test_case_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TestCase).where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return test_case


@router.put("/{test_case_id}", response_model=TestCaseResponse)
async def update_test_case(
    test_case_id: int,
    test_case_update: TestCaseUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TestCase).where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    update_data = test_case_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(test_case, field, value)
    
    await db.commit()
    await db.refresh(test_case)
    return test_case


@router.delete("/{test_case_id}")
async def delete_test_case(
    test_case_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TestCase).where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    await db.delete(test_case)
    await db.commit()
    return {"detail": "Test case deleted successfully"}


@router.post("/{test_case_id}/execute")
async def execute_test_case(
    test_case_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TestCase).where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    executor = TestExecutor()
    background_tasks.add_task(executor.execute_test, test_case_id, db)
    
    return {"detail": "Test execution started", "test_case_id": test_case_id}