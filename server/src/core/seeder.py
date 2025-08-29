"""
Database seeder for development and testing
Provides realistic test data for the JBTestSuite platform
"""

import asyncio
from datetime import datetime, timedelta
from typing import List
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.database import get_async_session
from src.models.test_definition import TestCase, TestStep, TestSuite
from src.models.test_execution import TestRun, TestExecution, TestStepExecution
from src.models.artifacts import Screenshot, LogEntry
from src.models.configuration import BrowserConfiguration, TestEnvironment


class DatabaseSeeder:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.created_objects = {
            "test_environments": [],
            "browser_configurations": [],
            "test_suites": [],
            "test_cases": [],
            "test_steps": [],
            "test_runs": [],
            "test_executions": [],
            "test_step_executions": [],
            "screenshots": [],
            "log_entries": [],
        }

    async def seed_all(self, clear_existing: bool = False):
        """Seed all tables with sample data"""
        if clear_existing:
            await self.clear_all_data()
        
        print("🌱 Starting database seeding...")
        
        await self.seed_test_environments()
        await self.seed_browser_configurations()
        await self.seed_test_suites()
        await self.seed_test_cases()
        await self.seed_test_runs()
        await self.seed_test_executions()
        
        await self.session.commit()
        print("✅ Database seeding completed successfully!")
        
        return self.created_objects

    async def clear_all_data(self):
        """Clear all existing data (use with caution!)"""
        from sqlalchemy import text
        
        print("🗑️  Clearing existing data...")
        
        # Delete in reverse dependency order
        await self.session.execute(text("DELETE FROM log_entries"))
        await self.session.execute(text("DELETE FROM screenshots"))
        await self.session.execute(text("DELETE FROM test_step_executions"))
        await self.session.execute(text("DELETE FROM test_executions"))
        await self.session.execute(text("DELETE FROM test_runs"))
        await self.session.execute(text("DELETE FROM test_suite_test_cases"))
        await self.session.execute(text("DELETE FROM test_steps"))
        await self.session.execute(text("DELETE FROM test_cases"))
        await self.session.execute(text("DELETE FROM test_suites"))
        await self.session.execute(text("DELETE FROM browser_configurations"))
        await self.session.execute(text("DELETE FROM test_environments"))
        
        await self.session.commit()

    async def seed_test_environments(self):
        """Create test environments"""
        print("🏗️  Creating test environments...")
        
        environments = [
            {
                "name": "development",
                "description": "Local development environment",
                "base_url": "http://localhost:3000",
                "environment_type": "development",
                "is_active": True,
                "variables": {"DEBUG": True, "LOG_LEVEL": "debug"},
                "created_by": "seeder"
            },
            {
                "name": "staging",
                "description": "Staging environment for pre-production testing",
                "base_url": "https://staging.example.com",
                "environment_type": "staging",
                "is_active": True,
                "health_check_url": "https://staging.example.com/health",
                "variables": {"DEBUG": False, "LOG_LEVEL": "info"},
                "created_by": "seeder"
            },
            {
                "name": "production",
                "description": "Production environment",
                "base_url": "https://app.example.com",
                "environment_type": "production",
                "is_active": True,
                "requires_vpn": True,
                "health_check_url": "https://app.example.com/health",
                "variables": {"DEBUG": False, "LOG_LEVEL": "warn"},
                "created_by": "seeder"
            }
        ]
        
        for env_data in environments:
            env = TestEnvironment(**env_data)
            self.session.add(env)
            self.created_objects["test_environments"].append(env)
        
        await self.session.flush()

    async def seed_browser_configurations(self):
        """Create browser configurations"""
        print("🌐 Creating browser configurations...")
        
        configs = [
            {
                "name": "Chrome Desktop",
                "description": "Standard Chrome configuration for desktop testing",
                "browser_type": "chrome",
                "headless": False,
                "window_width": 1920,
                "window_height": 1080,
                "is_default": True,
                "is_active": True,
                "created_by": "seeder"
            },
            {
                "name": "Chrome Mobile",
                "description": "Chrome configuration simulating mobile viewport",
                "browser_type": "chrome",
                "headless": True,
                "window_width": 375,
                "window_height": 667,
                "browser_options": {"mobileEmulation": {"deviceName": "iPhone 8"}},
                "is_active": True,
                "created_by": "seeder"
            },
            {
                "name": "Chrome Headless CI",
                "description": "Headless Chrome for CI/CD pipelines",
                "browser_type": "chrome", 
                "headless": True,
                "window_width": 1280,
                "window_height": 720,
                "browser_options": {"args": ["--no-sandbox", "--disable-dev-shm-usage"]},
                "is_active": True,
                "created_by": "seeder"
            },
            {
                "name": "Firefox Desktop",
                "description": "Firefox configuration for cross-browser testing",
                "browser_type": "firefox",
                "headless": False,
                "window_width": 1920,
                "window_height": 1080,
                "is_active": True,
                "created_by": "seeder"
            }
        ]
        
        for config_data in configs:
            config = BrowserConfiguration(**config_data)
            self.session.add(config)
            self.created_objects["browser_configurations"].append(config)
        
        await self.session.flush()

    async def seed_test_suites(self):
        """Create test suites"""
        print("📦 Creating test suites...")
        
        suites = [
            {
                "name": "Smoke Tests",
                "description": "Critical path smoke tests for basic functionality",
                "tags": ["smoke", "critical", "fast"],
                "is_active": True,
                "created_by": "seeder"
            },
            {
                "name": "Regression Tests", 
                "description": "Full regression test suite",
                "tags": ["regression", "comprehensive"],
                "is_active": True,
                "created_by": "seeder"
            },
            {
                "name": "User Authentication",
                "description": "Tests for user login, registration, and account management",
                "tags": ["auth", "security"],
                "is_active": True,
                "created_by": "seeder"
            },
            {
                "name": "E-commerce Checkout",
                "description": "End-to-end checkout process tests",
                "tags": ["checkout", "e2e", "payment"],
                "is_active": True,
                "created_by": "seeder"
            }
        ]
        
        for suite_data in suites:
            suite = TestSuite(**suite_data)
            self.session.add(suite)
            self.created_objects["test_suites"].append(suite)
        
        await self.session.flush()

    async def seed_test_cases(self):
        """Create test cases with steps"""
        print("📝 Creating test cases and steps...")
        
        test_cases = [
            {
                "name": "User Login - Valid Credentials",
                "description": "Test successful user login with valid email and password",
                "status": "active",
                "priority": "high",
                "tags": ["login", "authentication", "smoke"],
                "author": "seeder",
                "category": "authentication",
                "expected_duration_seconds": 30,
                "is_automated": True,
                "steps": [
                    {
                        "order_index": 1,
                        "name": "Navigate to login page",
                        "step_type": "navigate",
                        "input_data": "/login",
                        "expected_result": "Login page loads successfully"
                    },
                    {
                        "order_index": 2,
                        "name": "Enter email address",
                        "step_type": "type",
                        "selector": "#email",
                        "input_data": "test@example.com",
                        "expected_result": "Email field populated"
                    },
                    {
                        "order_index": 3,
                        "name": "Enter password",
                        "step_type": "type",
                        "selector": "#password",
                        "input_data": "password123",
                        "expected_result": "Password field populated"
                    },
                    {
                        "order_index": 4,
                        "name": "Click login button",
                        "step_type": "click",
                        "selector": "#login-button",
                        "expected_result": "Login initiated"
                    },
                    {
                        "order_index": 5,
                        "name": "Verify successful login",
                        "step_type": "assert",
                        "selector": ".welcome-message",
                        "expected_result": "Welcome message displayed"
                    }
                ]
            },
            {
                "name": "User Registration - New Account",
                "description": "Test new user account creation",
                "status": "active", 
                "priority": "high",
                "tags": ["registration", "authentication"],
                "author": "seeder",
                "category": "authentication",
                "expected_duration_seconds": 45,
                "is_automated": True,
                "steps": [
                    {
                        "order_index": 1,
                        "name": "Navigate to registration page",
                        "step_type": "navigate", 
                        "input_data": "/register",
                        "expected_result": "Registration page loads"
                    },
                    {
                        "order_index": 2,
                        "name": "Fill registration form",
                        "step_type": "type",
                        "selector": "#registration-form",
                        "input_data": '{"firstName": "John", "lastName": "Doe", "email": "john@example.com"}',
                        "expected_result": "Form fields populated"
                    },
                    {
                        "order_index": 3,
                        "name": "Submit registration",
                        "step_type": "click",
                        "selector": "#register-button", 
                        "expected_result": "Registration submitted"
                    },
                    {
                        "order_index": 4,
                        "name": "Verify account created",
                        "step_type": "assert",
                        "selector": ".success-message",
                        "expected_result": "Success message displayed"
                    }
                ]
            },
            {
                "name": "Product Search - Valid Query",
                "description": "Test product search with valid search terms",
                "status": "active",
                "priority": "medium",
                "tags": ["search", "products"],
                "author": "seeder",
                "category": "e-commerce", 
                "expected_duration_seconds": 25,
                "is_automated": True,
                "steps": [
                    {
                        "order_index": 1,
                        "name": "Navigate to homepage",
                        "step_type": "navigate",
                        "input_data": "/",
                        "expected_result": "Homepage loads"
                    },
                    {
                        "order_index": 2,
                        "name": "Enter search query",
                        "step_type": "type",
                        "selector": "#search-input",
                        "input_data": "laptop",
                        "expected_result": "Search term entered"
                    },
                    {
                        "order_index": 3,
                        "name": "Click search button",
                        "step_type": "click",
                        "selector": "#search-button",
                        "expected_result": "Search initiated"
                    },
                    {
                        "order_index": 4,
                        "name": "Verify search results",
                        "step_type": "assert",
                        "selector": ".search-results",
                        "expected_result": "Search results displayed"
                    }
                ]
            },
            {
                "name": "Shopping Cart - Add Item",
                "description": "Test adding product to shopping cart",
                "status": "active",
                "priority": "medium",
                "tags": ["cart", "shopping"],
                "author": "seeder",
                "category": "e-commerce",
                "expected_duration_seconds": 35,
                "is_automated": True,
                "steps": [
                    {
                        "order_index": 1,
                        "name": "Navigate to product page",
                        "step_type": "navigate",
                        "input_data": "/products/laptop-123",
                        "expected_result": "Product page loads"
                    },
                    {
                        "order_index": 2,
                        "name": "Select quantity",
                        "step_type": "type",
                        "selector": "#quantity",
                        "input_data": "2",
                        "expected_result": "Quantity selected"
                    },
                    {
                        "order_index": 3,
                        "name": "Add to cart",
                        "step_type": "click",
                        "selector": "#add-to-cart",
                        "expected_result": "Item added to cart"
                    },
                    {
                        "order_index": 4,
                        "name": "Verify cart updated",
                        "step_type": "assert",
                        "selector": ".cart-badge",
                        "expected_result": "Cart count shows 2"
                    }
                ]
            },
            {
                "name": "Page Load Performance",
                "description": "Test page load times meet performance criteria",
                "status": "active",
                "priority": "low",
                "tags": ["performance", "load-time"],
                "author": "seeder",
                "category": "performance",
                "expected_duration_seconds": 20,
                "is_automated": True,
                "steps": [
                    {
                        "order_index": 1,
                        "name": "Navigate to homepage",
                        "step_type": "navigate",
                        "input_data": "/",
                        "expected_result": "Page loads within 3 seconds"
                    },
                    {
                        "order_index": 2,
                        "name": "Take performance screenshot",
                        "step_type": "screenshot",
                        "expected_result": "Performance metrics captured"
                    }
                ]
            }
        ]
        
        for case_data in test_cases:
            steps_data = case_data.pop("steps")
            test_case = TestCase(**case_data)
            self.session.add(test_case)
            await self.session.flush()
            
            # Add steps
            for step_data in steps_data:
                step = TestStep(test_case_id=test_case.id, **step_data)
                self.session.add(step)
                self.created_objects["test_steps"].append(step)
            
            self.created_objects["test_cases"].append(test_case)
        
        await self.session.flush()
        
        # Associate test cases with test suites
        smoke_suite = self.created_objects["test_suites"][0]  # Smoke Tests
        regression_suite = self.created_objects["test_suites"][1]  # Regression Tests
        auth_suite = self.created_objects["test_suites"][2]  # User Authentication
        ecommerce_suite = self.created_objects["test_suites"][3]  # E-commerce Checkout
        
        # Add test cases to appropriate suites
        smoke_suite.test_cases.extend([
            self.created_objects["test_cases"][0],  # Login
            self.created_objects["test_cases"][2],  # Search
        ])
        
        auth_suite.test_cases.extend([
            self.created_objects["test_cases"][0],  # Login
            self.created_objects["test_cases"][1],  # Registration
        ])
        
        ecommerce_suite.test_cases.extend([
            self.created_objects["test_cases"][2],  # Search
            self.created_objects["test_cases"][3],  # Cart
        ])
        
        regression_suite.test_cases.extend(self.created_objects["test_cases"])  # All tests

    async def seed_test_runs(self):
        """Create test runs"""
        print("🏃 Creating test runs...")
        
        # Create some historical test runs
        for i in range(5):
            days_ago = i * 2 + 1
            run_date = datetime.utcnow() - timedelta(days=days_ago)
            
            suite = self.created_objects["test_suites"][i % len(self.created_objects["test_suites"])]
            browser_config = self.created_objects["browser_configurations"][0]  # Default Chrome
            
            run = TestRun(
                name=f"Automated Run #{i+1}",
                description=f"Scheduled test run for {suite.name}",
                status="completed" if i > 0 else "running",
                test_suite_id=suite.id,
                browser_config_id=browser_config.id,
                started_at=run_date,
                completed_at=run_date + timedelta(minutes=15) if i > 0 else None,
                total_tests=len(suite.test_cases),
                passed_tests=len(suite.test_cases) - 1 if i > 0 else 0,
                failed_tests=1 if i > 0 else 0,
                progress_percentage=100.0 if i > 0 else 60.0,
                triggered_by="scheduler",
                environment="development",
                created_at=run_date,
                updated_at=run_date + timedelta(minutes=15) if i > 0 else datetime.utcnow()
            )
            
            self.session.add(run)
            self.created_objects["test_runs"].append(run)
        
        await self.session.flush()

    async def seed_test_executions(self):
        """Create test executions for test runs"""
        print("⚡ Creating test executions...")
        
        for run in self.created_objects["test_runs"]:
            # Get test suite and its test cases
            result = await self.session.execute(
                select(TestSuite).where(TestSuite.id == run.test_suite_id)
            )
            suite = result.scalar_one()
            
            if not suite.test_cases:
                continue
            
            for i, test_case in enumerate(suite.test_cases):
                execution_status = "passed"
                if run.status == "completed" and i == len(suite.test_cases) - 1:
                    execution_status = "failed"  # Last test failed
                elif run.status == "running" and i >= len(suite.test_cases) // 2:
                    execution_status = "pending"  # Remaining tests pending
                
                duration = None
                completed_at = None
                if execution_status in ["passed", "failed"]:
                    duration = 15.0 + (i * 5.0)  # Varying durations
                    completed_at = run.started_at + timedelta(seconds=duration)
                
                execution = TestExecution(
                    test_run_id=run.id,
                    test_case_id=test_case.id,
                    status=execution_status,
                    started_at=run.started_at + timedelta(seconds=i * 20),
                    completed_at=completed_at,
                    duration_seconds=duration,
                    error_message="Element not found: #submit-button" if execution_status == "failed" else None,
                    error_type="NoSuchElementException" if execution_status == "failed" else None,
                    retry_count=1 if execution_status == "failed" else 0,
                    max_retries=3,
                    browser_session_id=f"session_{run.id}_{i}",
                )
                
                self.session.add(execution)
                self.created_objects["test_executions"].append(execution)
        
        await self.session.flush()
        
        # Create step executions and artifacts for some executions
        await self.seed_step_executions_and_artifacts()

    async def seed_step_executions_and_artifacts(self):
        """Create step executions, screenshots, and logs"""
        print("📸 Creating step executions and artifacts...")
        
        for execution in self.created_objects["test_executions"][:10]:  # Limit to first 10
            # Get test case steps
            result = await self.session.execute(
                select(TestStep).where(TestStep.test_case_id == execution.test_case_id).order_by(TestStep.order_index)
            )
            steps = result.scalars().all()
            
            for step in steps:
                step_status = "passed"
                if execution.status == "failed" and step.order_index == len(steps):
                    step_status = "failed"
                
                step_duration = 3.0 + (step.order_index * 1.5)
                step_execution = TestStepExecution(
                    test_execution_id=execution.id,
                    test_step_id=step.id,
                    order_index=step.order_index,
                    status=step_status,
                    started_at=execution.started_at + timedelta(seconds=(step.order_index - 1) * 4),
                    completed_at=execution.started_at + timedelta(seconds=step.order_index * 4),
                    duration_seconds=step_duration,
                    input_data=step.input_data,
                    actual_result=step.expected_result if step_status == "passed" else "Element not found",
                    expected_result=step.expected_result,
                    error_message="Element selector '#submit-button' not found" if step_status == "failed" else None,
                )
                
                self.session.add(step_execution)
                self.created_objects["test_step_executions"].append(step_execution)
                
                # Create screenshot for some steps
                if step.step_type in ["screenshot", "click", "assert"] or step_status == "failed":
                    screenshot_type = "error" if step_status == "failed" else "step_after"
                    screenshot = Screenshot(
                        test_execution_id=execution.id,
                        test_step_execution_id=step_execution.id,
                        filename=f"step_{step.order_index}_{screenshot_type}.png",
                        file_path=f"/app/artifacts/screenshots/{execution.id}/step_{step.order_index}.png",
                        file_size_bytes=1024 * 50,  # 50KB
                        screenshot_type=screenshot_type,
                        width=1920,
                        height=1080,
                        description=f"Screenshot after {step.name}",
                    )
                    self.session.add(screenshot)
                    self.created_objects["screenshots"].append(screenshot)
            
            # Create log entries
            log_levels = ["info", "debug", "warn", "error"] if execution.status == "failed" else ["info", "debug"]
            for level in log_levels:
                log_entry = LogEntry(
                    test_execution_id=execution.id,
                    level=level,
                    message=f"Test execution {level} message for step execution",
                    source="selenium_driver",
                    timestamp=execution.started_at + timedelta(seconds=5),
                )
                self.session.add(log_entry)
                self.created_objects["log_entries"].append(log_entry)


async def seed_database(clear_existing: bool = False):
    """Main function to seed the database"""
    from src.core.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as session:
        seeder = DatabaseSeeder(session)
        created_objects = await seeder.seed_all(clear_existing=clear_existing)
        
        print("\n📊 Seeding Summary:")
        for table_name, objects in created_objects.items():
            print(f"  {table_name}: {len(objects)} records")
        
        return created_objects


if __name__ == "__main__":
    # Run seeding
    asyncio.run(seed_database(clear_existing=True))