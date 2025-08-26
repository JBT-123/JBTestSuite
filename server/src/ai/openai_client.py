import base64
from typing import Optional
from openai import AsyncOpenAI
from ..core.config import settings


class OpenAIClient:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    async def generate_test_case(self, url: str, description: str) -> str:
        """Generate a test case description using ChatGPT"""
        prompt = f"""
        Generate a comprehensive test case for the website: {url}
        
        Description: {description}
        
        Please provide:
        1. Test objective
        2. Steps to perform
        3. Expected results
        4. Potential edge cases to consider
        
        Format the response as a structured test plan.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a QA engineer expert in creating comprehensive test cases."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating test case: {str(e)}"
    
    async def analyze_screenshot(self, screenshot_path: str, test_description: str) -> str:
        """Analyze a screenshot using ChatGPT Vision"""
        try:
            # Read the image file
            with open(screenshot_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
            
            prompt = f"""
            Analyze this screenshot from a web automation test.
            
            Test Description: {test_description}
            
            Please provide:
            1. What you can see in the screenshot
            2. Any potential issues or anomalies
            3. Whether the page appears to be loaded correctly
            4. Suggestions for test validation
            5. Overall assessment of the page state
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=800
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return f"Error analyzing screenshot: {str(e)}"
    
    async def interpret_test_results(self, execution_log: str, screenshot_analysis: Optional[str] = None) -> str:
        """Interpret test execution results"""
        prompt = f"""
        Analyze the following test execution log and provide insights:
        
        Execution Log:
        {execution_log}
        
        {f"Screenshot Analysis: {screenshot_analysis}" if screenshot_analysis else ""}
        
        Please provide:
        1. Summary of test execution
        2. Any errors or issues identified
        3. Success/failure assessment
        4. Recommendations for improvement
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a QA analyst expert in interpreting test results."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=600,
                temperature=0.3
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return f"Error interpreting results: {str(e)}"