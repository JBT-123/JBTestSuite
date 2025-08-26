import os
import asyncio
from typing import Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, WebDriverException
from ..core.config import settings


class BrowserController:
    def __init__(self):
        self.driver: Optional[webdriver.Remote] = None
        self.wait: Optional[WebDriverWait] = None
    
    async def start_browser(self) -> None:
        """Start a new browser session"""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            loop = asyncio.get_event_loop()
            self.driver = await loop.run_in_executor(
                None,
                lambda: webdriver.Remote(
                    command_executor=settings.selenium_hub_url,
                    options=chrome_options
                )
            )
            self.wait = WebDriverWait(self.driver, 10)
        except WebDriverException as e:
            raise Exception(f"Failed to start browser: {str(e)}")
    
    async def navigate_to_url(self, url: str) -> None:
        """Navigate to a specific URL"""
        if not self.driver:
            await self.start_browser()
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self.driver.get, url)
    
    async def take_screenshot(self, filename: str) -> str:
        """Take a screenshot and save it to artifacts"""
        if not self.driver:
            raise Exception("Browser not started")
        
        # Create artifacts directory if it doesn't exist
        artifacts_dir = "/app/artifacts"
        os.makedirs(artifacts_dir, exist_ok=True)
        
        filepath = os.path.join(artifacts_dir, f"{filename}.png")
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self.driver.save_screenshot, filepath)
        
        return filepath
    
    async def find_element(self, by: By, value: str, timeout: int = 10):
        """Find an element on the page"""
        if not self.driver or not self.wait:
            raise Exception("Browser not started")
        
        try:
            loop = asyncio.get_event_loop()
            element = await loop.run_in_executor(
                None,
                lambda: self.wait.until(EC.presence_of_element_located((by, value)))
            )
            return element
        except TimeoutException:
            raise Exception(f"Element not found: {by}={value}")
    
    async def click_element(self, by: By, value: str) -> None:
        """Click an element"""
        element = await self.find_element(by, value)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, element.click)
    
    async def type_text(self, by: By, value: str, text: str) -> None:
        """Type text into an input field"""
        element = await self.find_element(by, value)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, element.clear)
        await loop.run_in_executor(None, element.send_keys, text)
    
    async def get_page_title(self) -> str:
        """Get the current page title"""
        if not self.driver:
            raise Exception("Browser not started")
        
        loop = asyncio.get_event_loop()
        title = await loop.run_in_executor(None, lambda: self.driver.title)
        return title
    
    async def close_browser(self) -> None:
        """Close the browser session"""
        if self.driver:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self.driver.quit)
            self.driver = None
            self.wait = None