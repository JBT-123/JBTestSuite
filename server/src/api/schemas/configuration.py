from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from .base import BaseResponse


class BrowserConfigurationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Configuration name")
    description: Optional[str] = Field(None, description="Configuration description")
    browser_type: str = Field(..., description="Browser type (chrome, firefox, etc.)")
    browser_version: Optional[str] = Field(None, max_length=50, description="Browser version")
    headless: bool = Field(True, description="Run in headless mode")
    window_width: int = Field(1920, ge=100, le=4000, description="Browser window width")
    window_height: int = Field(1080, ge=100, le=4000, description="Browser window height")
    user_agent: Optional[str] = Field(None, description="Custom user agent")
    enable_screenshots: bool = Field(True, description="Enable screenshot capture")
    screenshot_on_failure: bool = Field(True, description="Take screenshot on failure")
    page_load_timeout_seconds: int = Field(30, ge=1, le=300, description="Page load timeout")
    implicit_wait_seconds: int = Field(10, ge=0, le=60, description="Implicit wait timeout")
    script_timeout_seconds: int = Field(30, ge=1, le=300, description="Script execution timeout")
    proxy_settings: Optional[Dict[str, Any]] = Field(None, description="Proxy configuration")
    browser_options: Optional[Dict[str, Any]] = Field(None, description="Browser-specific options")
    capabilities: Optional[Dict[str, Any]] = Field(None, description="WebDriver capabilities")
    is_default: bool = Field(False, description="Is default configuration")
    is_active: bool = Field(True, description="Is configuration active")
    created_by: Optional[str] = Field(None, max_length=100, description="Creator")


class BrowserConfigurationCreate(BrowserConfigurationBase):
    pass


class BrowserConfigurationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    browser_type: Optional[str] = None
    browser_version: Optional[str] = Field(None, max_length=50)
    headless: Optional[bool] = None
    window_width: Optional[int] = Field(None, ge=100, le=4000)
    window_height: Optional[int] = Field(None, ge=100, le=4000)
    user_agent: Optional[str] = None
    enable_screenshots: Optional[bool] = None
    screenshot_on_failure: Optional[bool] = None
    page_load_timeout_seconds: Optional[int] = Field(None, ge=1, le=300)
    implicit_wait_seconds: Optional[int] = Field(None, ge=0, le=60)
    script_timeout_seconds: Optional[int] = Field(None, ge=1, le=300)
    proxy_settings: Optional[Dict[str, Any]] = None
    browser_options: Optional[Dict[str, Any]] = None
    capabilities: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    created_by: Optional[str] = Field(None, max_length=100)


class BrowserConfigurationResponse(BrowserConfigurationBase, BaseResponse):
    usage_count: Optional[int] = None


class TestEnvironmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Environment name")
    description: Optional[str] = Field(None, description="Environment description")
    base_url: str = Field(..., description="Base URL for testing")
    environment_type: str = Field("development", description="Environment type")
    database_config: Optional[Dict[str, Any]] = Field(None, description="Database configuration")
    api_config: Optional[Dict[str, Any]] = Field(None, description="API configuration")
    authentication_config: Optional[Dict[str, Any]] = Field(None, description="Auth configuration")
    is_active: bool = Field(True, description="Is environment active")
    requires_vpn: bool = Field(False, description="Requires VPN access")
    health_check_url: Optional[str] = Field(None, max_length=500, description="Health check URL")
    variables: Optional[Dict[str, Any]] = Field(None, description="Environment variables")
    secrets: Optional[Dict[str, Any]] = Field(None, description="Environment secrets")
    created_by: Optional[str] = Field(None, max_length=100, description="Creator")


class TestEnvironmentCreate(TestEnvironmentBase):
    pass


class TestEnvironmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    base_url: Optional[str] = None
    environment_type: Optional[str] = None
    database_config: Optional[Dict[str, Any]] = None
    api_config: Optional[Dict[str, Any]] = None
    authentication_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    requires_vpn: Optional[bool] = None
    health_check_url: Optional[str] = Field(None, max_length=500)
    variables: Optional[Dict[str, Any]] = None
    secrets: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = Field(None, max_length=100)


class TestEnvironmentResponse(TestEnvironmentBase, BaseResponse):
    usage_count: Optional[int] = None