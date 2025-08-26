from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field

from .base import BaseResponse


class TestCaseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    status: Optional[str] = Field("draft", description="Test case status")
    priority: Optional[str] = Field("medium", description="Test case priority") 
    tags: Optional[List[str]] = Field(None, description="Test case tags")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    author: Optional[str] = Field(None, max_length=100, description="Test case author")
    category: Optional[str] = Field(None, max_length=100, description="Test case category")
    expected_duration_seconds: Optional[int] = Field(None, ge=0, description="Expected duration in seconds")
    is_automated: bool = Field(True, description="Whether test is automated")
    retry_count: int = Field(0, ge=0, description="Number of retries allowed")


class TestCaseCreate(TestCaseBase):
    pass


class TestCaseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    author: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=100)
    expected_duration_seconds: Optional[int] = Field(None, ge=0)
    is_automated: Optional[bool] = None
    retry_count: Optional[int] = Field(None, ge=0)


class TestStepBase(BaseModel):
    order_index: int = Field(..., ge=0, description="Order index of the step")
    name: str = Field(..., min_length=1, max_length=255, description="Step name")
    description: Optional[str] = Field(None, description="Step description")
    step_type: str = Field(..., description="Type of step (navigate, click, type, etc.)")
    selector: Optional[str] = Field(None, max_length=500, description="Element selector")
    input_data: Optional[str] = Field(None, description="Input data for the step")
    expected_result: Optional[str] = Field(None, description="Expected result")
    configuration: Optional[Dict[str, Any]] = Field(None, description="Step configuration")
    timeout_seconds: Optional[int] = Field(30, ge=0, description="Step timeout in seconds")
    is_optional: bool = Field(False, description="Whether step is optional")
    continue_on_failure: bool = Field(False, description="Continue execution if step fails")


class TestStepCreate(TestStepBase):
    pass


class TestStepUpdate(BaseModel):
    order_index: Optional[int] = Field(None, ge=0)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    step_type: Optional[str] = None
    selector: Optional[str] = Field(None, max_length=500)
    input_data: Optional[str] = None
    expected_result: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    timeout_seconds: Optional[int] = Field(None, ge=0)
    is_optional: Optional[bool] = None
    continue_on_failure: Optional[bool] = None


class TestStepResponse(TestStepBase, BaseResponse):
    test_case_id: UUID


class TestCaseResponse(TestCaseBase, BaseResponse):
    steps: Optional[List[TestStepResponse]] = None


class TestCaseListResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    status: str
    priority: str
    tags: Optional[List[str]] = None
    author: Optional[str] = None
    category: Optional[str] = None
    is_automated: bool
    step_count: Optional[int] = None
    execution_count: Optional[int] = None
    last_execution_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestSuiteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Test suite name")
    description: Optional[str] = Field(None, description="Test suite description")
    tags: Optional[List[str]] = Field(None, description="Test suite tags")
    configuration: Optional[Dict[str, Any]] = Field(None, description="Suite configuration")
    is_active: bool = Field(True, description="Whether suite is active")
    created_by: Optional[str] = Field(None, max_length=100, description="Suite creator")


class TestSuiteCreate(TestSuiteBase):
    test_case_ids: Optional[List[UUID]] = Field(None, description="Test case IDs to include")


class TestSuiteUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    configuration: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    created_by: Optional[str] = Field(None, max_length=100)


class TestSuiteResponse(TestSuiteBase, BaseResponse):
    test_case_count: Optional[int] = None
    last_run_status: Optional[str] = None
    last_run_date: Optional[datetime] = None


class TestSuiteWithTestsResponse(TestSuiteResponse):
    test_cases: List[TestCaseListResponse] = []