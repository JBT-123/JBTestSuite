from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc
from sqlalchemy.orm import selectinload

from src.core.database import get_async_session
from src.models.test_execution import TestRun, TestExecution, TestStepExecution
from src.api.schemas import (
    TestRunCreate,
    TestRunUpdate,
    TestRunResponse,
    TestRunWithExecutionsResponse,
    TestExecutionResponse,
    TestExecutionDetailResponse,
    TestStepExecutionResponse,
    PaginatedResponse,
    FilterParams,
    PaginationParams,
    SortParams,
)

router = APIRouter(prefix="/executions", tags=["executions"])


# Test Runs endpoints
@router.get("/runs", response_model=PaginatedResponse[TestRunResponse])
async def get_test_runs(
    pagination: PaginationParams = Depends(),
    filters: FilterParams = Depends(),
    sort: SortParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(TestRun)
    
    # Apply filters
    if filters.status:
        query = query.where(TestRun.status == filters.status)
    if filters.created_after:
        query = query.where(TestRun.created_at >= filters.created_after)
    if filters.created_before:
        query = query.where(TestRun.created_at <= filters.created_before)
    
    # Apply sorting
    sort_field = getattr(TestRun, sort.sort_by, TestRun.created_at)
    if sort.order == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Count total items
    count_query = select(func.count()).select_from(TestRun)
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.limit
    query = query.offset(offset).limit(pagination.limit)
    
    result = await session.execute(query)
    test_runs = result.scalars().all()
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        items=test_runs,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages
    )


@router.post("/runs", response_model=TestRunResponse, status_code=status.HTTP_201_CREATED)
async def create_test_run(
    run_data: TestRunCreate,
    session: AsyncSession = Depends(get_async_session)
):
    run = TestRun(**run_data.model_dump(exclude={"test_case_ids"}))
    session.add(run)
    await session.flush()
    
    # Create test executions for specified test cases
    if run_data.test_case_ids:
        for test_case_id in run_data.test_case_ids:
            execution = TestExecution(
                test_run_id=run.id,
                test_case_id=test_case_id
            )
            session.add(execution)
        
        run.total_tests = len(run_data.test_case_ids)
    
    await session.commit()
    await session.refresh(run)
    return run


@router.get("/runs/{run_id}", response_model=TestRunWithExecutionsResponse)
async def get_test_run(
    run_id: UUID,
    include_executions: bool = Query(True, description="Include test executions"),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(TestRun).where(TestRun.id == run_id)
    
    if include_executions:
        query = query.options(selectinload(TestRun.executions))
    
    result = await session.execute(query)
    run = result.scalar_one_or_none()
    
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found")
    
    return run


@router.put("/runs/{run_id}", response_model=TestRunResponse)
async def update_test_run(
    run_id: UUID,
    run_data: TestRunUpdate,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestRun).where(TestRun.id == run_id))
    run = result.scalar_one_or_none()
    
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found")
    
    update_data = run_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(run, field, value)
    
    await session.commit()
    await session.refresh(run)
    return run


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_run(
    run_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestRun).where(TestRun.id == run_id))
    run = result.scalar_one_or_none()
    
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found")
    
    await session.delete(run)
    await session.commit()


# Test Executions endpoints
@router.get("/", response_model=PaginatedResponse[TestExecutionResponse])
async def get_test_executions(
    run_id: Optional[UUID] = Query(None, description="Filter by test run ID"),
    test_case_id: Optional[UUID] = Query(None, description="Filter by test case ID"),
    status: Optional[str] = Query(None, description="Filter by execution status"),
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(TestExecution)
    
    # Apply filters
    if run_id:
        query = query.where(TestExecution.test_run_id == run_id)
    if test_case_id:
        query = query.where(TestExecution.test_case_id == test_case_id)
    if status:
        query = query.where(TestExecution.status == status)
    
    # Apply sorting
    sort_field = getattr(TestExecution, sort.sort_by, TestExecution.created_at)
    if sort.order == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Count total items
    count_query = select(func.count()).select_from(TestExecution)
    if run_id:
        count_query = count_query.where(TestExecution.test_run_id == run_id)
    if test_case_id:
        count_query = count_query.where(TestExecution.test_case_id == test_case_id)
    if status:
        count_query = count_query.where(TestExecution.status == status)
    
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.limit
    query = query.offset(offset).limit(pagination.limit)
    
    result = await session.execute(query)
    executions = result.scalars().all()
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        items=executions,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages
    )


# Temporarily commented out due to forward reference issue
# @router.get("/{execution_id}", response_model=TestExecutionDetailResponse)
async def get_test_execution(
    execution_id: UUID,
    include_steps: bool = Query(True, description="Include step executions"),
    include_screenshots: bool = Query(True, description="Include screenshots"),
    include_logs: bool = Query(True, description="Include log entries"),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(TestExecution).where(TestExecution.id == execution_id)
    
    if include_steps:
        query = query.options(selectinload(TestExecution.step_executions))
    if include_screenshots:
        query = query.options(selectinload(TestExecution.screenshots))
    if include_logs:
        query = query.options(selectinload(TestExecution.log_entries))
    
    result = await session.execute(query)
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    
    return execution


@router.put("/{execution_id}/status", response_model=TestExecutionResponse)
async def update_execution_status(
    execution_id: UUID,
    status: str,
    error_message: Optional[str] = None,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestExecution).where(TestExecution.id == execution_id))
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    
    execution.status = status
    if error_message:
        execution.error_message = error_message
    
    await session.commit()
    await session.refresh(execution)
    return execution


# Test Step Executions endpoints
@router.get("/{execution_id}/steps", response_model=List[TestStepExecutionResponse])
async def get_test_step_executions(
    execution_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    # Verify execution exists
    result = await session.execute(select(TestExecution).where(TestExecution.id == execution_id))
    execution = result.scalar_one_or_none()
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    
    # Get step executions
    result = await session.execute(
        select(TestStepExecution)
        .where(TestStepExecution.test_execution_id == execution_id)
        .order_by(TestStepExecution.order_index)
    )
    step_executions = result.scalars().all()
    return step_executions


# Analytics endpoints
@router.get("/runs/{run_id}/analytics", response_model=dict)
async def get_run_analytics(
    run_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    # Verify run exists
    result = await session.execute(select(TestRun).where(TestRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found")
    
    # Get execution statistics
    result = await session.execute(
        select(
            func.count(TestExecution.id).label("total_executions"),
            func.count().filter(TestExecution.status == "passed").label("passed"),
            func.count().filter(TestExecution.status == "failed").label("failed"),
            func.count().filter(TestExecution.status == "skipped").label("skipped"),
            func.avg(TestExecution.duration_seconds).label("avg_duration"),
        )
        .where(TestExecution.test_run_id == run_id)
    )
    stats = result.first()
    
    return {
        "run_id": run_id,
        "total_executions": stats.total_executions or 0,
        "passed": stats.passed or 0,
        "failed": stats.failed or 0,
        "skipped": stats.skipped or 0,
        "success_rate": (stats.passed / stats.total_executions * 100) if stats.total_executions else 0,
        "average_duration_seconds": float(stats.avg_duration) if stats.avg_duration else 0,
    }