from typing import Optional, List
from enum import Enum

from sqlalchemy import String, Text, Boolean, Integer, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import TimestampedModel


class BrowserType(str, Enum):
    CHROME = "chrome"
    FIREFOX = "firefox"
    SAFARI = "safari"
    EDGE = "edge"
    CHROMIUM = "chromium"


class BrowserConfiguration(TimestampedModel):
    __tablename__ = "browser_configurations"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    browser_type: Mapped[BrowserType] = mapped_column(nullable=False, index=True)
    browser_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    headless: Mapped[bool] = mapped_column(Boolean, default=True)
    window_width: Mapped[int] = mapped_column(Integer, default=1920)
    window_height: Mapped[int] = mapped_column(Integer, default=1080)
    
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    enable_screenshots: Mapped[bool] = mapped_column(Boolean, default=True)
    screenshot_on_failure: Mapped[bool] = mapped_column(Boolean, default=True)
    
    page_load_timeout_seconds: Mapped[int] = mapped_column(Integer, default=30)
    implicit_wait_seconds: Mapped[int] = mapped_column(Integer, default=10)
    script_timeout_seconds: Mapped[int] = mapped_column(Integer, default=30)
    
    proxy_settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    browser_options: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    capabilities: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    
    created_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    test_runs: Mapped[List["TestRun"]] = relationship(
        "TestRun", back_populates="browser_config"
    )

    __table_args__ = (
        Index('ix_browser_configs_type_active', 'browser_type', 'is_active'),
        Index('ix_browser_configs_default_active', 'is_default', 'is_active'),
    )


class TestEnvironment(TimestampedModel):
    __tablename__ = "test_environments"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    
    environment_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="development", index=True
    )
    
    database_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    api_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    authentication_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    requires_vpn: Mapped[bool] = mapped_column(Boolean, default=False)
    
    health_check_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    variables: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    secrets: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    created_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    __table_args__ = (
        Index('ix_test_environments_type_active', 'environment_type', 'is_active'),
    )