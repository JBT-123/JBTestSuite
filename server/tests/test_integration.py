"""
Integration tests for JBTestSuite
Test complete workflows across multiple endpoints and services
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.test_definition import TestCase, TestSuite
from src.models.test_execution import TestRun, TestExecution


class TestCompleteWorkflows:
    """Test complete end-to-end workflows"""

    @pytest.mark.asyncio
    async def test_complete_test_case_lifecycle(self, client: AsyncClient, session: AsyncSession):
        """Test complete test case lifecycle from creation to execution"""
        
        # Step 1: Create a test suite
        suite_data = {
            "name": "Integration Test Suite",
            "description": "Suite for integration testing",
            "tags": ["integration"],
            "is_active": True
        }
        
        suite_response = await client.post("/api/v1/suites/", json=suite_data)
        assert suite_response.status_code == 201
        suite = suite_response.json()
        suite_id = suite["id"]
        
        # Step 2: Create a test case
        case_data = {
            "name": "Integration Test Case",
            "description": "Test case for integration testing",
            "status": "active",
            "priority": "high",
            "tags": ["integration", "e2e"],
            "category": "integration"
        }
        
        case_response = await client.post("/api/v1/tests/", json=case_data)
        assert case_response.status_code == 201
        test_case = case_response.json()
        case_id = test_case["id"]
        
        # Step 3: Add test steps
        steps_data = [
            {
                "order_index": 1,
                "name": "Setup test data",
                "step_type": "custom",
                "description": "Initialize test environment"
            },
            {
                "order_index": 2,
                "name": "Execute main test",
                "step_type": "click",
                "selector": "#test-button",
                "expected_result": "Button clicked successfully"
            },
            {
                "order_index": 3,
                "name": "Verify results",
                "step_type": "assert",
                "selector": ".result-message",
                "expected_result": "Success message displayed"
            }
        ]
        
        created_steps = []
        for step_data in steps_data:
            step_response = await client.post(f"/api/v1/tests/{case_id}/steps", json=step_data)
            assert step_response.status_code == 201
            created_steps.append(step_response.json())
        
        # Step 4: Add test case to suite
        add_response = await client.post(f"/api/v1/suites/{suite_id}/tests/{case_id}")
        assert add_response.status_code == 201
        
        # Step 5: Create browser configuration
        browser_config_data = {
            "name": "Integration Test Browser",
            "browser_type": "chrome",
            "headless": True,
            "window_width": 1280,
            "window_height": 720,
            "is_active": True
        }
        
        browser_response = await client.post("/api/v1/configurations/browsers", json=browser_config_data)
        assert browser_response.status_code == 201
        browser_config = browser_response.json()
        browser_id = browser_config["id"]
        
        # Step 6: Create test run
        run_data = {
            "name": "Integration Test Run",
            "description": "Test run for integration testing",
            "test_suite_id": suite_id,
            "browser_config_id": browser_id,
            "environment": "integration",
            "triggered_by": "integration_test"
        }
        
        run_response = await client.post("/api/v1/executions/runs", json=run_data)
        assert run_response.status_code == 201
        test_run = run_response.json()
        run_id = test_run["id"]
        
        # Step 7: Verify the complete workflow
        # Check that suite has the test case
        suite_with_tests_response = await client.get(f"/api/v1/suites/{suite_id}")
        assert suite_with_tests_response.status_code == 200
        suite_with_tests = suite_with_tests_response.json()
        assert len(suite_with_tests["test_cases"]) == 1
        assert suite_with_tests["test_cases"][0]["id"] == case_id
        
        # Check that test case has steps
        case_with_steps_response = await client.get(f"/api/v1/tests/{case_id}")
        assert case_with_steps_response.status_code == 200
        case_with_steps = case_with_steps_response.json()
        assert len(case_with_steps["steps"]) == 3
        
        # Check that test run exists and is properly configured
        run_detail_response = await client.get(f"/api/v1/executions/runs/{run_id}")
        assert run_detail_response.status_code == 200
        run_detail = run_detail_response.json()
        assert run_detail["test_suite_id"] == suite_id
        assert run_detail["browser_config_id"] == browser_id

    @pytest.mark.asyncio
    async def test_test_execution_workflow(self, client: AsyncClient, sample_test_case, sample_browser_config):
        """Test the test execution workflow"""
        
        # Step 1: Create a test run with specific test cases
        run_data = {
            "name": "Execution Workflow Test",
            "description": "Test the execution workflow",
            "browser_config_id": str(sample_browser_config.id),
            "test_case_ids": [str(sample_test_case.id)],
            "environment": "test",
            "triggered_by": "workflow_test"
        }
        
        run_response = await client.post("/api/v1/executions/runs", json=run_data)
        assert run_response.status_code == 201
        test_run = run_response.json()
        run_id = test_run["id"]
        
        # Step 2: Get executions for the run
        executions_response = await client.get(f"/api/v1/executions/?run_id={run_id}")
        assert executions_response.status_code == 200
        executions_data = executions_response.json()
        assert executions_data["total"] == 1
        
        execution = executions_data["items"][0]
        execution_id = execution["id"]
        
        # Step 3: Update execution status to running
        status_response = await client.put(
            f"/api/v1/executions/{execution_id}/status?status=running"
        )
        assert status_response.status_code == 200
        updated_execution = status_response.json()
        assert updated_execution["status"] == "running"
        
        # Step 4: Create artifacts for the execution
        screenshot_data = {
            "test_execution_id": execution_id,
            "filename": "workflow_test.png",
            "file_path": "/tmp/workflow_test.png",
            "file_size_bytes": 1024 * 100,
            "screenshot_type": "step_after",
            "width": 1280,
            "height": 720,
            "description": "Workflow test screenshot"
        }
        
        screenshot_response = await client.post("/api/v1/artifacts/screenshots", json=screenshot_data)
        assert screenshot_response.status_code == 201
        
        log_data = {
            "test_execution_id": execution_id,
            "level": "info",
            "message": "Workflow test execution started",
            "source": "workflow_test",
            "timestamp": "2025-08-26T13:15:00Z"
        }
        
        log_response = await client.post("/api/v1/artifacts/logs", json=log_data)
        assert log_response.status_code == 201
        
        # Step 5: Complete execution
        complete_status_response = await client.put(
            f"/api/v1/executions/{execution_id}/status?status=passed"
        )
        assert complete_status_response.status_code == 200
        
        # Step 6: Verify artifacts are associated
        execution_detail_response = await client.get(f"/api/v1/executions/{execution_id}")
        assert execution_detail_response.status_code == 200
        execution_detail = execution_detail_response.json()
        assert len(execution_detail["screenshots"]) == 1
        assert len(execution_detail["log_entries"]) == 1
        
        # Step 7: Get run analytics
        analytics_response = await client.get(f"/api/v1/executions/runs/{run_id}/analytics")
        assert analytics_response.status_code == 200
        analytics = analytics_response.json()
        assert analytics["total_executions"] == 1
        assert analytics["passed"] == 1
        assert analytics["failed"] == 0

    @pytest.mark.asyncio
    async def test_bulk_operations_workflow(self, client: AsyncClient):
        """Test bulk operations across multiple endpoints"""
        
        # Step 1: Bulk create test cases
        bulk_cases_data = [
            {
                "name": f"Bulk Test Case {i}",
                "description": f"Bulk created test case {i}",
                "status": "active",
                "priority": "medium",
                "tags": ["bulk", f"case_{i}"],
                "category": "bulk_test"
            }
            for i in range(5)
        ]
        
        bulk_create_response = await client.post("/api/v1/tests/bulk", json=bulk_cases_data)
        assert bulk_create_response.status_code == 200
        bulk_result = bulk_create_response.json()
        assert bulk_result["success_count"] == 5
        assert bulk_result["failure_count"] == 0
        
        # Step 2: Get all created test cases
        list_response = await client.get("/api/v1/tests/?category=bulk_test")
        assert list_response.status_code == 200
        test_cases = list_response.json()
        assert test_cases["total"] == 5
        
        # Step 3: Create a test suite for bulk operations
        suite_data = {
            "name": "Bulk Operations Suite",
            "description": "Suite for testing bulk operations",
            "tags": ["bulk"],
            "is_active": True
        }
        
        suite_response = await client.post("/api/v1/suites/", json=suite_data)
        assert suite_response.status_code == 201
        suite = suite_response.json()
        suite_id = suite["id"]
        
        # Step 4: Bulk add test cases to suite
        test_case_ids = [item["id"] for item in test_cases["items"]]
        bulk_add_response = await client.post(
            f"/api/v1/suites/{suite_id}/tests/bulk",
            json=test_case_ids
        )
        assert bulk_add_response.status_code == 200
        bulk_add_result = bulk_add_response.json()
        assert bulk_add_result["success_count"] == 5
        
        # Step 5: Verify suite has all test cases
        suite_with_tests_response = await client.get(f"/api/v1/suites/{suite_id}")
        assert suite_with_tests_response.status_code == 200
        suite_with_tests = suite_with_tests_response.json()
        assert len(suite_with_tests["test_cases"]) == 5

    @pytest.mark.asyncio
    async def test_configuration_and_environment_workflow(self, client: AsyncClient):
        """Test configuration and environment management workflow"""
        
        # Step 1: Create test environment
        env_data = {
            "name": "workflow_test_env",
            "description": "Environment for workflow testing",
            "base_url": "http://workflow-test.example.com",
            "environment_type": "testing",
            "is_active": True,
            "variables": {"TEST_MODE": "true", "DEBUG": "false"}
        }
        
        env_response = await client.post("/api/v1/configurations/environments", json=env_data)
        assert env_response.status_code == 201
        environment = env_response.json()
        env_id = environment["id"]
        
        # Step 2: Create multiple browser configurations
        browser_configs = [
            {
                "name": "Chrome Desktop Workflow",
                "browser_type": "chrome",
                "headless": False,
                "window_width": 1920,
                "window_height": 1080,
                "is_active": True
            },
            {
                "name": "Chrome Mobile Workflow",
                "browser_type": "chrome",
                "headless": True,
                "window_width": 375,
                "window_height": 667,
                "is_active": True
            },
            {
                "name": "Firefox Workflow",
                "browser_type": "firefox",
                "headless": True,
                "window_width": 1280,
                "window_height": 720,
                "is_active": True
            }
        ]
        
        created_configs = []
        for config_data in browser_configs:
            config_response = await client.post("/api/v1/configurations/browsers", json=config_data)
            assert config_response.status_code == 201
            created_configs.append(config_response.json())
        
        # Step 3: Set one as default
        default_config_id = created_configs[0]["id"]
        update_response = await client.put(
            f"/api/v1/configurations/browsers/{default_config_id}",
            json={"is_default": True}
        )
        assert update_response.status_code == 200
        
        # Step 4: Verify default configuration
        default_response = await client.get("/api/v1/configurations/browsers/default")
        assert default_response.status_code == 200
        default_config = default_response.json()
        assert default_config["id"] == default_config_id
        assert default_config["is_default"] is True
        
        # Step 5: Test environment health check
        health_response = await client.post(f"/api/v1/configurations/environments/{env_id}/health-check")
        assert health_response.status_code == 200
        health_data = health_response.json()
        assert health_data["environment_id"] == env_id
        assert "status" in health_data
        
        # Step 6: List configurations with filters
        chrome_configs_response = await client.get("/api/v1/configurations/browsers?browser_type=chrome")
        assert chrome_configs_response.status_code == 200
        chrome_configs = chrome_configs_response.json()
        assert chrome_configs["total"] == 2  # Two Chrome configs created
        
        firefox_configs_response = await client.get("/api/v1/configurations/browsers?browser_type=firefox")
        assert firefox_configs_response.status_code == 200
        firefox_configs = firefox_configs_response.json()
        assert firefox_configs["total"] == 1  # One Firefox config created

    @pytest.mark.asyncio
    async def test_error_handling_workflow(self, client: AsyncClient):
        """Test error handling across different endpoints"""
        
        # Step 1: Try to create test case with invalid data
        invalid_case_data = {
            "name": "",  # Empty name
            "priority": "invalid_priority",  # Invalid priority
            "expected_duration_seconds": -10  # Negative duration
        }
        
        invalid_response = await client.post("/api/v1/tests/", json=invalid_case_data)
        assert invalid_response.status_code == 422
        
        # Step 2: Try to access non-existent resources
        import uuid
        fake_id = str(uuid.uuid4())
        
        not_found_responses = [
            await client.get(f"/api/v1/tests/{fake_id}"),
            await client.get(f"/api/v1/suites/{fake_id}"),
            await client.get(f"/api/v1/executions/runs/{fake_id}"),
            await client.get(f"/api/v1/configurations/browsers/{fake_id}")
        ]
        
        for response in not_found_responses:
            assert response.status_code == 404
        
        # Step 3: Try to create duplicate environment name
        env_data = {
            "name": "duplicate_test_env",
            "base_url": "http://example.com",
            "environment_type": "testing"
        }
        
        first_env_response = await client.post("/api/v1/configurations/environments", json=env_data)
        assert first_env_response.status_code == 201
        
        duplicate_env_response = await client.post("/api/v1/configurations/environments", json=env_data)
        assert duplicate_env_response.status_code == 409  # Conflict
        
        # Step 4: Try to add non-existent test case to suite
        suite_data = {
            "name": "Error Test Suite",
            "description": "Suite for error testing"
        }
        
        suite_response = await client.post("/api/v1/suites/", json=suite_data)
        assert suite_response.status_code == 201
        suite_id = suite_response.json()["id"]
        
        add_fake_test_response = await client.post(f"/api/v1/suites/{suite_id}/tests/{fake_id}")
        assert add_fake_test_response.status_code == 404


class TestPerformanceIntegration:
    """Integration tests focused on performance"""

    @pytest.mark.asyncio
    async def test_large_dataset_operations(self, client: AsyncClient):
        """Test operations with large datasets"""
        import time
        
        # Create 50 test cases quickly
        start_time = time.time()
        
        bulk_data = [
            {
                "name": f"Performance Test {i}",
                "description": f"Performance test case {i}",
                "status": "active",
                "priority": "medium",
                "category": "performance"
            }
            for i in range(50)
        ]
        
        bulk_response = await client.post("/api/v1/tests/bulk", json=bulk_data)
        bulk_time = time.time() - start_time
        
        assert bulk_response.status_code == 200
        assert bulk_time < 5.0  # Should complete in under 5 seconds
        
        # List all test cases with pagination
        start_time = time.time()
        list_response = await client.get("/api/v1/tests/?limit=100")
        list_time = time.time() - start_time
        
        assert list_response.status_code == 200
        assert list_time < 1.0  # Should complete in under 1 second
        
        # Search across all test cases
        start_time = time.time()
        search_response = await client.get("/api/v1/tests/search?q=performance")
        search_time = time.time() - start_time
        
        assert search_response.status_code == 200
        assert search_time < 1.0  # Should complete in under 1 second