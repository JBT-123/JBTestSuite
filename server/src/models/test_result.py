from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import String, Text, DateTime, ForeignKey, func, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class TestResult(Base):
    __tablename__ = "test_results"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    test_case_id: Mapped[UUID] = mapped_column(ForeignKey("test_cases.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    screenshots: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    test_case: Mapped["TestCase"] = relationship("TestCase", back_populates="results")