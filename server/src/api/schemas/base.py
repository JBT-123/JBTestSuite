from datetime import datetime
from typing import Optional, Generic, TypeVar, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field

T = TypeVar('T')


class BaseResponse(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int


class BulkOperationResponse(BaseModel):
    success_count: int
    failure_count: int
    total_count: int
    errors: Optional[List[str]] = None


class FilterParams(BaseModel):
    status: Optional[str] = None
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    category: Optional[str] = None
    author: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(50, ge=1, le=1000, description="Items per page")


class SortParams(BaseModel):
    sort_by: str = Field("created_at", description="Field to sort by")
    order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order")