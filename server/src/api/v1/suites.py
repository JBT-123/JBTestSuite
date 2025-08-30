from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc
from sqlalchemy.orm import selectinload

from src.core.database import get_async_session
from src.models.test_definition import TestSuite, TestCase, test_suite_test_cases
from src.api.schemas import (
    TestSuiteCreate,
    TestSuiteUpdate,
    TestSuiteResponse,
    TestSuiteWithTestsResponse,
    PaginatedResponse,
    BulkOperationResponse,
    FilterParams,
    PaginationParams,
    SortParams,
)

router = APIRouter(prefix="/suites", tags=["suites"])


@router.get("/", response_model=PaginatedResponse[TestSuiteResponse])
async def get_test_suites(
    pagination: PaginationParams = Depends(),
    filters: FilterParams = Depends(),
    sort: SortParams = Depends(),
    active_only: bool = Query(True, description="Only return active suites"),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(TestSuite)
    
    # Apply filters
    if active_only:
        query = query.where(TestSuite.is_active == True)
    if filters.status:  # Using tags field for filtering
        query = query.where(TestSuite.tags.contains([filters.status]))
    if filters.created_after:
        query = query.where(TestSuite.created_at >= filters.created_after)
    if filters.created_before:
        query = query.where(TestSuite.created_at <= filters.created_before)
    
    # Apply sorting
    sort_field = getattr(TestSuite, sort.sort_by, TestSuite.created_at)
    if sort.order == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Count total items
    count_query = select(func.count()).select_from(TestSuite)
    if active_only:
        count_query = count_query.where(TestSuite.is_active == True)
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.limit
    query = query.offset(offset).limit(pagination.limit)
    
    # Load with test case count
    query = query.options(selectinload(TestSuite.test_cases))
    
    result = await session.execute(query)
    test_suites = result.scalars().all()
    
    # Transform to response format with counts
    items = []
    for suite in test_suites:
        suite_data = {
            "id": suite.id,
            "name": suite.name,
            "description": suite.description,
            "tags": suite.tags,
            "configuration": suite.configuration,
            "is_active": suite.is_active,
            "created_by": suite.created_by,
            "created_at": suite.created_at,
            "updated_at": suite.updated_at,
            "test_case_count": len(suite.test_cases) if suite.test_cases else 0,
            "last_run_status": None,  # TODO: Add last run status query
            "last_run_date": None,  # TODO: Add last run date query
        }
        items.append(TestSuiteResponse(**suite_data))
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages
    )


@router.post("/", response_model=TestSuiteResponse, status_code=status.HTTP_201_CREATED)
async def create_test_suite(
    suite_data: TestSuiteCreate,
    session: AsyncSession = Depends(get_async_session)
):
    suite = TestSuite(**suite_data.model_dump(exclude={"test_case_ids"}))
    session.add(suite)
    await session.flush()
    
    # Associate test cases if provided
    if suite_data.test_case_ids:
        for i, test_case_id in enumerate(suite_data.test_case_ids):
            # Verify test case exists
            result = await session.execute(select(TestCase).where(TestCase.id == test_case_id))
            test_case = result.scalar_one_or_none()
            if test_case:
                suite.test_cases.append(test_case)
    
    await session.commit()
    await session.refresh(suite)
    return suite


@router.get("/{suite_id}", response_model=TestSuiteWithTestsResponse)
async def get_test_suite(
    suite_id: UUID,
    include_tests: bool = Query(True, description="Include test cases"),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(TestSuite).where(TestSuite.id == suite_id)
    
    if include_tests:
        query = query.options(selectinload(TestSuite.test_cases))
    
    result = await session.execute(query)
    suite = result.scalar_one_or_none()
    
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    return suite


@router.put("/{suite_id}", response_model=TestSuiteResponse)
async def update_test_suite(
    suite_id: UUID,
    suite_data: TestSuiteUpdate,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestSuite).where(TestSuite.id == suite_id))
    suite = result.scalar_one_or_none()
    
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    update_data = suite_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(suite, field, value)
    
    await session.commit()
    await session.refresh(suite)
    return suite


@router.delete("/{suite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_suite(
    suite_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestSuite).where(TestSuite.id == suite_id))
    suite = result.scalar_one_or_none()
    
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    await session.delete(suite)
    await session.commit()


# Test Suite - Test Case Association endpoints
@router.get("/{suite_id}/tests", response_model=List[dict])
async def get_suite_test_cases(
    suite_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    # Verify suite exists
    result = await session.execute(select(TestSuite).where(TestSuite.id == suite_id))
    suite = result.scalar_one_or_none()
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    # Get associated test cases with order
    query = (
        select(TestCase, test_suite_test_cases.c.order_index)
        .join(test_suite_test_cases)
        .where(test_suite_test_cases.c.test_suite_id == suite_id)
        .order_by(test_suite_test_cases.c.order_index.asc())
    )
    
    result = await session.execute(query)
    test_cases_with_order = result.all()
    
    items = []
    for test_case, order_index in test_cases_with_order:
        item = {
            "id": test_case.id,
            "name": test_case.name,
            "status": test_case.status,
            "priority": test_case.priority,
            "order_index": order_index,
            "created_at": test_case.created_at,
        }
        items.append(item)
    
    return items


@router.post("/{suite_id}/tests/{test_id}", status_code=status.HTTP_201_CREATED)
async def add_test_to_suite(
    suite_id: UUID,
    test_id: UUID,
    order_index: Optional[int] = Query(None, description="Order index for the test in suite"),
    session: AsyncSession = Depends(get_async_session)
):
    # Verify suite exists
    result = await session.execute(select(TestSuite).where(TestSuite.id == suite_id))
    suite = result.scalar_one_or_none()
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    # Verify test case exists
    result = await session.execute(select(TestCase).where(TestCase.id == test_id))
    test_case = result.scalar_one_or_none()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    # Check if association already exists
    result = await session.execute(
        select(test_suite_test_cases).where(
            and_(
                test_suite_test_cases.c.test_suite_id == suite_id,
                test_suite_test_cases.c.test_case_id == test_id
            )
        )
    )
    existing = result.first()
    if existing:
        raise HTTPException(status_code=409, detail="Test case already in suite")
    
    # Add association
    if order_index is None:
        # Get max order index and increment
        result = await session.execute(
            select(func.max(test_suite_test_cases.c.order_index))
            .where(test_suite_test_cases.c.test_suite_id == suite_id)
        )
        max_order = result.scalar()
        order_index = (max_order or 0) + 1
    
    stmt = test_suite_test_cases.insert().values(
        test_suite_id=suite_id,
        test_case_id=test_id,
        order_index=order_index
    )
    await session.execute(stmt)
    await session.commit()
    
    return {"message": "Test case added to suite successfully"}


@router.delete("/{suite_id}/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_test_from_suite(
    suite_id: UUID,
    test_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    # Check if association exists
    result = await session.execute(
        select(test_suite_test_cases).where(
            and_(
                test_suite_test_cases.c.test_suite_id == suite_id,
                test_suite_test_cases.c.test_case_id == test_id
            )
        )
    )
    existing = result.first()
    if not existing:
        raise HTTPException(status_code=404, detail="Test case not found in suite")
    
    # Remove association
    stmt = test_suite_test_cases.delete().where(
        and_(
            test_suite_test_cases.c.test_suite_id == suite_id,
            test_suite_test_cases.c.test_case_id == test_id
        )
    )
    await session.execute(stmt)
    await session.commit()


@router.put("/{suite_id}/tests/reorder", status_code=status.HTTP_200_OK)
async def reorder_suite_tests(
    suite_id: UUID,
    test_order: List[dict],  # List of {test_id: UUID, order_index: int}
    session: AsyncSession = Depends(get_async_session)
):
    # Verify suite exists
    result = await session.execute(select(TestSuite).where(TestSuite.id == suite_id))
    suite = result.scalar_one_or_none()
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    # Update order indexes
    for item in test_order:
        test_id = item.get("test_id")
        order_index = item.get("order_index")
        
        if not test_id or order_index is None:
            continue
        
        stmt = test_suite_test_cases.update().where(
            and_(
                test_suite_test_cases.c.test_suite_id == suite_id,
                test_suite_test_cases.c.test_case_id == test_id
            )
        ).values(order_index=order_index)
        
        await session.execute(stmt)
    
    await session.commit()
    return {"message": "Test order updated successfully"}


# Bulk operations
@router.post("/{suite_id}/tests/bulk", response_model=BulkOperationResponse)
async def bulk_add_tests_to_suite(
    suite_id: UUID,
    test_ids: List[UUID],
    session: AsyncSession = Depends(get_async_session)
):
    # Verify suite exists
    result = await session.execute(select(TestSuite).where(TestSuite.id == suite_id))
    suite = result.scalar_one_or_none()
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    success_count = 0
    failure_count = 0
    errors = []
    
    # Get current max order index
    result = await session.execute(
        select(func.max(test_suite_test_cases.c.order_index))
        .where(test_suite_test_cases.c.test_suite_id == suite_id)
    )
    max_order = result.scalar() or 0
    
    for i, test_id in enumerate(test_ids):
        try:
            # Check if test case exists
            result = await session.execute(select(TestCase).where(TestCase.id == test_id))
            test_case = result.scalar_one_or_none()
            if not test_case:
                failure_count += 1
                errors.append(f"Test case {test_id} not found")
                continue
            
            # Check if already in suite
            result = await session.execute(
                select(test_suite_test_cases).where(
                    and_(
                        test_suite_test_cases.c.test_suite_id == suite_id,
                        test_suite_test_cases.c.test_case_id == test_id
                    )
                )
            )
            if result.first():
                failure_count += 1
                errors.append(f"Test case {test_id} already in suite")
                continue
            
            # Add to suite
            stmt = test_suite_test_cases.insert().values(
                test_suite_id=suite_id,
                test_case_id=test_id,
                order_index=max_order + i + 1
            )
            await session.execute(stmt)
            success_count += 1
            
        except Exception as e:
            failure_count += 1
            errors.append(f"Test case {test_id}: {str(e)}")
    
    try:
        await session.commit()
    except Exception as e:
        await session.rollback()
        return BulkOperationResponse(
            success_count=0,
            failure_count=len(test_ids),
            total_count=len(test_ids),
            errors=[f"Bulk operation failed: {str(e)}"]
        )
    
    return BulkOperationResponse(
        success_count=success_count,
        failure_count=failure_count,
        total_count=len(test_ids),
        errors=errors if errors else None
    )