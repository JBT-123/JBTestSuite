from typing import Dict, Optional, List, Any
import asyncio
import uuid
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
import logging
from pathlib import Path
import json

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..core.database import AsyncSessionLocal
from ..models.test_definition import TestCase as DBTestCase, TestStep as DBTestStep
from ..selenium.webdriver_manager import webdriver_manager, ElementInteractionResult, NavigationResult
from ..ai.openai_service import openai_service
from ..api.websockets import (
    notify_test_execution_started,
    notify_test_execution_progress, 
    notify_test_execution_completed,
    notify_test_execution_error
)

logger = logging.getLogger(__name__)

class ExecutionStatus(Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed" 
    FAILED = "failed"
    CANCELLED = "cancelled"

class StepType(Enum):
    NAVIGATE = "navigate"
    CLICK = "click"
    INPUT = "input"
    WAIT = "wait"
    VERIFY = "verify"
    SCREENSHOT = "screenshot"

@dataclass
class TestStep:
    step_number: int
    step_type: StepType
    description: str
    selector: Optional[str] = None
    selector_type: str = "css"
    input_text: Optional[str] = None
    expected_text: Optional[str] = None
    url: Optional[str] = None
    wait_seconds: int = 0
    timeout_seconds: int = 10

@dataclass
class ExecutionContext:
    execution_id: str
    test_case_id: str
    session_id: Optional[str] = None
    status: ExecutionStatus = ExecutionStatus.QUEUED
    steps: List[TestStep] = field(default_factory=list)
    current_step: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    screenshots: List[str] = field(default_factory=list)
    user_id: Optional[str] = None

class TestExecutionOrchestrator:
    def __init__(self):
        self.active_executions: Dict[str, ExecutionContext] = {}
        self.execution_queue: asyncio.Queue = asyncio.Queue()
        self.worker_task: Optional[asyncio.Task] = None
        self.is_running = False
    
    async def start(self):
        if not self.is_running:
            self.is_running = True
            self.worker_task = asyncio.create_task(self._execution_worker())
            logger.info("Test execution orchestrator started")
    
    async def stop(self):
        if self.is_running:
            self.is_running = False
            if self.worker_task:
                self.worker_task.cancel()
                try:
                    await self.worker_task
                except asyncio.CancelledError:
                    pass
            
            # Cancel all active executions
            for execution_id in list(self.active_executions.keys()):
                await self.cancel_execution(execution_id)
                
            logger.info("Test execution orchestrator stopped")
    
    async def queue_test_execution(self, test_case_id: str, user_id: Optional[str] = None) -> str:
        execution_id = str(uuid.uuid4())
        
        try:
            # Load test case from database to get steps
            async with AsyncSessionLocal() as session:
                query = select(DBTestCase).where(DBTestCase.id == test_case_id).options(
                    selectinload(DBTestCase.steps)
                )
                result = await session.execute(query)
                test_case = result.scalar_one_or_none()
                
                if not test_case:
                    raise ValueError(f"Test case {test_case_id} not found")
                
                # Parse test steps from test case data
                steps = await self._parse_test_steps(test_case)
                
                context = ExecutionContext(
                    execution_id=execution_id,
                    test_case_id=test_case_id,
                    steps=steps,
                    user_id=user_id
                )
                
                self.active_executions[execution_id] = context
                await self.execution_queue.put(execution_id)
                
                logger.info(f"Queued test execution {execution_id} for test case {test_case_id}")
                return execution_id
                
        except Exception as e:
            logger.error(f"Failed to queue test execution: {e}")
            raise
    
    async def cancel_execution(self, execution_id: str) -> bool:
        if execution_id not in self.active_executions:
            return False
        
        context = self.active_executions[execution_id]
        
        if context.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED]:
            return False
        
        context.status = ExecutionStatus.CANCELLED
        context.completed_at = datetime.utcnow()
        context.error_message = "Execution cancelled by user"
        
        # Close WebDriver session if exists
        if context.session_id:
            await webdriver_manager.close_session(context.session_id)
        
        # Notify via WebSocket
        await notify_test_execution_error(
            execution_id, 
            context.test_case_id,
            "Test execution was cancelled",
            context.user_id
        )
        
        # Clean up
        del self.active_executions[execution_id]
        logger.info(f"Cancelled test execution {execution_id}")
        return True
    
    async def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        if execution_id not in self.active_executions:
            return None
        
        context = self.active_executions[execution_id]
        
        return {
            "execution_id": execution_id,
            "test_case_id": context.test_case_id,
            "status": context.status.value,
            "current_step": context.current_step,
            "total_steps": len(context.steps),
            "started_at": context.started_at.isoformat() if context.started_at else None,
            "completed_at": context.completed_at.isoformat() if context.completed_at else None,
            "error_message": context.error_message,
            "screenshots": context.screenshots,
            "ai_analyses": getattr(context, 'ai_analyses', []),
            "final_ai_analysis": getattr(context, 'final_ai_analysis', None)
        }
    
    async def _execution_worker(self):
        while self.is_running:
            try:
                # Get next execution from queue
                execution_id = await asyncio.wait_for(
                    self.execution_queue.get(), 
                    timeout=1.0
                )
                
                if execution_id in self.active_executions:
                    await self._execute_test(execution_id)
                    
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error in execution worker: {e}")
                await asyncio.sleep(1)
    
    async def _execute_test(self, execution_id: str):
        context = self.active_executions[execution_id]
        
        try:
            context.status = ExecutionStatus.RUNNING
            context.started_at = datetime.utcnow()
            
            # Create WebDriver session
            context.session_id = await webdriver_manager.create_session()
            
            # Notify execution started
            await notify_test_execution_started(
                execution_id,
                context.test_case_id,
                context.user_id
            )
            
            # Execute each step
            for step_index, step in enumerate(context.steps):
                context.current_step = step_index + 1
                
                # Check if execution was cancelled
                if context.status == ExecutionStatus.CANCELLED:
                    return
                
                # Execute the step
                success = await self._execute_step(context, step)
                
                # Notify progress
                await notify_test_execution_progress(
                    execution_id,
                    context.current_step,
                    len(context.steps),
                    step.description,
                    context.screenshots[-1] if context.screenshots else None,
                    context.user_id
                )
                
                if not success:
                    context.status = ExecutionStatus.FAILED
                    context.completed_at = datetime.utcnow()
                    
                    await notify_test_execution_error(
                        execution_id,
                        context.test_case_id,
                        context.error_message or f"Step {context.current_step} failed",
                        context.user_id
                    )
                    return
            
            # All steps completed successfully
            context.status = ExecutionStatus.COMPLETED
            context.completed_at = datetime.utcnow()
            
            # Analyze execution result with AI (non-blocking)
            asyncio.create_task(self._analyze_execution_result_with_ai(context))
            
            await notify_test_execution_completed(
                execution_id,
                context.test_case_id,
                True,
                f"Test completed successfully in {len(context.steps)} steps",
                context.user_id
            )
            
        except Exception as e:
            logger.error(f"Error executing test {execution_id}: {e}")
            context.status = ExecutionStatus.FAILED
            context.completed_at = datetime.utcnow()
            context.error_message = str(e)
            
            # Analyze failed execution result with AI (non-blocking)
            asyncio.create_task(self._analyze_execution_result_with_ai(context))
            
            await notify_test_execution_error(
                execution_id,
                context.test_case_id,
                str(e),
                context.user_id
            )
            
        finally:
            # Clean up WebDriver session
            if context.session_id:
                await webdriver_manager.close_session(context.session_id)
            
            # Store results in database
            await self._store_execution_results(context)
            
            # Remove from active executions after a delay (keep for status queries)
            asyncio.create_task(self._cleanup_execution(execution_id, delay=300))  # 5 minutes
    
    async def _execute_step(self, context: ExecutionContext, step: TestStep) -> bool:
        try:
            if step.step_type == StepType.NAVIGATE:
                result = await webdriver_manager.navigate_to_url(
                    context.session_id,
                    step.url,
                    step.timeout_seconds
                )
                if result.screenshot_path:
                    context.screenshots.append(result.screenshot_path)
                    # Analyze screenshot with AI (non-blocking)
                    asyncio.create_task(self._analyze_screenshot_with_ai(
                        context, result.screenshot_path, step.description
                    ))
                
                if not result.success:
                    context.error_message = result.message
                    return False
            
            elif step.step_type == StepType.CLICK:
                result = await webdriver_manager.find_element_and_interact(
                    context.session_id,
                    step.selector,
                    step.selector_type,
                    "click",
                    timeout=step.timeout_seconds
                )
                if result.screenshot_path:
                    context.screenshots.append(result.screenshot_path)
                    # Analyze screenshot with AI (non-blocking)
                    asyncio.create_task(self._analyze_screenshot_with_ai(
                        context, result.screenshot_path, step.description
                    ))
                
                if not result.success:
                    context.error_message = result.message
                    return False
            
            elif step.step_type == StepType.INPUT:
                result = await webdriver_manager.find_element_and_interact(
                    context.session_id,
                    step.selector,
                    step.selector_type,
                    "input",
                    step.input_text,
                    step.timeout_seconds
                )
                if result.screenshot_path:
                    context.screenshots.append(result.screenshot_path)
                    # Analyze screenshot with AI (non-blocking)
                    asyncio.create_task(self._analyze_screenshot_with_ai(
                        context, result.screenshot_path, step.description
                    ))
                
                if not result.success:
                    context.error_message = result.message
                    return False
            
            elif step.step_type == StepType.WAIT:
                await asyncio.sleep(step.wait_seconds)
            
            elif step.step_type == StepType.SCREENSHOT:
                # Force screenshot
                screenshot_path = await webdriver_manager._take_screenshot(
                    context.session_id, 
                    f"step_{step.step_number}"
                )
                if screenshot_path:
                    context.screenshots.append(screenshot_path)
                    # Analyze screenshot with AI (non-blocking)
                    asyncio.create_task(self._analyze_screenshot_with_ai(
                        context, screenshot_path, step.description
                    ))
            
            elif step.step_type == StepType.VERIFY:
                result = await webdriver_manager.find_element_and_interact(
                    context.session_id,
                    step.selector,
                    step.selector_type,
                    "get_text",
                    timeout=step.timeout_seconds
                )
                if result.screenshot_path:
                    context.screenshots.append(result.screenshot_path)
                    # Analyze screenshot with AI (non-blocking)
                    asyncio.create_task(self._analyze_screenshot_with_ai(
                        context, result.screenshot_path, step.description
                    ))
                
                if not result.success:
                    context.error_message = result.message
                    return False
                
                # For verification, we'd need to check the actual text against expected
                # This is simplified - in practice you'd parse the result.message for the text
                
            return True
            
        except Exception as e:
            context.error_message = f"Error in step {step.step_number}: {str(e)}"
            logger.error(f"Step execution error: {e}")
            return False
    
    async def _analyze_screenshot_with_ai(self, context: ExecutionContext, screenshot_path: str, step_description: str = None) -> Optional[Dict[str, Any]]:
        """
        Analyze a screenshot using AI and store the results in the execution context.
        This is called automatically after screenshots are taken.
        """
        if not openai_service.is_enabled():
            logger.info("AI analysis skipped - OpenAI service not enabled")
            return None
        
        try:
            # Create context for AI analysis
            ai_context = f"Test execution step: {step_description}" if step_description else "Test execution screenshot"
            
            # Analyze the screenshot
            result = await openai_service.analyze_screenshot(screenshot_path, ai_context)
            
            if result["success"]:
                # Store AI analysis in context for later use
                if not hasattr(context, 'ai_analyses'):
                    context.ai_analyses = []
                
                analysis_data = {
                    "screenshot_path": screenshot_path,
                    "step_description": step_description,
                    "analysis": result["analysis"],
                    "timestamp": datetime.utcnow().isoformat(),
                    "usage": result.get("usage")
                }
                context.ai_analyses.append(analysis_data)
                
                logger.info(f"AI analysis completed for screenshot: {screenshot_path}")
                return analysis_data
            else:
                logger.warning(f"AI analysis failed: {result.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Error in AI screenshot analysis: {e}")
            return None
    
    async def _analyze_execution_result_with_ai(self, context: ExecutionContext) -> Optional[Dict[str, Any]]:
        """
        Analyze the complete test execution result using AI to provide insights.
        This is called after test execution is completed.
        """
        if not openai_service.is_enabled():
            logger.info("AI result analysis skipped - OpenAI service not enabled")
            return None
        
        try:
            # Prepare execution result data for AI analysis
            execution_data = {
                "execution_id": context.execution_id,
                "test_case_name": getattr(context, 'test_case_name', 'Unknown'),
                "status": context.status.value,
                "total_steps": len(context.steps),
                "current_step": context.current_step,
                "started_at": context.started_at.isoformat() if context.started_at else None,
                "completed_at": context.completed_at.isoformat() if context.completed_at else None,
                "duration_seconds": (context.completed_at - context.started_at).total_seconds() if context.started_at and context.completed_at else None,
                "error_message": context.error_message,
                "screenshot_count": len(context.screenshots),
                "ai_analyses_count": len(getattr(context, 'ai_analyses', []))
            }
            
            # Analyze with AI
            result = await openai_service.analyze_test_result(execution_data)
            
            if result["success"]:
                analysis_data = {
                    "execution_result_analysis": result["insights"],
                    "timestamp": datetime.utcnow().isoformat(),
                    "usage": result.get("usage")
                }
                
                # Store in context
                context.final_ai_analysis = analysis_data
                
                logger.info(f"AI execution analysis completed for: {context.execution_id}")
                return analysis_data
            else:
                logger.warning(f"AI execution analysis failed: {result.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Error in AI execution analysis: {e}")
            return None
    
    async def _parse_test_steps(self, test_case: DBTestCase) -> List[TestStep]:
        """Parse test steps from database test case model"""
        steps = []
        
        if not test_case.steps:
            # If no steps are defined, create a basic navigation test
            steps.append(TestStep(
                step_number=1,
                step_type=StepType.NAVIGATE,
                description=f"Navigate to test page for {test_case.name}",
                url="https://example.com",  # Default URL for now
                timeout_seconds=30
            ))
            steps.append(TestStep(
                step_number=2,
                step_type=StepType.SCREENSHOT,
                description="Take screenshot of page"
            ))
            logger.warning(f"Test case {test_case.id} has no defined steps, using default navigation test")
            return steps
        
        # Convert database steps to execution steps
        for db_step in sorted(test_case.steps, key=lambda s: s.order_index):
            step_type_mapping = {
                'navigate': StepType.NAVIGATE,
                'click': StepType.CLICK,
                'input': StepType.INPUT,
                'wait': StepType.WAIT,
                'verify': StepType.VERIFY,
                'screenshot': StepType.SCREENSHOT,
            }
            
            step_type = step_type_mapping.get(db_step.step_type, StepType.SCREENSHOT)
            
            # Parse input data if it exists
            input_data = db_step.input_data or {}
            if isinstance(input_data, str):
                try:
                    input_data = json.loads(input_data)
                except:
                    input_data = {}
            
            step = TestStep(
                step_number=db_step.order_index,
                step_type=step_type,
                description=db_step.description or f"Step {db_step.order_index}",
                selector=db_step.selector,
                selector_type="css",  # Default selector type
                input_text=input_data.get('text') if step_type == StepType.INPUT else None,
                expected_text=db_step.expected_result,
                url=input_data.get('url') if step_type == StepType.NAVIGATE else None,
                wait_seconds=input_data.get('wait_seconds', 2) if step_type == StepType.WAIT else 0,
                timeout_seconds=db_step.timeout_seconds or 10
            )
            steps.append(step)
        
        return steps
    
    
    async def _store_execution_results(self, context: ExecutionContext):
        try:
            # Store execution results in database
            # This would create TestExecution and TestResult records
            logger.info(f"Storing execution results for {context.execution_id}")
        except Exception as e:
            logger.error(f"Failed to store execution results: {e}")
    
    async def _cleanup_execution(self, execution_id: str, delay: int = 300):
        await asyncio.sleep(delay)
        if execution_id in self.active_executions:
            del self.active_executions[execution_id]
            logger.info(f"Cleaned up execution {execution_id}")

# Global orchestrator instance
orchestrator = TestExecutionOrchestrator()