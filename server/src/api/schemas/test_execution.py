from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field

from .base import BaseResponse


class TestRunBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Test run name")
    description: Optional[str] = Field(None, description="Test run description")
    test_suite_id: Optional[UUID] = Field(None, description="Associated test suite ID")
    browser_config_id: Optional[UUID] = Field(None, description="Browser configuration ID")
    environment: Optional[str] = Field(None, max_length=100, description="Test environment")
    triggered_by: Optional[str] = Field(None, max_length=100, description="Who triggered the run")
    configuration: Optional[Dict[str, Any]] = Field(None, description="Run configuration")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class TestRunCreate(TestRunBase):
    test_case_ids: Optional[List[UUID]] = Field(None, description="Specific test cases to run")


class TestRunUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class TestExecutionBase(BaseModel):
    status: str = Field("pending", description="Execution status")
    started_at: Optional[datetime] = Field(None, description="Execution start time")
    completed_at: Optional[datetime] = Field(None, description="Execution end time")
    duration_seconds: Optional[float] = Field(None, ge=0, description="Execution duration")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    error_type: Optional[str] = Field(None, max_length=100, description="Error type")
    stack_trace: Optional[str] = Field(None, description="Stack trace if error occurred")
    retry_count: int = Field(0, ge=0, description="Current retry count")
    max_retries: int = Field(0, ge=0, description="Maximum retries allowed")
    browser_session_id: Optional[str] = Field(None, max_length=255, description="Browser session ID")
    execution_context: Optional[Dict[str, Any]] = Field(None, description="Execution context")
    performance_metrics: Optional[Dict[str, Any]] = Field(None, description="Performance metrics")


class TestRunResponse(TestRunBase, BaseResponse):
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_tests: int = 0
    passed_tests: int = 0 
    failed_tests: int = 0
    skipped_tests: int = 0
    progress_percentage: float = 0.0


class TestRunWithExecutionsResponse(TestRunResponse):
    executions: List["TestExecutionResponse"] = []


class TestExecutionResponse(TestExecutionBase, BaseResponse):
    test_run_id: UUID
    test_case_id: UUID
    test_case_name: Optional[str] = None
    screenshot_count: Optional[int] = None
    log_entry_count: Optional[int] = None


class TestExecutionDetailResponse(TestExecutionResponse):
    step_executions: List["TestStepExecutionResponse"] = []
    screenshots: List["ScreenshotResponse"] = []
    log_entries: List["LogEntryResponse"] = []


class TestStepExecutionResponse(BaseResponse):
    test_execution_id: UUID
    test_step_id: UUID
    order_index: int
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    input_data: Optional[str] = None
    actual_result: Optional[str] = None
    expected_result: Optional[str] = None
    error_message: Optional[str] = None
    error_type: Optional[str] = None
    retry_count: int = 0
    element_screenshot_path: Optional[str] = None
    execution_data: Optional[Dict[str, Any]] = None


# TestRunWithExecutionsResponse.model_rebuild()
# TestExecutionDetailResponse.model_rebuild()