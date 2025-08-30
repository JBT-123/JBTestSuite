from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from datetime import datetime
import tempfile
import os

from ...ai.openai_service import openai_service

router = APIRouter(prefix="/ai", tags=["ai"])

class ScreenshotAnalysisRequest(BaseModel):
    screenshot_path: str
    context: Optional[str] = None

class TestResultAnalysisRequest(BaseModel):
    execution_result: Dict[str, Any]

class TestImprovementRequest(BaseModel):
    test_case_data: Dict[str, Any]

class TestGenerationRequest(BaseModel):
    description: str
    target_url: Optional[str] = None

class CompetitionAnalysisRequest(BaseModel):
    screenshot_path: str
    test_context: Optional[Dict[str, Any]] = None

@router.get("/health")
async def ai_health_check():
    """Check the health of AI services"""
    try:
        health_status = await openai_service.health_check()
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "openai_service": health_status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def ai_service_status():
    """Get AI service configuration and status"""
    return {
        "openai_enabled": openai_service.is_enabled(),
        "available_features": {
            "screenshot_analysis": openai_service.is_enabled(),
            "test_result_analysis": openai_service.is_enabled(),
            "test_improvement_suggestions": openai_service.is_enabled(),
            "test_step_generation": openai_service.is_enabled()
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/analyze-screenshot")
async def analyze_screenshot(request: ScreenshotAnalysisRequest):
    """Analyze a screenshot using AI vision"""
    try:
        if not openai_service.is_enabled():
            raise HTTPException(
                status_code=503, 
                detail="AI services not available - OpenAI API key not configured"
            )
        
        result = await openai_service.analyze_screenshot(
            request.screenshot_path,
            request.context
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "analysis": result["analysis"],
            "usage": result.get("usage"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-screenshot-upload")
async def analyze_screenshot_upload(
    file: UploadFile = File(...),
    context: Optional[str] = None
):
    """Analyze an uploaded screenshot using AI vision"""
    try:
        if not openai_service.is_enabled():
            raise HTTPException(
                status_code=503,
                detail="AI services not available - OpenAI API key not configured"
            )
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        try:
            result = await openai_service.analyze_screenshot(temp_path, context)
            
            if not result["success"]:
                raise HTTPException(status_code=400, detail=result["error"])
            
            return {
                "analysis": result["analysis"],
                "usage": result.get("usage"),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        finally:
            # Clean up temporary file
            os.unlink(temp_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-test-result")
async def analyze_test_result(request: TestResultAnalysisRequest):
    """Analyze test execution results and provide insights"""
    try:
        if not openai_service.is_enabled():
            raise HTTPException(
                status_code=503,
                detail="AI services not available - OpenAI API key not configured"
            )
        
        result = await openai_service.analyze_test_result(request.execution_result)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "insights": result["insights"],
            "usage": result.get("usage"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggest-improvements")
async def suggest_test_improvements(request: TestImprovementRequest):
    """Analyze a test case and suggest improvements"""
    try:
        if not openai_service.is_enabled():
            raise HTTPException(
                status_code=503,
                detail="AI services not available - OpenAI API key not configured"
            )
        
        result = await openai_service.suggest_test_improvements(request.test_case_data)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "suggestions": result["suggestions"],
            "usage": result.get("usage"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-test-steps")
async def generate_test_steps(request: TestGenerationRequest):
    """Generate test steps from natural language description"""
    try:
        if not openai_service.is_enabled():
            raise HTTPException(
                status_code=503,
                detail="AI services not available - OpenAI API key not configured"
            )
        
        result = await openai_service.generate_test_steps(
            request.description,
            request.target_url
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "test_steps": result["steps"],
            "usage": result.get("usage"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage-stats")
async def get_usage_stats(days: int = 7):
    """Get AI service usage statistics"""
    try:
        stats = openai_service.get_usage_stats(days)
        return {
            "usage_stats": stats,
            "period_days": days,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Demo/testing endpoints for development
@router.post("/demo/analyze-current-screenshot")
async def demo_analyze_current_screenshot(execution_id: str):
    """Demo endpoint to analyze the most recent screenshot from an execution"""
    try:
        if not openai_service.is_enabled():
            return {
                "demo": True,
                "message": "AI services not enabled - would analyze screenshot here",
                "mock_analysis": {
                    "interactive_elements": [
                        "Login button (CSS: #login-btn)",
                        "Username input field (CSS: #username)",
                        "Password input field (CSS: #password)",
                        "Navigation menu (CSS: .nav-menu)"
                    ],
                    "test_suggestions": [
                        "Verify login functionality with valid credentials",
                        "Test form validation with invalid inputs",
                        "Check navigation menu accessibility",
                        "Validate responsive design on mobile"
                    ],
                    "potential_issues": [
                        "Password field appears to be in plain text",
                        "No loading state visible on login button"
                    ]
                }
            }
        
        # In a real implementation, you'd:
        # 1. Get the execution context from the orchestrator
        # 2. Find the most recent screenshot
        # 3. Analyze it with AI
        
        return {
            "demo": True,
            "message": "This would analyze the latest screenshot from execution",
            "execution_id": execution_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-screenshot-competition")
async def analyze_screenshot_competition(request: CompetitionAnalysisRequest):
    """
    Analyze a screenshot using competition-focused AI prompts.
    This endpoint implements the enhanced prompt engineering for the 
    'Harnessing Multi-Model LLMs for Next-Generation UI Automation Testing' competition.
    """
    try:
        if not openai_service.is_enabled():
            raise HTTPException(
                status_code=503, 
                detail="AI services not available - OpenAI API key not configured"
            )
        
        result = await openai_service.analyze_screenshot_for_competition(
            request.screenshot_path,
            request.test_context
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "competition_analysis": result["competition_analysis"],
            "raw_response": result.get("raw_response"),
            "usage": result.get("usage"),
            "timestamp": datetime.utcnow().isoformat(),
            "competition_challenges": {
                "consistency_verification": "✅ Analyzed",
                "exception_detection": "✅ Analyzed", 
                "regression_testing_insights": "✅ Analyzed"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-screenshot-competition-upload")
async def analyze_screenshot_competition_upload(
    file: UploadFile = File(...),
    test_name: Optional[str] = None,
    step_number: Optional[int] = None,
    expected_action: Optional[str] = None,
    target_url: Optional[str] = None
):
    """
    Analyze an uploaded screenshot using competition-focused AI prompts.
    Allows uploading a screenshot file directly for competition analysis.
    """
    try:
        if not openai_service.is_enabled():
            raise HTTPException(
                status_code=503,
                detail="AI services not available - OpenAI API key not configured"
            )
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        try:
            # Build test context if provided
            test_context = None
            if any([test_name, step_number, expected_action, target_url]):
                test_context = {
                    "test_name": test_name or "Uploaded Screenshot Analysis",
                    "step_number": step_number or 1,
                    "expected_action": expected_action or "Screenshot analysis",
                    "target_url": target_url or "unknown",
                    "previous_steps": []
                }
            
            result = await openai_service.analyze_screenshot_for_competition(
                temp_path, 
                test_context
            )
            
            if not result["success"]:
                raise HTTPException(status_code=400, detail=result["error"])
            
            return {
                "success": True,
                "competition_analysis": result["competition_analysis"],
                "usage": result.get("usage"),
                "timestamp": datetime.utcnow().isoformat(),
                "file_analyzed": file.filename,
                "competition_challenges": {
                    "consistency_verification": "✅ Analyzed",
                    "exception_detection": "✅ Analyzed", 
                    "regression_testing_insights": "✅ Analyzed"
                }
            }
            
        finally:
            # Clean up temporary file
            os.unlink(temp_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))