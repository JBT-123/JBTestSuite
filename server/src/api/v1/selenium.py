from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime

from ...selenium.webdriver_manager import webdriver_manager
from ...services.test_execution_orchestrator import orchestrator

router = APIRouter(prefix="/selenium", tags=["selenium"])

class CreateSessionRequest(BaseModel):
    timeout_minutes: Optional[int] = 30

class NavigateRequest(BaseModel):
    url: str
    timeout_seconds: Optional[int] = 30

class ElementInteractionRequest(BaseModel):
    selector: str
    selector_type: Optional[str] = "css"
    action: str  # click, input, clear, get_text, get_attribute
    input_text: Optional[str] = None
    timeout_seconds: Optional[int] = 10

class SessionResponse(BaseModel):
    session_id: str
    created_at: str
    last_used: str
    is_busy: bool
    current_url: Optional[str]
    screenshot_count: int

class NavigationResponse(BaseModel):
    success: bool
    message: str
    final_url: Optional[str] = None
    load_time_ms: int = 0
    screenshot_path: Optional[str] = None

class InteractionResponse(BaseModel):
    success: bool
    message: str
    element_found: bool = False
    screenshot_path: Optional[str] = None
    execution_time_ms: int = 0

@router.post("/sessions", response_model=Dict[str, str])
async def create_webdriver_session(request: CreateSessionRequest):
    """Create a new WebDriver session"""
    try:
        session_id = await webdriver_manager.create_session()
        return {
            "session_id": session_id,
            "message": "WebDriver session created successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions", response_model=List[SessionResponse])
async def list_webdriver_sessions():
    """List all active WebDriver sessions"""
    try:
        sessions_data = await webdriver_manager.list_sessions()
        return [SessionResponse(**session) for session in sessions_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_webdriver_session(session_id: str):
    """Get information about a specific WebDriver session"""
    try:
        session_info = await webdriver_manager.get_session_info(session_id)
        if not session_info:
            raise HTTPException(status_code=404, detail="Session not found")
        return SessionResponse(**session_info)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions/{session_id}")
async def close_webdriver_session(session_id: str):
    """Close a WebDriver session"""
    try:
        success = await webdriver_manager.close_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        return {
            "message": "WebDriver session closed successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/{session_id}/navigate", response_model=NavigationResponse)
async def navigate_to_url(session_id: str, request: NavigateRequest):
    """Navigate to a URL in the specified session"""
    try:
        result = await webdriver_manager.navigate_to_url(
            session_id, 
            request.url, 
            request.timeout_seconds
        )
        return NavigationResponse(
            success=result.success,
            message=result.message,
            final_url=result.final_url,
            load_time_ms=result.load_time_ms,
            screenshot_path=result.screenshot_path
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/{session_id}/interact", response_model=InteractionResponse)
async def interact_with_element(session_id: str, request: ElementInteractionRequest):
    """Interact with an element in the specified session"""
    try:
        result = await webdriver_manager.find_element_and_interact(
            session_id,
            request.selector,
            request.selector_type,
            request.action,
            request.input_text,
            request.timeout_seconds
        )
        return InteractionResponse(
            success=result.success,
            message=result.message,
            element_found=result.element_found,
            screenshot_path=result.screenshot_path,
            execution_time_ms=result.execution_time_ms
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def selenium_health_check():
    """Get health information about the Selenium service"""
    try:
        health_info = await webdriver_manager.health_check()
        return {
            "status": "healthy",
            "webdriver_manager": health_info,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Test Execution Management Endpoints

class QueueExecutionRequest(BaseModel):
    test_case_id: str
    user_id: Optional[str] = None

@router.post("/executions/queue")
async def queue_test_execution(request: QueueExecutionRequest):
    """Queue a test execution"""
    try:
        execution_id = await orchestrator.queue_test_execution(
            request.test_case_id,
            request.user_id
        )
        return {
            "execution_id": execution_id,
            "test_case_id": request.test_case_id,
            "message": "Test execution queued successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/executions/{execution_id}")
async def get_execution_status(execution_id: str):
    """Get the status of a test execution"""
    try:
        status = await orchestrator.get_execution_status(execution_id)
        if not status:
            raise HTTPException(status_code=404, detail="Execution not found")
        return status
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/executions/{execution_id}")
async def cancel_test_execution(execution_id: str):
    """Cancel a test execution"""
    try:
        success = await orchestrator.cancel_execution(execution_id)
        if not success:
            raise HTTPException(status_code=404, detail="Execution not found or cannot be cancelled")
        return {
            "message": "Test execution cancelled successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))