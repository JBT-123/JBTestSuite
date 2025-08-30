from typing import Dict, List, Optional, Any, Union
import asyncio
import logging
import base64
from pathlib import Path
from datetime import datetime, timedelta
import json

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion
from openai.types import ImagesResponse
from ..core.config import settings

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.usage_tracker = {}
        
        if not self.client:
            logger.warning("OpenAI API key not configured. AI features will be disabled.")
    
    def is_enabled(self) -> bool:
        return self.client is not None
    
    async def analyze_screenshot(self, screenshot_path: str, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze a screenshot using GPT-4 Vision to identify elements and suggest test actions.
        """
        if not self.is_enabled():
            return {
                "success": False,
                "error": "OpenAI API not configured",
                "analysis": None
            }
        
        try:
            # Read and encode the screenshot
            screenshot_file = Path(screenshot_path)
            if not screenshot_file.exists():
                return {
                    "success": False, 
                    "error": f"Screenshot file not found: {screenshot_path}",
                    "analysis": None
                }
            
            with open(screenshot_file, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Create the prompt for screenshot analysis
            prompt = self._create_screenshot_analysis_prompt(context)
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            # Track usage
            self._track_usage("screenshot_analysis", response.usage)
            
            # Parse the JSON response
            analysis_text = response.choices[0].message.content
            try:
                analysis = json.loads(analysis_text)
            except json.JSONDecodeError:
                analysis = self._parse_screenshot_analysis(analysis_text)
            
            return {
                "success": True,
                "analysis": analysis,
                "raw_response": analysis_text,
                "usage": response.usage.model_dump() if response.usage else None
            }
            
        except Exception as e:
            logger.error(f"Error analyzing screenshot: {e}")
            return {
                "success": False,
                "error": str(e),
                "analysis": None
            }
    
    async def analyze_screenshot_for_competition(self, screenshot_path: str, test_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Enhanced screenshot analysis specifically designed for the UI Automation Testing Competition.
        Focuses on the three key challenges: Consistency Verification, Exception Detection, and Accelerated Regression Testing.
        """
        if not self.is_enabled():
            return {
                "success": False,
                "error": "OpenAI API not configured",
                "competition_analysis": None
            }
        
        try:
            # Read and encode the screenshot
            screenshot_file = Path(screenshot_path)
            if not screenshot_file.exists():
                return {
                    "success": False, 
                    "error": f"Screenshot file not found: {screenshot_path}",
                    "competition_analysis": None
                }
            
            with open(screenshot_file, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Create competition-specific prompt
            prompt = self._create_competition_analysis_prompt(test_context)
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=3000,
                temperature=0.05,
                response_format={"type": "json_object"}
            )
            
            # Track usage
            self._track_usage("competition_screenshot_analysis", response.usage)
            
            # Parse the JSON response
            analysis_text = response.choices[0].message.content
            competition_analysis = json.loads(analysis_text)
            
            return {
                "success": True,
                "competition_analysis": competition_analysis,
                "raw_response": analysis_text,
                "usage": response.usage.model_dump() if response.usage else None
            }
            
        except Exception as e:
            logger.error(f"Error in competition screenshot analysis: {e}")
            return {
                "success": False,
                "error": str(e),
                "competition_analysis": None
            }

    async def analyze_test_result(self, execution_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze test execution results and provide insights and suggestions.
        """
        if not self.is_enabled():
            return {
                "success": False,
                "error": "OpenAI API not configured",
                "insights": None
            }
        
        try:
            prompt = self._create_test_result_analysis_prompt(execution_result)
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert test automation analyst. Analyze test results and provide actionable insights."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=800,
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            self._track_usage("test_result_analysis", response.usage)
            
            insights = json.loads(response.choices[0].message.content)
            
            return {
                "success": True,
                "insights": insights,
                "usage": response.usage.model_dump() if response.usage else None
            }
            
        except Exception as e:
            logger.error(f"Error analyzing test result: {e}")
            return {
                "success": False,
                "error": str(e),
                "insights": None
            }
    
    async def suggest_test_improvements(self, test_case_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a test case and suggest improvements or optimizations.
        """
        if not self.is_enabled():
            return {
                "success": False,
                "error": "OpenAI API not configured", 
                "suggestions": None
            }
        
        try:
            prompt = self._create_test_improvement_prompt(test_case_data)
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert test automation engineer. Analyze test cases and suggest improvements for reliability, maintainability, and coverage."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            self._track_usage("test_improvement", response.usage)
            
            suggestions = json.loads(response.choices[0].message.content)
            
            return {
                "success": True,
                "suggestions": suggestions,
                "usage": response.usage.model_dump() if response.usage else None
            }
            
        except Exception as e:
            logger.error(f"Error generating test suggestions: {e}")
            return {
                "success": False,
                "error": str(e),
                "suggestions": None
            }
    
    async def generate_test_steps(self, description: str, target_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate test steps based on a natural language description.
        """
        if not self.is_enabled():
            return {
                "success": False,
                "error": "OpenAI API not configured",
                "steps": None
            }
        
        try:
            prompt = self._create_test_generation_prompt(description, target_url)
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert test automation engineer. Generate detailed, executable test steps from natural language descriptions."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1500,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            self._track_usage("test_generation", response.usage)
            
            test_steps = json.loads(response.choices[0].message.content)
            
            return {
                "success": True,
                "steps": test_steps,
                "usage": response.usage.model_dump() if response.usage else None
            }
            
        except Exception as e:
            logger.error(f"Error generating test steps: {e}")
            return {
                "success": False,
                "error": str(e),
                "steps": None
            }
    
    def _create_screenshot_analysis_prompt(self, context: Optional[str] = None) -> str:
        base_prompt = """
        You are an expert UI automation testing analyst specializing in next-generation multi-modal testing. Analyze this screenshot with focus on the three critical challenges of modern UI automation:

        ## 1. CONSISTENCY VERIFICATION
        - Analyze if the page matches expected UI patterns and layouts
        - Identify key visual elements and their positioning
        - Verify if interactive elements are properly rendered and accessible
        - Check for consistent styling, spacing, and alignment
        - Note any deviations from standard web UI conventions

        ## 2. EXCEPTION DETECTION & ANOMALY IDENTIFICATION
        **Expected Anomalies to Detect:**
        - Loading screens, spinners, or progress indicators
        - Pop-ups, modals, alerts, or overlay dialogs
        - Cookie consent banners or notification bars
        - Form validation messages or tooltips
        
        **Unexpected Anomalies to Flag:**
        - Page crashes, 404 errors, or server errors
        - Text overlap, cut-off content, or layout breaks
        - Blank screens or missing content sections
        - UI elements positioned outside viewport
        - Broken images, missing icons, or corrupted rendering
        - Performance issues (slow loading indicators)

        ## 3. ACCELERATED REGRESSION TESTING INSIGHTS
        - Identify critical user journey touchpoints
        - Suggest high-impact test scenarios for this page state
        - Recommend elements that should be monitored for changes
        - Propose automation-friendly element selectors
        - Assess page complexity and testing priority

        ## TECHNICAL ANALYSIS REQUIRED:
        **Interactive Elements Analysis:**
        - List all clickable elements with robust CSS selectors
        - Identify form inputs with data-testid or accessible names
        - Note navigation elements and their hierarchy
        - Map key user interaction points

        **State Verification Points:**
        - Current page URL and title (if visible)
        - Loaded content sections and their completion state
        - Dynamic elements that may change between tests
        - Authentication state indicators

        **Cross-Resolution Compatibility:**
        - Assess responsive design elements
        - Identify potential breakpoints or layout shifts
        - Note elements that may fail on different screen sizes

        **Automation Recommendations:**
        - Suggest wait conditions for reliable automation
        - Identify elements requiring explicit waits
        - Recommend screenshot comparison zones for visual testing
        - Propose key assertions for functional validation

        Return analysis in structured JSON format optimized for automated processing and test case generation.
        """
        
        if context:
            return f"{base_prompt}\n\n## ADDITIONAL CONTEXT:\n{context}\n\nIncorporate this context into your analysis, especially for consistency verification against expected behavior."
        
        return base_prompt
    
    def _create_competition_analysis_prompt(self, test_context: Optional[Dict[str, Any]] = None) -> str:
        context_section = ""
        if test_context:
            context_section = f"""
        ## TEST EXECUTION CONTEXT:
        - Test Name: {test_context.get('test_name', 'Unknown')}
        - Step Number: {test_context.get('step_number', 'N/A')}
        - Expected Action: {test_context.get('expected_action', 'N/A')}
        - Target URL: {test_context.get('target_url', 'N/A')}
        - Previous Steps: {test_context.get('previous_steps', [])}
        """
        
        return f"""
        {context_section}
        
        ## COMPETITION CHALLENGE: HARNESSING MULTI-MODEL LLMS FOR NEXT-GENERATION UI AUTOMATION TESTING
        
        Perform comprehensive visual analysis of this UI screenshot addressing the three critical competition challenges:
        
        ### CHALLENGE 1: CONSISTENCY VERIFICATION
        Analyze and return JSON with:
        ```json
        "consistency_verification": {{
            "ui_pattern_compliance": {{
                "score": 0-100,
                "assessment": "detailed analysis",
                "deviations_found": ["specific deviation descriptions"]
            }},
            "visual_hierarchy": {{
                "header_elements": ["element descriptions with positions"],
                "main_content": ["content section analysis"],
                "navigation_elements": ["nav structure analysis"],
                "footer_elements": ["footer content analysis"]
            }},
            "accessibility_compliance": {{
                "contrast_check": "pass/fail/warning",
                "text_readability": "assessment",
                "interactive_element_sizing": "assessment",
                "focus_indicators": ["present/missing for each element"]
            }},
            "cross_browser_indicators": {{
                "rendering_quality": "assessment",
                "layout_stability": "stable/unstable",
                "potential_compatibility_issues": ["issue descriptions"]
            }}
        }}
        ```
        
        ### CHALLENGE 2: EXCEPTION DETECTION & ANOMALY IDENTIFICATION
        Analyze and return JSON with:
        ```json
        "exception_detection": {{
            "expected_anomalies": {{
                "loading_indicators": ["found loading elements"],
                "modal_overlays": ["found modals/popups"],
                "notification_banners": ["found notifications"],
                "form_validation_messages": ["found validation states"]
            }},
            "unexpected_anomalies": {{
                "error_states": ["404 errors, crashes, server errors"],
                "layout_breaks": ["text overlap, cut-off content, positioning issues"],
                "missing_content": ["blank sections, broken images, missing elements"],
                "performance_indicators": ["slow loading signs, timeouts, partial renders"]
            }},
            "anomaly_severity": {{
                "critical": ["issues that completely break functionality"],
                "major": ["issues that significantly impact user experience"],
                "minor": ["cosmetic issues that don't affect functionality"],
                "informational": ["observations that may be relevant"]
            }},
            "recommended_actions": ["specific steps to handle detected anomalies"]
        }}
        ```
        
        ### CHALLENGE 3: ACCELERATED REGRESSION TESTING INSIGHTS
        Analyze and return JSON with:
        ```json
        "regression_testing_insights": {{
            "critical_test_points": {{
                "primary_user_actions": ["key interactive elements to test"],
                "data_entry_points": ["forms, inputs requiring validation"],
                "navigation_paths": ["critical navigation elements"],
                "state_change_triggers": ["elements that modify page state"]
            }},
            "automation_selectors": {{
                "robust_selectors": [
                    {{
                        "element_description": "description",
                        "recommended_selector": "CSS/XPath selector",
                        "selector_stability": "high/medium/low",
                        "fallback_selectors": ["alternative selectors"]
                    }}
                ],
                "dynamic_elements": ["elements that change IDs or classes"],
                "wait_conditions": ["elements requiring explicit waits"]
            }},
            "test_prioritization": {{
                "high_impact_areas": ["critical functionality zones"],
                "change_prone_elements": ["elements likely to break with updates"],
                "performance_bottlenecks": ["elements that may cause timeouts"],
                "visual_regression_zones": ["areas for screenshot comparison"]
            }},
            "historical_context_recommendations": {{
                "baseline_establishment": ["elements to use as visual baselines"],
                "change_detection_focus": ["specific areas to monitor for changes"],
                "test_case_generation": ["suggested test scenarios based on current state"]
            }}
        }}
        ```
        
        ### ADDITIONAL TECHNICAL ANALYSIS:
        ```json
        "technical_analysis": {{
            "page_performance": {{
                "load_completion_indicators": ["signs page is fully loaded"],
                "async_content_areas": ["sections that load asynchronously"],
                "interactive_readiness": "assessment of when page is ready for interaction"
            }},
            "responsive_design_analysis": {{
                "breakpoint_indicators": ["elements that suggest responsive behavior"],
                "mobile_compatibility": ["elements that may break on mobile"],
                "tablet_considerations": ["mid-size screen compatibility notes"]
            }},
            "security_observations": {{
                "authentication_state": "logged in/out/unknown",
                "sensitive_data_visibility": ["any visible sensitive information"],
                "security_headers_evidence": ["visible security indicators"]
            }}
        }}
        ```
        
        CRITICAL: Return ONLY valid JSON. No additional text or explanations outside the JSON structure.
        """
    
    def _create_test_result_analysis_prompt(self, execution_result: Dict[str, Any]) -> str:
        return f"""
        Analyze this test execution result and provide insights in JSON format:

        Test Result Data:
        {json.dumps(execution_result, indent=2)}

        Please provide analysis in the following JSON structure:
        {{
            "overall_status": "success|partial|failure",
            "key_findings": ["finding1", "finding2", ...],
            "performance_insights": {{
                "execution_time_assessment": "fast|normal|slow",
                "bottleneck_analysis": "description"
            }},
            "reliability_concerns": ["concern1", "concern2", ...],
            "improvement_suggestions": [
                {{
                    "category": "performance|reliability|maintainability",
                    "suggestion": "detailed suggestion",
                    "priority": "high|medium|low"
                }}
            ],
            "next_steps": ["step1", "step2", ...]
        }}
        """
    
    def _create_test_improvement_prompt(self, test_case_data: Dict[str, Any]) -> str:
        return f"""
        Analyze this test case and suggest improvements in JSON format:

        Test Case Data:
        {json.dumps(test_case_data, indent=2)}

        Please provide suggestions in the following JSON structure:
        {{
            "test_case_quality": {{
                "score": 1-10,
                "strengths": ["strength1", "strength2"],
                "weaknesses": ["weakness1", "weakness2"]
            }},
            "improvements": [
                {{
                    "category": "reliability|performance|maintainability|coverage",
                    "current_issue": "description of current issue",
                    "proposed_solution": "detailed solution",
                    "implementation_effort": "low|medium|high",
                    "impact": "low|medium|high"
                }}
            ],
            "best_practices": [
                {{
                    "practice": "best practice description",
                    "how_to_implement": "implementation steps"
                }}
            ],
            "risk_assessment": {{
                "flaky_test_risk": "low|medium|high",
                "maintenance_burden": "low|medium|high",
                "coverage_gaps": ["gap1", "gap2"]
            }}
        }}
        """
    
    def _create_test_generation_prompt(self, description: str, target_url: Optional[str] = None) -> str:
        url_context = f"\nTarget URL: {target_url}" if target_url else ""
        
        return f"""
        Generate detailed test steps from this description:

        Description: {description}{url_context}

        Please generate test steps in the following JSON structure:
        {{
            "test_name": "descriptive test name",
            "test_description": "detailed description of what the test validates",
            "prerequisites": ["prerequisite1", "prerequisite2"],
            "steps": [
                {{
                    "step_number": 1,
                    "action_type": "navigate|click|input|verify|wait|screenshot",
                    "description": "human readable step description",
                    "target_element": {{
                        "selector": "CSS selector",
                        "selector_type": "css|xpath|id|name",
                        "description": "element description"
                    }},
                    "input_data": "data for input steps (optional)",
                    "expected_result": "what should happen after this step",
                    "timeout_seconds": 10
                }}
            ],
            "expected_outcomes": [
                {{
                    "outcome": "description of expected outcome",
                    "verification_method": "how to verify this outcome"
                }}
            ],
            "cleanup_steps": ["cleanup step descriptions if needed"]
        }}
        """
    
    def _parse_screenshot_analysis(self, analysis_text: str) -> Dict[str, Any]:
        """
        Parse the raw AI response for screenshot analysis into structured data.
        This is a simple parser - in production you'd want more robust parsing.
        """
        try:
            # Try to extract structured information from the response
            lines = analysis_text.split('\n')
            
            elements = []
            suggestions = []
            issues = []
            
            current_section = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                if "interactive elements" in line.lower():
                    current_section = "elements"
                elif "test actions" in line.lower() or "suggestions" in line.lower():
                    current_section = "suggestions"
                elif "issues" in line.lower() or "anomalies" in line.lower():
                    current_section = "issues"
                elif line.startswith('-') or line.startswith('*'):
                    if current_section == "elements":
                        elements.append(line[1:].strip())
                    elif current_section == "suggestions":
                        suggestions.append(line[1:].strip())
                    elif current_section == "issues":
                        issues.append(line[1:].strip())
            
            return {
                "interactive_elements": elements,
                "test_suggestions": suggestions,
                "potential_issues": issues,
                "raw_analysis": analysis_text
            }
            
        except Exception as e:
            logger.warning(f"Error parsing screenshot analysis: {e}")
            return {
                "raw_analysis": analysis_text,
                "parsing_error": str(e)
            }
    
    def _track_usage(self, operation_type: str, usage: Any):
        """
        Track API usage for cost monitoring and rate limiting.
        """
        if not usage:
            return
        
        today = datetime.utcnow().date()
        
        if today not in self.usage_tracker:
            self.usage_tracker[today] = {}
        
        if operation_type not in self.usage_tracker[today]:
            self.usage_tracker[today][operation_type] = {
                "requests": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            }
        
        daily_usage = self.usage_tracker[today][operation_type]
        daily_usage["requests"] += 1
        daily_usage["prompt_tokens"] += usage.prompt_tokens
        daily_usage["completion_tokens"] += usage.completion_tokens
        daily_usage["total_tokens"] += usage.total_tokens
        
        logger.info(f"AI Usage - {operation_type}: {usage.total_tokens} tokens")
    
    def get_usage_stats(self, days: int = 7) -> Dict[str, Any]:
        """
        Get usage statistics for cost monitoring.
        """
        cutoff_date = datetime.utcnow().date() - timedelta(days=days)
        
        stats = {
            "total_requests": 0,
            "total_tokens": 0,
            "by_operation": {},
            "by_date": {}
        }
        
        for date, daily_usage in self.usage_tracker.items():
            if date < cutoff_date:
                continue
            
            date_str = date.isoformat()
            stats["by_date"][date_str] = {
                "total_requests": 0,
                "total_tokens": 0,
                "operations": {}
            }
            
            for operation, usage in daily_usage.items():
                stats["total_requests"] += usage["requests"]
                stats["total_tokens"] += usage["total_tokens"]
                
                if operation not in stats["by_operation"]:
                    stats["by_operation"][operation] = {
                        "requests": 0,
                        "tokens": 0
                    }
                
                stats["by_operation"][operation]["requests"] += usage["requests"]
                stats["by_operation"][operation]["tokens"] += usage["total_tokens"]
                
                stats["by_date"][date_str]["total_requests"] += usage["requests"]
                stats["by_date"][date_str]["total_tokens"] += usage["total_tokens"]
                stats["by_date"][date_str]["operations"][operation] = usage
        
        return stats
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check the health of the OpenAI service.
        """
        if not self.is_enabled():
            return {
                "status": "disabled",
                "message": "OpenAI API key not configured",
                "api_accessible": False
            }
        
        try:
            # Make a minimal API call to test connectivity
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5
            )
            
            return {
                "status": "healthy",
                "message": "OpenAI API accessible",
                "api_accessible": True,
                "model_available": True
            }
            
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return {
                "status": "error",
                "message": f"OpenAI API error: {str(e)}",
                "api_accessible": False
            }

# Global OpenAI service instance
openai_service = OpenAIService()