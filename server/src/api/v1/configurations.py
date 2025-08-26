from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc

from src.core.database import get_async_session
from src.models.configuration import BrowserConfiguration, TestEnvironment
from src.api.schemas import (
    BrowserConfigurationCreate,
    BrowserConfigurationUpdate,
    BrowserConfigurationResponse,
    TestEnvironmentCreate,
    TestEnvironmentUpdate,
    TestEnvironmentResponse,
    PaginatedResponse,
    FilterParams,
    PaginationParams,
    SortParams,
)

router = APIRouter(prefix="/configurations", tags=["configurations"])


# Browser Configuration endpoints
@router.get("/browsers", response_model=PaginatedResponse[BrowserConfigurationResponse])
async def get_browser_configurations(
    browser_type: Optional[str] = Query(None, description="Filter by browser type"),
    active_only: bool = Query(True, description="Only return active configurations"),
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(BrowserConfiguration)
    
    # Apply filters
    if browser_type:
        query = query.where(BrowserConfiguration.browser_type == browser_type)
    if active_only:
        query = query.where(BrowserConfiguration.is_active == True)
    
    # Apply sorting
    sort_field = getattr(BrowserConfiguration, sort.sort_by, BrowserConfiguration.created_at)
    if sort.order == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Count total items
    count_query = select(func.count()).select_from(BrowserConfiguration)
    if browser_type:
        count_query = count_query.where(BrowserConfiguration.browser_type == browser_type)
    if active_only:
        count_query = count_query.where(BrowserConfiguration.is_active == True)
    
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.limit
    query = query.offset(offset).limit(pagination.limit)
    
    result = await session.execute(query)
    configs = result.scalars().all()
    
    # Transform to response format with usage count
    items = []
    for config in configs:
        config_data = {
            **config.__dict__,
            "usage_count": 0,  # TODO: Add usage count query from test runs
        }
        items.append(BrowserConfigurationResponse(**config_data))
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages
    )


@router.post("/browsers", response_model=BrowserConfigurationResponse, status_code=status.HTTP_201_CREATED)
async def create_browser_configuration(
    config_data: BrowserConfigurationCreate,
    session: AsyncSession = Depends(get_async_session)
):
    # If this is being set as default, unset other defaults
    if config_data.is_default:
        result = await session.execute(
            select(BrowserConfiguration).where(BrowserConfiguration.is_default == True)
        )
        existing_defaults = result.scalars().all()
        for existing in existing_defaults:
            existing.is_default = False
    
    config = BrowserConfiguration(**config_data.model_dump())
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config


@router.get("/browsers/{config_id}", response_model=BrowserConfigurationResponse)
async def get_browser_configuration(
    config_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(BrowserConfiguration).where(BrowserConfiguration.id == config_id))
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Browser configuration not found")
    
    return config


@router.put("/browsers/{config_id}", response_model=BrowserConfigurationResponse)
async def update_browser_configuration(
    config_id: UUID,
    config_data: BrowserConfigurationUpdate,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(BrowserConfiguration).where(BrowserConfiguration.id == config_id))
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Browser configuration not found")
    
    # If setting as default, unset other defaults
    if config_data.is_default:
        result = await session.execute(
            select(BrowserConfiguration).where(
                and_(
                    BrowserConfiguration.is_default == True,
                    BrowserConfiguration.id != config_id
                )
            )
        )
        existing_defaults = result.scalars().all()
        for existing in existing_defaults:
            existing.is_default = False
    
    update_data = config_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    await session.commit()
    await session.refresh(config)
    return config


@router.delete("/browsers/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_browser_configuration(
    config_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(BrowserConfiguration).where(BrowserConfiguration.id == config_id))
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Browser configuration not found")
    
    # Check if it's the default - prevent deletion
    if config.is_default:
        raise HTTPException(status_code=409, detail="Cannot delete default browser configuration")
    
    await session.delete(config)
    await session.commit()


@router.get("/browsers/default", response_model=BrowserConfigurationResponse)
async def get_default_browser_configuration(
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(
        select(BrowserConfiguration).where(BrowserConfiguration.is_default == True)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        # If no default is set, return the first active one
        result = await session.execute(
            select(BrowserConfiguration)
            .where(BrowserConfiguration.is_active == True)
            .order_by(BrowserConfiguration.created_at)
            .limit(1)
        )
        config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="No browser configuration available")
    
    return config


# Test Environment endpoints
@router.get("/environments", response_model=PaginatedResponse[TestEnvironmentResponse])
async def get_test_environments(
    environment_type: Optional[str] = Query(None, description="Filter by environment type"),
    active_only: bool = Query(True, description="Only return active environments"),
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(TestEnvironment)
    
    # Apply filters
    if environment_type:
        query = query.where(TestEnvironment.environment_type == environment_type)
    if active_only:
        query = query.where(TestEnvironment.is_active == True)
    
    # Apply sorting
    sort_field = getattr(TestEnvironment, sort.sort_by, TestEnvironment.created_at)
    if sort.order == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Count total items
    count_query = select(func.count()).select_from(TestEnvironment)
    if environment_type:
        count_query = count_query.where(TestEnvironment.environment_type == environment_type)
    if active_only:
        count_query = count_query.where(TestEnvironment.is_active == True)
    
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.limit
    query = query.offset(offset).limit(pagination.limit)
    
    result = await session.execute(query)
    environments = result.scalars().all()
    
    # Transform to response format with usage count
    items = []
    for env in environments:
        env_data = {
            **env.__dict__,
            "usage_count": 0,  # TODO: Add usage count query from test runs
        }
        items.append(TestEnvironmentResponse(**env_data))
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages
    )


@router.post("/environments", response_model=TestEnvironmentResponse, status_code=status.HTTP_201_CREATED)
async def create_test_environment(
    env_data: TestEnvironmentCreate,
    session: AsyncSession = Depends(get_async_session)
):
    # Check if name already exists
    result = await session.execute(select(TestEnvironment).where(TestEnvironment.name == env_data.name))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Environment name already exists")
    
    environment = TestEnvironment(**env_data.model_dump())
    session.add(environment)
    await session.commit()
    await session.refresh(environment)
    return environment


@router.get("/environments/{env_id}", response_model=TestEnvironmentResponse)
async def get_test_environment(
    env_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestEnvironment).where(TestEnvironment.id == env_id))
    environment = result.scalar_one_or_none()
    
    if not environment:
        raise HTTPException(status_code=404, detail="Test environment not found")
    
    return environment


@router.put("/environments/{env_id}", response_model=TestEnvironmentResponse)
async def update_test_environment(
    env_id: UUID,
    env_data: TestEnvironmentUpdate,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestEnvironment).where(TestEnvironment.id == env_id))
    environment = result.scalar_one_or_none()
    
    if not environment:
        raise HTTPException(status_code=404, detail="Test environment not found")
    
    # Check name uniqueness if being updated
    if env_data.name and env_data.name != environment.name:
        result = await session.execute(select(TestEnvironment).where(TestEnvironment.name == env_data.name))
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Environment name already exists")
    
    update_data = env_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(environment, field, value)
    
    await session.commit()
    await session.refresh(environment)
    return environment


@router.delete("/environments/{env_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_environment(
    env_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestEnvironment).where(TestEnvironment.id == env_id))
    environment = result.scalar_one_or_none()
    
    if not environment:
        raise HTTPException(status_code=404, detail="Test environment not found")
    
    await session.delete(environment)
    await session.commit()


@router.get("/environments/by-name/{env_name}", response_model=TestEnvironmentResponse)
async def get_environment_by_name(
    env_name: str,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestEnvironment).where(TestEnvironment.name == env_name))
    environment = result.scalar_one_or_none()
    
    if not environment:
        raise HTTPException(status_code=404, detail="Test environment not found")
    
    return environment


# Health check endpoints for environments
@router.post("/environments/{env_id}/health-check")
async def check_environment_health(
    env_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestEnvironment).where(TestEnvironment.id == env_id))
    environment = result.scalar_one_or_none()
    
    if not environment:
        raise HTTPException(status_code=404, detail="Test environment not found")
    
    # TODO: Implement actual health check logic
    # This could ping the base_url and health_check_url
    
    return {
        "environment_id": env_id,
        "name": environment.name,
        "base_url": environment.base_url,
        "health_check_url": environment.health_check_url,
        "status": "healthy",  # TODO: Implement actual health check
        "response_time_ms": 0,  # TODO: Implement actual health check
        "last_checked": "2025-08-26T13:15:00Z"  # TODO: Use actual timestamp
    }


# Configuration validation endpoints
@router.post("/browsers/validate")
async def validate_browser_configuration(
    config_data: BrowserConfigurationCreate
):
    # TODO: Implement browser configuration validation
    # This could test if the browser type is supported, validate capabilities, etc.
    
    validation_results = {
        "is_valid": True,
        "errors": [],
        "warnings": [],
        "suggestions": []
    }
    
    # Basic validation
    if config_data.window_width < 100 or config_data.window_width > 4000:
        validation_results["errors"].append("Window width must be between 100 and 4000 pixels")
        validation_results["is_valid"] = False
    
    if config_data.window_height < 100 or config_data.window_height > 4000:
        validation_results["errors"].append("Window height must be between 100 and 4000 pixels")
        validation_results["is_valid"] = False
    
    if config_data.browser_type not in ["chrome", "firefox", "safari", "edge", "chromium"]:
        validation_results["warnings"].append(f"Browser type '{config_data.browser_type}' may not be supported")
    
    return validation_results