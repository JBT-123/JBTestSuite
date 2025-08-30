from datetime import datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum

from sqlalchemy import String, Text, Integer, BigInteger, JSON, ForeignKey, Index, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import TimestampedModel


class ScreenshotType(str, Enum):
    STEP_BEFORE = "step_before"
    STEP_AFTER = "step_after"
    ERROR = "error"
    ASSERTION = "assertion"
    MANUAL = "manual"
    FULL_PAGE = "full_page"
    ELEMENT = "element"


class LogLevel(str, Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class Screenshot(TimestampedModel):
    __tablename__ = "screenshots"

    test_execution_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("test_executions.id"), nullable=True, index=True
    )
    test_step_execution_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("test_step_executions.id"), nullable=True, index=True
    )
    
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    
    screenshot_type: Mapped[ScreenshotType] = mapped_column(
        default=ScreenshotType.MANUAL, index=True
    )
    
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    element_selector: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    element_position: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    browser_info: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    viewport_size: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    screenshot_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    test_execution: Mapped[Optional["TestExecution"]] = relationship(
        "TestExecution", back_populates="screenshots"
    )
    test_step_execution: Mapped[Optional["TestStepExecution"]] = relationship(
        "TestStepExecution", back_populates="screenshots"
    )

    __table_args__ = (
        Index('ix_screenshots_execution_type', 'test_execution_id', 'screenshot_type'),
        Index('ix_screenshots_step_execution_type', 'test_step_execution_id', 'screenshot_type'),
        Index('ix_screenshots_type_created', 'screenshot_type', 'created_at'),
    )


class LogEntry(TimestampedModel):
    __tablename__ = "log_entries"

    test_execution_id: Mapped[UUID] = mapped_column(
        ForeignKey("test_executions.id"), nullable=False, index=True
    )
    
    level: Mapped[LogLevel] = mapped_column(nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    step_order_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    browser_session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    stack_trace: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    context_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    timestamp: Mapped[datetime] = mapped_column(index=True)

    test_execution: Mapped["TestExecution"] = relationship(
        "TestExecution", back_populates="log_entries"
    )

    __table_args__ = (
        Index('ix_log_entries_execution_level', 'test_execution_id', 'level'),
        Index('ix_log_entries_execution_timestamp', 'test_execution_id', 'timestamp'),
        Index('ix_log_entries_level_timestamp', 'level', 'timestamp'),
        Index('ix_log_entries_source_level', 'source', 'level'),
    )


class TestReport(TimestampedModel):
    __tablename__ = "test_reports"

    test_run_id: Mapped[UUID] = mapped_column(ForeignKey("test_runs.id"), nullable=False, index=True)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    report_type: Mapped[str] = mapped_column(String(50), nullable=False, default="execution_summary")
    format_type: Mapped[str] = mapped_column(String(20), nullable=False, default="json")
    
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    
    generation_started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    generation_completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    
    summary_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    configuration: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    is_public: Mapped[bool] = mapped_column(default=False)
    generated_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    test_run: Mapped["TestRun"] = relationship("TestRun")

    __table_args__ = (
        Index('ix_test_reports_run_type', 'test_run_id', 'report_type'),
        Index('ix_test_reports_type_created', 'report_type', 'created_at'),
    )