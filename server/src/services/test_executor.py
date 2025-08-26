import asyncio
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.test_case import TestCase, TestStatus
from ..selenium import BrowserController
from ..ai import OpenAIClient
from ..api.websocket import manager


logger = logging.getLogger(__name__)


class TestExecutor:
    def __init__(self):
        self.browser = BrowserController()
        self.ai_client = OpenAIClient()
    
    async def execute_test(self, test_case_id: int, db: AsyncSession) -> None:
        """Execute a test case"""
        try:
            # Get test case from database
            result = await db.execute(
                select(TestCase).where(TestCase.id == test_case_id)
            )
            test_case = result.scalar_one_or_none()
            
            if not test_case:
                logger.error(f"Test case {test_case_id} not found")
                return
            
            # Update status to running
            test_case.status = TestStatus.RUNNING
            test_case.execution_log = "Starting test execution...\n"
            await db.commit()
            
            # Send WebSocket update
            await manager.broadcast_test_update(
                test_case_id, "running", "Starting test execution..."
            )
            
            # Start browser and navigate to URL
            await self.browser.start_browser()
            await self._log_step(test_case, db, f"Navigating to {test_case.url}")
            
            await self.browser.navigate_to_url(test_case.url)
            await self._log_step(test_case, db, "Page loaded successfully")
            
            # Wait for page to stabilize
            await asyncio.sleep(2)
            
            # Take screenshot
            screenshot_filename = f"test_{test_case_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            screenshot_path = await self.browser.take_screenshot(screenshot_filename)
            test_case.screenshot_path = screenshot_path
            await self._log_step(test_case, db, f"Screenshot saved: {screenshot_path}")
            
            # Get page title for basic validation
            page_title = await self.browser.get_page_title()
            await self._log_step(test_case, db, f"Page title: {page_title}")
            
            # Analyze screenshot with AI
            if test_case.description:
                ai_analysis = await self.ai_client.analyze_screenshot(
                    screenshot_path, test_case.description
                )
                test_case.ai_analysis = ai_analysis
                await self._log_step(test_case, db, "AI analysis completed")
            
            # Mark test as completed
            test_case.status = TestStatus.COMPLETED
            await self._log_step(test_case, db, "Test execution completed successfully")
            
            # Send WebSocket update
            await manager.broadcast_test_update(
                test_case_id, "completed", "Test execution completed successfully"
            )
            
        except Exception as e:
            logger.error(f"Test execution failed: {str(e)}")
            test_case.status = TestStatus.FAILED
            await self._log_step(test_case, db, f"Test execution failed: {str(e)}")
            
            # Send WebSocket update
            await manager.broadcast_test_update(
                test_case_id, "failed", f"Test execution failed: {str(e)}"
            )
        
        finally:
            # Clean up browser
            try:
                await self.browser.close_browser()
            except Exception as e:
                logger.error(f"Error closing browser: {str(e)}")
            
            await db.commit()
    
    async def _log_step(self, test_case: TestCase, db: AsyncSession, message: str) -> None:
        """Log a step in the test execution"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        
        if test_case.execution_log:
            test_case.execution_log += log_entry
        else:
            test_case.execution_log = log_entry
        
        await db.commit()
        logger.info(f"Test {test_case.id}: {message}")
        
        # Send real-time WebSocket update for each step
        await manager.broadcast_test_update(
            test_case.id, test_case.status.value, message
        )
    
    async def generate_ai_test_case(self, url: str, description: str) -> str:
        """Generate a test case using AI"""
        return await self.ai_client.generate_test_case(url, description)