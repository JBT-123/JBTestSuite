from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from ..models.test_case import TestStatus


class TestCaseBase(BaseModel):
    name: str
    description: Optional[str] = None
    url: str


class TestCaseCreate(TestCaseBase):
    pass


class TestCaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    status: Optional[TestStatus] = None
    execution_log: Optional[str] = None
    screenshot_path: Optional[str] = None
    ai_analysis: Optional[str] = None


class TestCaseResponse(TestCaseBase):
    id: int
    status: TestStatus
    created_at: datetime
    updated_at: datetime
    execution_log: Optional[str] = None
    screenshot_path: Optional[str] = None
    ai_analysis: Optional[str] = None

    class Config:
        from_attributes = True