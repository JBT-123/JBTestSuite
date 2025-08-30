"""
Pytest configuration and fixtures for JBTestSuite tests
"""

import asyncio
from typing import AsyncGenerator, List
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

from src.main import app
from src.core.database import get_async_session, Base
from src.models.test_definition import TestCase, TestStep, TestSuite
from src.models.test_execution import TestRun, TestExecution
from src.models.configuration import BrowserConfiguration, TestEnvironment
from src.models.artifacts import Screenshot, LogEntry


# Test database URL (use in-memory SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def test_engine():
    """Create a test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        echo=False,
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session"""
    async with AsyncSession(test_engine, expire_on_commit=False) as session:
        yield session


@pytest.fixture
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test HTTP client"""
    
    # Override the get_async_session dependency
    async def override_get_async_session():
        yield session
    
    app.dependency_overrides[get_async_session] = override_get_async_session
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    # Clean up
    app.dependency_overrides.clear()


# Test data fixtures
@pytest.fixture
async def sample_test_environment(session: AsyncSession) -> TestEnvironment:
    """Create a sample test environment"""
    environment = TestEnvironment(
        name="test_environment",
        description="Test environment for unit tests",
        base_url="http://localhost:3000",
        environment_type="development",
        is_active=True,
        created_by="test_user"
    )
    session.add(environment)
    await session.commit()
    await session.refresh(environment)
    return environment


@pytest.fixture
async def sample_browser_config(session: AsyncSession) -> BrowserConfiguration:
    """Create a sample browser configuration"""
    config = BrowserConfiguration(
        name="Test Chrome",
        description="Chrome config for testing",
        browser_type="chrome",
        headless=True,
        window_width=1280,
        window_height=720,
        is_default=True,
        is_active=True,
        created_by="test_user"
    )
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config


@pytest.fixture
async def sample_test_suite(session: AsyncSession) -> TestSuite:
    """Create a sample test suite"""
    suite = TestSuite(
        name="Test Suite",
        description="Sample test suite for testing",
        tags=["test", "sample"],
        is_active=True,
        created_by="test_user"
    )
    session.add(suite)
    await session.commit()
    await session.refresh(suite)
    return suite


@pytest.fixture
async def sample_test_case(session: AsyncSession) -> TestCase:
    """Create a sample test case"""
    test_case = TestCase(
        name="Sample Test Case",
        description="A sample test case for testing",
        status="active",
        priority="medium",
        tags=["sample", "login"],
        author="test_user",
        category="authentication",
        expected_duration_seconds=30,
        is_automated=True,
        retry_count=2
    )
    session.add(test_case)
    await session.commit()
    await session.refresh(test_case)
    return test_case


@pytest.fixture
async def sample_test_cases(session: AsyncSession) -> List[TestCase]:
    """Create multiple sample test cases"""
    test_cases = []
    
    cases_data = [
        {
            "name": "Login Test",
            "description": "Test user login functionality",
            "status": "active",
            "priority": "high",
            "tags": ["login", "authentication"],
            "category": "auth"
        },
        {
            "name": "Registration Test",
            "description": "Test user registration",
            "status": "active", 
            "priority": "medium",
            "tags": ["registration", "authentication"],
            "category": "auth"
        },
        {
            "name": "Search Test",
            "description": "Test search functionality", 
            "status": "draft",
            "priority": "low",
            "tags": ["search"],
            "category": "feature"
        },
        {
            "name": "Cart Test",
            "description": "Test shopping cart",
            "status": "active",
            "priority": "medium", 
            "tags": ["cart", "ecommerce"],
            "category": "ecommerce"
        }
    ]
    
    for case_data in cases_data:
        test_case = TestCase(
            **case_data,
            author="test_user",
            is_automated=True
        )
        session.add(test_case)
        test_cases.append(test_case)
    
    await session.commit()
    
    for test_case in test_cases:
        await session.refresh(test_case)
    
    return test_cases


@pytest.fixture
async def sample_test_case_with_steps(session: AsyncSession) -> tuple[TestCase, List[TestStep]]:
    """Create a test case with test steps"""
    test_case = TestCase(
        name="Login Test with Steps",
        description="Complete login test with steps",
        status="active",
        priority="high",
        author="test_user",
        category="authentication"
    )
    session.add(test_case)
    await session.flush()
    
    steps_data = [
        {
            "order_index": 1,
            "name": "Navigate to login",
            "step_type": "navigate",
            "input_data": "/login",
            "expected_result": "Login page loads"
        },
        {
            "order_index": 2,
            "name": "Enter email",
            "step_type": "type",
            "selector": "#email",
            "input_data": "test@example.com",
            "expected_result": "Email entered"
        },
        {
            "order_index": 3,
            "name": "Enter password",
            "step_type": "type",
            "selector": "#password", 
            "input_data": "password123",
            "expected_result": "Password entered"
        },
        {
            "order_index": 4,
            "name": "Click login",
            "step_type": "click",
            "selector": "#login-btn",
            "expected_result": "Login successful"
        }
    ]
    
    steps = []
    for step_data in steps_data:
        step = TestStep(test_case_id=test_case.id, **step_data)
        session.add(step)
        steps.append(step)
    
    await session.commit()
    await session.refresh(test_case)
    
    for step in steps:
        await session.refresh(step)
    
    return test_case, steps


@pytest.fixture
async def many_test_cases(session: AsyncSession) -> List[TestCase]:
    """Create many test cases for performance testing"""
    test_cases = []
    
    for i in range(50):  # Create 50 test cases
        test_case = TestCase(
            name=f"Performance Test Case {i+1}",
            description=f"Test case {i+1} for performance testing",
            status="active" if i % 3 == 0 else "draft",
            priority="high" if i % 5 == 0 else "medium",
            tags=[f"perf_{i}", "performance"],
            author="perf_test_user",
            category="performance",
            is_automated=True
        )
        session.add(test_case)
        test_cases.append(test_case)
    
    await session.commit()
    
    for test_case in test_cases:
        await session.refresh(test_case)
    
    return test_cases


@pytest.fixture
async def sample_test_run(
    session: AsyncSession, 
    sample_test_suite: TestSuite,
    sample_browser_config: BrowserConfiguration
) -> TestRun:
    """Create a sample test run"""
    test_run = TestRun(
        name="Sample Test Run",
        description="A sample test run for testing",
        status="pending",
        test_suite_id=sample_test_suite.id,
        browser_config_id=sample_browser_config.id,
        total_tests=3,
        passed_tests=0,
        failed_tests=0,
        progress_percentage=0.0,
        triggered_by="test_user",
        environment="test"
    )
    session.add(test_run)
    await session.commit()
    await session.refresh(test_run)
    return test_run


@pytest.fixture
async def sample_test_execution(
    session: AsyncSession,
    sample_test_run: TestRun,
    sample_test_case: TestCase
) -> TestExecution:
    """Create a sample test execution"""
    execution = TestExecution(
        test_run_id=sample_test_run.id,
        test_case_id=sample_test_case.id,
        status="pending",
        retry_count=0,
        max_retries=3,
        browser_session_id="test_session_123"
    )
    session.add(execution)
    await session.commit()
    await session.refresh(execution)
    return execution


# Mock data helpers
@pytest.fixture
def mock_screenshot_data():
    """Mock screenshot data for testing"""
    return {
        "filename": "test_screenshot.png",
        "file_path": "/tmp/test_screenshot.png",
        "file_size_bytes": 1024 * 50,  # 50KB
        "screenshot_type": "step_after",
        "width": 1280,
        "height": 720,
        "description": "Test screenshot"
    }


@pytest.fixture
def mock_log_entry_data():
    """Mock log entry data for testing"""
    return {
        "level": "info",
        "message": "Test log message",
        "source": "test_driver",
        "category": "test",
        "timestamp": "2025-08-26T13:15:00Z"
    }


# Test utilities
@pytest.fixture
def assert_response_time():
    """Utility to assert API response times"""
    import time
    
    def _assert_response_time(response_time: float, max_time: float = 1.0):
        assert response_time < max_time, f"Response time {response_time}s exceeded maximum {max_time}s"
    
    return _assert_response_time


@pytest.fixture
def create_test_data():
    """Helper to create test data on demand"""
    
    async def _create_test_data(session: AsyncSession, data_type: str, count: int = 1):
        """Create test data based on type"""
        if data_type == "test_cases":
            test_cases = []
            for i in range(count):
                test_case = TestCase(
                    name=f"Dynamic Test Case {i+1}",
                    description=f"Dynamically created test case {i+1}",
                    status="active",
                    priority="medium",
                    author="dynamic_creator"
                )
                session.add(test_case)
                test_cases.append(test_case)
            
            await session.commit()
            
            for test_case in test_cases:
                await session.refresh(test_case)
            
            return test_cases[0] if count == 1 else test_cases
        
        # Add more data types as needed
        raise ValueError(f"Unknown data type: {data_type}")
    
    return _create_test_data


# Cleanup fixtures
@pytest.fixture(autouse=True)
async def cleanup_after_test(session: AsyncSession):
    """Cleanup after each test"""
    yield
    # Test cleanup happens automatically with in-memory database