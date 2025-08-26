from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field

from .base import BaseResponse


class ScreenshotBase(BaseModel):
    filename: str = Field(..., max_length=255, description="Screenshot filename")
    file_path: str = Field(..., max_length=500, description="File path")
    file_size_bytes: Optional[int] = Field(None, ge=0, description="File size in bytes")
    screenshot_type: str = Field("manual", description="Screenshot type")
    width: Optional[int] = Field(None, ge=0, description="Image width")
    height: Optional[int] = Field(None, ge=0, description="Image height")
    element_selector: Optional[str] = Field(None, max_length=500, description="Element selector")
    element_position: Optional[Dict[str, Any]] = Field(None, description="Element position data")
    browser_info: Optional[Dict[str, Any]] = Field(None, description="Browser information")
    viewport_size: Optional[Dict[str, Any]] = Field(None, description="Viewport size")
    description: Optional[str] = Field(None, description="Screenshot description")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class ScreenshotCreate(ScreenshotBase):
    test_execution_id: Optional[UUID] = Field(None, description="Associated test execution")
    test_step_execution_id: Optional[UUID] = Field(None, description="Associated test step execution")


class ScreenshotResponse(ScreenshotBase, BaseResponse):
    test_execution_id: Optional[UUID] = None
    test_step_execution_id: Optional[UUID] = None


class LogEntryBase(BaseModel):
    level: str = Field(..., description="Log level")
    message: str = Field(..., description="Log message")
    source: Optional[str] = Field(None, max_length=100, description="Log source")
    category: Optional[str] = Field(None, max_length=100, description="Log category")
    step_order_index: Optional[int] = Field(None, ge=0, description="Associated step order")
    browser_session_id: Optional[str] = Field(None, max_length=255, description="Browser session ID")
    stack_trace: Optional[str] = Field(None, description="Stack trace if error")
    context_data: Optional[Dict[str, Any]] = Field(None, description="Context data")
    timestamp: datetime = Field(..., description="Log timestamp")


class LogEntryCreate(LogEntryBase):
    test_execution_id: UUID = Field(..., description="Associated test execution")


class LogEntryResponse(LogEntryBase, BaseResponse):
    test_execution_id: UUID


class TestReportResponse(BaseResponse):
    test_run_id: UUID
    name: str
    description: Optional[str] = None
    report_type: str = "execution_summary"
    format_type: str = "json"
    file_path: Optional[str] = None
    file_size_bytes: Optional[int] = None
    generation_started_at: Optional[datetime] = None
    generation_completed_at: Optional[datetime] = None
    summary_data: Optional[Dict[str, Any]] = None
    configuration: Optional[Dict[str, Any]] = None
    is_public: bool = False
    generated_by: Optional[str] = None