from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc
from sqlalchemy.orm import selectinload

from src.core.database import get_async_session
from src.models.test_definition import TestCase, TestStep
from src.api.schemas import (
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
    TestCaseListResponse,
    TestStepCreate,
    TestStepUpdate,
    TestStepResponse,
    PaginatedResponse,
    BulkOperationResponse,
    FilterParams,
    PaginationParams,
    SortParams,
)

router = APIRouter(prefix="/tests", tags=["tests"])


@router.get("/", response_model=PaginatedResponse[TestCaseListResponse])
async def get_tests(
    pagination: PaginationParams = Depends(),
    filters: FilterParams = Depends(),
    sort: SortParams = Depends(),
    fields: Optional[str] = Query(None, description="Comma-separated fields to include"),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(TestCase)
    
    # Apply filters
    if filters.status:
        query = query.where(TestCase.status == filters.status)
    if filters.category:
        query = query.where(TestCase.category == filters.category)
    if filters.author:
        query = query.where(TestCase.author == filters.author)
    if filters.tags:
        for tag in filters.tags:
            query = query.where(TestCase.tags.contains([tag]))
    if filters.created_after:
        query = query.where(TestCase.created_at >= filters.created_after)
    if filters.created_before:
        query = query.where(TestCase.created_at <= filters.created_before)
    
    # Apply sorting
    sort_field = getattr(TestCase, sort.sort_by, TestCase.created_at)
    if sort.order == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Count total items
    count_query = select(func.count()).select_from(TestCase)
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.limit
    query = query.offset(offset).limit(pagination.limit)
    
    # Load with step count and execution stats
    query = query.options(selectinload(TestCase.steps))
    
    result = await session.execute(query)
    test_cases = result.scalars().all()
    
    # Transform to list response format
    items = []
    for test_case in test_cases:
        item_data = {
            "id": test_case.id,
            "name": test_case.name,
            "description": test_case.description,
            "status": test_case.status,
            "priority": test_case.priority,
            "tags": test_case.tags,
            "author": test_case.author,
            "category": test_case.category,
            "is_automated": test_case.is_automated,
            "step_count": len(test_case.steps) if test_case.steps else 0,
            "execution_count": 0,  # TODO: Add execution count query
            "last_execution_status": None,  # TODO: Add last execution status query
            "created_at": test_case.created_at,
            "updated_at": test_case.updated_at,
        }
        items.append(TestCaseListResponse(**item_data))
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages
    )


@router.post("/", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
async def create_test(
    test_data: TestCaseCreate,
    session: AsyncSession = Depends(get_async_session)
):
    test_case = TestCase(**test_data.model_dump())
    session.add(test_case)
    await session.commit()
    await session.refresh(test_case)
    return TestCaseResponse.model_validate(test_case)


@router.get("/{test_id}", response_model=TestCaseResponse)
async def get_test(
    test_id: UUID,
    include_steps: bool = Query(True, description="Include test steps"),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(TestCase).where(TestCase.id == test_id)
    
    if include_steps:
        query = query.options(selectinload(TestCase.steps))
    
    result = await session.execute(query)
    test_case = result.scalar_one_or_none()
    
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    return TestCaseResponse.model_validate(test_case)


@router.put("/{test_id}", response_model=TestCaseResponse)
async def update_test(
    test_id: UUID,
    test_data: TestCaseUpdate,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestCase).where(TestCase.id == test_id))
    test_case = result.scalar_one_or_none()
    
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    update_data = test_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(test_case, field, value)
    
    await session.commit()
    await session.refresh(test_case)
    return TestCaseResponse.model_validate(test_case)


@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test(
    test_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestCase).where(TestCase.id == test_id))
    test_case = result.scalar_one_or_none()
    
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    await session.delete(test_case)
    await session.commit()


@router.post("/bulk", response_model=BulkOperationResponse)
async def bulk_create_tests(
    tests_data: List[TestCaseCreate],
    session: AsyncSession = Depends(get_async_session)
):
    success_count = 0
    failure_count = 0
    errors = []
    
    for i, test_data in enumerate(tests_data):
        try:
            test_case = TestCase(**test_data.model_dump())
            session.add(test_case)
            success_count += 1
        except Exception as e:
            failure_count += 1
            errors.append(f"Item {i}: {str(e)}")
    
    try:
        await session.commit()
    except Exception as e:
        await session.rollback()
        return BulkOperationResponse(
            success_count=0,
            failure_count=len(tests_data),
            total_count=len(tests_data),
            errors=[f"Bulk operation failed: {str(e)}"]
        )
    
    return BulkOperationResponse(
        success_count=success_count,
        failure_count=failure_count,
        total_count=len(tests_data),
        errors=errors if errors else None
    )


# Test Steps endpoints
@router.get("/{test_id}/steps", response_model=List[TestStepResponse])
async def get_test_steps(
    test_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    # Verify test case exists
    result = await session.execute(select(TestCase).where(TestCase.id == test_id))
    test_case = result.scalar_one_or_none()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    # Get steps
    result = await session.execute(
        select(TestStep)
        .where(TestStep.test_case_id == test_id)
        .order_by(TestStep.order_index)
    )
    steps = result.scalars().all()
    return [TestStepResponse.model_validate(step) for step in steps]


@router.post("/{test_id}/steps", response_model=TestStepResponse, status_code=status.HTTP_201_CREATED)
async def create_test_step(
    test_id: UUID,
    step_data: TestStepCreate,
    session: AsyncSession = Depends(get_async_session)
):
    # Verify test case exists
    result = await session.execute(select(TestCase).where(TestCase.id == test_id))
    test_case = result.scalar_one_or_none()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    step = TestStep(test_case_id=test_id, **step_data.model_dump())
    session.add(step)
    await session.commit()
    await session.refresh(step)
    return TestStepResponse.model_validate(step)


@router.put("/{test_id}/steps/{step_id}", response_model=TestStepResponse)
async def update_test_step(
    test_id: UUID,
    step_id: UUID,
    step_data: TestStepUpdate,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(
        select(TestStep).where(
            and_(TestStep.id == step_id, TestStep.test_case_id == test_id)
        )
    )
    step = result.scalar_one_or_none()
    
    if not step:
        raise HTTPException(status_code=404, detail="Test step not found")
    
    update_data = step_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(step, field, value)
    
    await session.commit()
    await session.refresh(step)
    return TestStepResponse.model_validate(step)


@router.delete("/{test_id}/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_step(
    test_id: UUID,
    step_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(
        select(TestStep).where(
            and_(TestStep.id == step_id, TestStep.test_case_id == test_id)
        )
    )
    step = result.scalar_one_or_none()
    
    if not step:
        raise HTTPException(status_code=404, detail="Test step not found")
    
    await session.delete(step)
    await session.commit()


# Search endpoints
@router.get("/search", response_model=PaginatedResponse[TestCaseListResponse])
async def search_tests(
    q: str = Query(..., min_length=1, description="Search query"),
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    # Simple text search across name and description
    search_term = f"%{q}%"
    query = select(TestCase).where(
        or_(
            TestCase.name.ilike(search_term),
            TestCase.description.ilike(search_term)
        )
    )
    
    # Count total items
    count_query = select(func.count()).select_from(TestCase).where(
        or_(
            TestCase.name.ilike(search_term),
            TestCase.description.ilike(search_term)
        )
    )
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.limit
    query = query.offset(offset).limit(pagination.limit)
    query = query.options(selectinload(TestCase.steps))
    
    result = await session.execute(query)
    test_cases = result.scalars().all()
    
    # Transform to list response format
    items = []
    for test_case in test_cases:
        item_data = {
            "id": test_case.id,
            "name": test_case.name,
            "description": test_case.description,
            "status": test_case.status,
            "priority": test_case.priority,
            "tags": test_case.tags,
            "author": test_case.author,
            "category": test_case.category,
            "is_automated": test_case.is_automated,
            "step_count": len(test_case.steps) if test_case.steps else 0,
            "execution_count": 0,
            "last_execution_status": None,
            "created_at": test_case.created_at,
            "updated_at": test_case.updated_at,
        }
        items.append(TestCaseListResponse(**item_data))
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages
    )