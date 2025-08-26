from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    results: Mapped[list["TestResult"]] = relationship(
        "TestResult", back_populates="test_case", cascade="all, delete-orphan"
    )