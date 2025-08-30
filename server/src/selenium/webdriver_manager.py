from typing import Dict, Optional, List, Any, Tuple
import asyncio
import uuid
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.common.exceptions import (
    WebDriverException, 
    TimeoutException, 
    NoSuchElementException,
    ElementNotInteractableException
)
from selenium.webdriver.remote.webelement import WebElement
import logging
import os
from pathlib import Path
import base64

from ..core.config import settings

logger = logging.getLogger(__name__)

@dataclass
class WebDriverSession:
    session_id: str
    driver: webdriver.Chrome
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used: datetime = field(default_factory=datetime.utcnow)
    is_busy: bool = False
    current_url: Optional[str] = None
    screenshot_count: int = 0

@dataclass
class ElementInteractionResult:
    success: bool
    message: str
    element_found: bool = False
    screenshot_path: Optional[str] = None
    execution_time_ms: int = 0

@dataclass
class NavigationResult:
    success: bool
    message: str
    final_url: Optional[str] = None
    load_time_ms: int = 0
    screenshot_path: Optional[str] = None

class WebDriverManager:
    def __init__(self, 
                 max_sessions: int = 5,
                 session_timeout_minutes: int = 30,
                 selenium_hub_url: Optional[str] = None):
        self.max_sessions = max_sessions
        self.session_timeout = timedelta(minutes=session_timeout_minutes)
        self.selenium_hub_url = selenium_hub_url or settings.SELENIUM_HUB_URL
        self.sessions: Dict[str, WebDriverSession] = {}
        self.screenshots_dir = Path("artifacts/screenshots")
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)
        
    def _create_chrome_options(self) -> ChromeOptions:
        options = ChromeOptions()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-images")  # Faster loading
        options.add_argument("--disable-javascript")  # Can be enabled per test if needed
        
        # Enable logging
        options.add_argument("--enable-logging")
        options.add_argument("--log-level=0")
        
        return options
        
    async def create_session(self) -> str:
        if len(self.sessions) >= self.max_sessions:
            await self._cleanup_expired_sessions()
            if len(self.sessions) >= self.max_sessions:
                raise Exception(f"Maximum number of WebDriver sessions ({self.max_sessions}) reached")
        
        session_id = str(uuid.uuid4())
        
        try:
            options = self._create_chrome_options()
            
            if self.selenium_hub_url:
                # Connect to remote Selenium Grid
                driver = webdriver.Remote(
                    command_executor=self.selenium_hub_url,
                    options=options
                )
            else:
                # Local WebDriver (for development)
                driver = webdriver.Chrome(options=options)
            
            session = WebDriverSession(
                session_id=session_id,
                driver=driver
            )
            
            self.sessions[session_id] = session
            logger.info(f"Created WebDriver session: {session_id}")
            
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to create WebDriver session: {e}")
            raise Exception(f"Failed to create WebDriver session: {str(e)}")
    
    async def close_session(self, session_id: str) -> bool:
        if session_id not in self.sessions:
            return False
        
        try:
            session = self.sessions[session_id]
            session.driver.quit()
            del self.sessions[session_id]
            logger.info(f"Closed WebDriver session: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error closing WebDriver session {session_id}: {e}")
            # Still remove from sessions dict even if quit() failed
            if session_id in self.sessions:
                del self.sessions[session_id]
            return False
    
    async def navigate_to_url(self, session_id: str, url: str, 
                            timeout: int = 30) -> NavigationResult:
        if session_id not in self.sessions:
            return NavigationResult(
                success=False,
                message=f"Session {session_id} not found"
            )
        
        session = self.sessions[session_id]
        start_time = datetime.utcnow()
        
        try:
            session.driver.set_page_load_timeout(timeout)
            session.driver.get(url)
            
            # Wait for page to be ready
            WebDriverWait(session.driver, timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            
            end_time = datetime.utcnow()
            load_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            session.current_url = session.driver.current_url
            session.last_used = datetime.utcnow()
            
            # Take screenshot
            screenshot_path = await self._take_screenshot(session_id, "navigation")
            
            return NavigationResult(
                success=True,
                message=f"Successfully navigated to {url}",
                final_url=session.current_url,
                load_time_ms=load_time_ms,
                screenshot_path=screenshot_path
            )
            
        except TimeoutException:
            return NavigationResult(
                success=False,
                message=f"Page load timeout after {timeout} seconds"
            )
        except WebDriverException as e:
            return NavigationResult(
                success=False,
                message=f"WebDriver error during navigation: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error during navigation: {e}")
            return NavigationResult(
                success=False,
                message=f"Unexpected error: {str(e)}"
            )
    
    async def find_element_and_interact(self, session_id: str, 
                                      selector: str, 
                                      selector_type: str = "css",
                                      action: str = "click",
                                      text_input: Optional[str] = None,
                                      timeout: int = 10) -> ElementInteractionResult:
        if session_id not in self.sessions:
            return ElementInteractionResult(
                success=False,
                message=f"Session {session_id} not found"
            )
        
        session = self.sessions[session_id]
        start_time = datetime.utcnow()
        
        try:
            # Map selector types to Selenium By methods
            by_mapping = {
                "css": By.CSS_SELECTOR,
                "xpath": By.XPATH,
                "id": By.ID,
                "name": By.NAME,
                "class": By.CLASS_NAME,
                "tag": By.TAG_NAME,
                "link_text": By.LINK_TEXT,
                "partial_link_text": By.PARTIAL_LINK_TEXT
            }
            
            if selector_type not in by_mapping:
                return ElementInteractionResult(
                    success=False,
                    message=f"Invalid selector type: {selector_type}"
                )
            
            by_method = by_mapping[selector_type]
            
            # Wait for element to be present
            element = WebDriverWait(session.driver, timeout).until(
                EC.presence_of_element_located((by_method, selector))
            )
            
            # Wait for element to be interactable for certain actions
            if action in ["click", "input", "clear"]:
                element = WebDriverWait(session.driver, timeout).until(
                    EC.element_to_be_clickable((by_method, selector))
                )
            
            # Perform the action
            if action == "click":
                element.click()
                message = f"Successfully clicked element: {selector}"
                
            elif action == "input":
                if text_input is None:
                    return ElementInteractionResult(
                        success=False,
                        message="Text input is required for 'input' action"
                    )
                element.clear()
                element.send_keys(text_input)
                message = f"Successfully input text into element: {selector}"
                
            elif action == "clear":
                element.clear()
                message = f"Successfully cleared element: {selector}"
                
            elif action == "get_text":
                text = element.text
                message = f"Successfully retrieved text from element: {selector} - Text: '{text}'"
                
            elif action == "get_attribute":
                # For get_attribute, text_input should contain the attribute name
                attr_name = text_input or "value"
                attr_value = element.get_attribute(attr_name)
                message = f"Successfully retrieved attribute '{attr_name}' from element: {selector} - Value: '{attr_value}'"
                
            else:
                return ElementInteractionResult(
                    success=False,
                    message=f"Unsupported action: {action}"
                )
            
            end_time = datetime.utcnow()
            execution_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            session.last_used = datetime.utcnow()
            
            # Take screenshot after interaction
            screenshot_path = await self._take_screenshot(session_id, f"interaction_{action}")
            
            return ElementInteractionResult(
                success=True,
                message=message,
                element_found=True,
                screenshot_path=screenshot_path,
                execution_time_ms=execution_time_ms
            )
            
        except TimeoutException:
            screenshot_path = await self._take_screenshot(session_id, "timeout_error")
            return ElementInteractionResult(
                success=False,
                message=f"Element not found or not interactable within {timeout} seconds: {selector}",
                element_found=False,
                screenshot_path=screenshot_path
            )
        except ElementNotInteractableException:
            screenshot_path = await self._take_screenshot(session_id, "not_interactable_error")
            return ElementInteractionResult(
                success=False,
                message=f"Element found but not interactable: {selector}",
                element_found=True,
                screenshot_path=screenshot_path
            )
        except Exception as e:
            screenshot_path = await self._take_screenshot(session_id, "interaction_error")
            logger.error(f"Error during element interaction: {e}")
            return ElementInteractionResult(
                success=False,
                message=f"Error during element interaction: {str(e)}",
                screenshot_path=screenshot_path
            )
    
    async def _take_screenshot(self, session_id: str, context: str = "general") -> Optional[str]:
        try:
            if session_id not in self.sessions:
                return None
            
            session = self.sessions[session_id]
            session.screenshot_count += 1
            
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            filename = f"screenshot_{session_id}_{session.screenshot_count:03d}_{context}_{timestamp}.png"
            filepath = self.screenshots_dir / filename
            
            session.driver.save_screenshot(str(filepath))
            
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Failed to take screenshot for session {session_id}: {e}")
            return None
    
    async def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        
        return {
            "session_id": session_id,
            "created_at": session.created_at.isoformat(),
            "last_used": session.last_used.isoformat(),
            "is_busy": session.is_busy,
            "current_url": session.current_url,
            "screenshot_count": session.screenshot_count
        }
    
    async def list_sessions(self) -> List[Dict[str, Any]]:
        return [
            await self.get_session_info(session_id) 
            for session_id in self.sessions.keys()
        ]
    
    async def _cleanup_expired_sessions(self):
        current_time = datetime.utcnow()
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            if current_time - session.last_used > self.session_timeout:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            await self.close_session(session_id)
            logger.info(f"Cleaned up expired session: {session_id}")
    
    async def health_check(self) -> Dict[str, Any]:
        await self._cleanup_expired_sessions()
        
        return {
            "active_sessions": len(self.sessions),
            "max_sessions": self.max_sessions,
            "selenium_hub_url": self.selenium_hub_url,
            "screenshots_directory": str(self.screenshots_dir),
            "session_timeout_minutes": self.session_timeout.total_seconds() / 60
        }
    
    async def shutdown(self):
        logger.info("Shutting down WebDriver Manager...")
        for session_id in list(self.sessions.keys()):
            await self.close_session(session_id)
        logger.info("All WebDriver sessions closed")

# Global WebDriver manager instance
webdriver_manager = WebDriverManager()