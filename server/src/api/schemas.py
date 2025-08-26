from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class TestCaseBase(BaseModel):
    name: str
    description: Optional[str] = None


class TestCaseCreate(TestCaseBase):
    pass


class TestCaseResponse(TestCaseBase):
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestResultResponse(BaseModel):
    id: UUID
    test_case_id: UUID
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    screenshots: Optional[list[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True