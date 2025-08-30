from datetime import datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum

from sqlalchemy import String, Text, Boolean, Integer, JSON, ForeignKey, Index, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import TimestampedModel


class TestCaseStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    DRAFT = "draft"


class TestCasePriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class StepType(str, Enum):
    NAVIGATE = "navigate"
    CLICK = "click"
    TYPE = "type"
    WAIT = "wait"
    ASSERT = "assert"
    SCREENSHOT = "screenshot"
    CUSTOM = "custom"


test_suite_test_cases = Table(
    'test_suite_test_cases',
    TimestampedModel.metadata,
    Column('test_suite_id', ForeignKey('test_suites.id'), primary_key=True),
    Column('test_case_id', ForeignKey('test_cases.id'), primary_key=True),
    Column('order_index', Integer, nullable=True),
)


class TestCase(TimestampedModel):
    __tablename__ = "test_cases"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[TestCaseStatus] = mapped_column(default=TestCaseStatus.DRAFT, index=True)
    priority: Mapped[TestCasePriority] = mapped_column(default=TestCasePriority.MEDIUM, index=True)
    
    tags: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    test_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    author: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    
    expected_duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_automated: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)

    steps: Mapped[List["TestStep"]] = relationship(
        "TestStep", back_populates="test_case", cascade="all, delete-orphan",
        order_by="TestStep.order_index", lazy="selectin"
    )
    
    executions: Mapped[List["TestExecution"]] = relationship(
        "TestExecution", back_populates="test_case", cascade="all, delete-orphan"
    )
    
    test_suites: Mapped[List["TestSuite"]] = relationship(
        "TestSuite", secondary=test_suite_test_cases, back_populates="test_cases"
    )

    __table_args__ = (
        Index('ix_test_cases_status_priority', 'status', 'priority'),
        Index('ix_test_cases_category_status', 'category', 'status'),
        Index('ix_test_cases_author_status', 'author', 'status'),
    )


class TestStep(TimestampedModel):
    __tablename__ = "test_steps"

    test_case_id: Mapped[UUID] = mapped_column(ForeignKey("test_cases.id"), nullable=False, index=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    step_type: Mapped[StepType] = mapped_column(nullable=False)
    
    selector: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    input_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    configuration: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    timeout_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=30)
    
    is_optional: Mapped[bool] = mapped_column(Boolean, default=False)
    continue_on_failure: Mapped[bool] = mapped_column(Boolean, default=False)

    test_case: Mapped["TestCase"] = relationship("TestCase", back_populates="steps")
    
    step_executions: Mapped[List["TestStepExecution"]] = relationship(
        "TestStepExecution", back_populates="test_step", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index('ix_test_steps_case_order', 'test_case_id', 'order_index'),
        Index('ix_test_steps_type', 'step_type'),
    )


class TestSuite(TimestampedModel):
    __tablename__ = "test_suites"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    tags: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    configuration: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    test_cases: Mapped[List["TestCase"]] = relationship(
        "TestCase", secondary=test_suite_test_cases, back_populates="test_suites"
    )
    
    test_runs: Mapped[List["TestRun"]] = relationship(
        "TestRun", back_populates="test_suite", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index('ix_test_suites_active_name', 'is_active', 'name'),
        Index('ix_test_suites_created_by', 'created_by'),
    )