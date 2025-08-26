from datetime import datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum

from sqlalchemy import String, Text, DateTime, Integer, JSON, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import TimestampedModel


class TestRunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class TestExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    CANCELLED = "cancelled"
    ERROR = "error"


class TestStepExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


class TestRun(TimestampedModel):
    __tablename__ = "test_runs"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    status: Mapped[TestRunStatus] = mapped_column(default=TestRunStatus.PENDING, index=True)
    
    test_suite_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("test_suites.id"), nullable=True, index=True
    )
    browser_config_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("browser_configurations.id"), nullable=True, index=True
    )
    
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    total_tests: Mapped[int] = mapped_column(Integer, default=0)
    passed_tests: Mapped[int] = mapped_column(Integer, default=0)
    failed_tests: Mapped[int] = mapped_column(Integer, default=0)
    skipped_tests: Mapped[int] = mapped_column(Integer, default=0)
    
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    
    triggered_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    environment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    
    configuration: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    run_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    test_suite: Mapped[Optional["TestSuite"]] = relationship("TestSuite", back_populates="test_runs")
    browser_config: Mapped[Optional["BrowserConfiguration"]] = relationship(
        "BrowserConfiguration", back_populates="test_runs"
    )
    
    executions: Mapped[List["TestExecution"]] = relationship(
        "TestExecution", back_populates="test_run", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index('ix_test_runs_status_created', 'status', 'created_at'),
        Index('ix_test_runs_suite_status', 'test_suite_id', 'status'),
        Index('ix_test_runs_environment_status', 'environment', 'status'),
    )


class TestExecution(TimestampedModel):
    __tablename__ = "test_executions"

    test_run_id: Mapped[UUID] = mapped_column(ForeignKey("test_runs.id"), nullable=False, index=True)
    test_case_id: Mapped[UUID] = mapped_column(ForeignKey("test_cases.id"), nullable=False, index=True)
    
    status: Mapped[TestExecutionStatus] = mapped_column(
        default=TestExecutionStatus.PENDING, index=True
    )
    
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stack_trace: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=0)
    
    browser_session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    execution_context: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    performance_metrics: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    test_run: Mapped["TestRun"] = relationship("TestRun", back_populates="executions")
    test_case: Mapped["TestCase"] = relationship("TestCase", back_populates="executions")
    
    step_executions: Mapped[List["TestStepExecution"]] = relationship(
        "TestStepExecution", back_populates="test_execution", cascade="all, delete-orphan"
    )
    
    screenshots: Mapped[List["Screenshot"]] = relationship(
        "Screenshot", back_populates="test_execution", cascade="all, delete-orphan"
    )
    
    log_entries: Mapped[List["LogEntry"]] = relationship(
        "LogEntry", back_populates="test_execution", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index('ix_test_executions_run_status', 'test_run_id', 'status'),
        Index('ix_test_executions_case_status', 'test_case_id', 'status'),
        Index('ix_test_executions_status_completed', 'status', 'completed_at'),
    )


class TestStepExecution(TimestampedModel):
    __tablename__ = "test_step_executions"

    test_execution_id: Mapped[UUID] = mapped_column(
        ForeignKey("test_executions.id"), nullable=False, index=True
    )
    test_step_id: Mapped[UUID] = mapped_column(ForeignKey("test_steps.id"), nullable=False, index=True)
    
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[TestStepExecutionStatus] = mapped_column(
        default=TestStepExecutionStatus.PENDING, index=True
    )
    
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    input_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actual_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    
    element_screenshot_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    execution_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    test_execution: Mapped["TestExecution"] = relationship(
        "TestExecution", back_populates="step_executions"
    )
    test_step: Mapped["TestStep"] = relationship("TestStep", back_populates="step_executions")
    
    screenshots: Mapped[List["Screenshot"]] = relationship(
        "Screenshot", back_populates="test_step_execution", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index('ix_test_step_executions_execution_order', 'test_execution_id', 'order_index'),
        Index('ix_test_step_executions_step_status', 'test_step_id', 'status'),
        Index('ix_test_step_executions_status_completed', 'status', 'completed_at'),
    )