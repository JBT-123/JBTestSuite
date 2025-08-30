"""
Test suite for /api/v1/tests endpoints
Comprehensive testing of test case and test step management
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.test_definition import TestCase, TestStep


class TestTestCaseAPI:
    """Test case management API tests"""

    @pytest.mark.asyncio
    async def test_create_test_case(self, client: AsyncClient):
        """Test creating a new test case"""
        test_data = {
            "name": "Test Login Functionality",
            "description": "Test user login with valid credentials",
            "status": "active",
            "priority": "high",
            "tags": ["login", "authentication"],
            "author": "test_user",
            "category": "authentication",
            "expected_duration_seconds": 30,
            "is_automated": True,
            "retry_count": 2
        }
        
        response = await client.post("/api/v1/tests/", json=test_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == test_data["name"]
        assert data["status"] == test_data["status"]
        assert data["priority"] == test_data["priority"]
        assert data["tags"] == test_data["tags"]
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    @pytest.mark.asyncio
    async def test_get_test_case(self, client: AsyncClient, sample_test_case):
        """Test retrieving a specific test case"""
        response = await client.get(f"/api/v1/tests/{sample_test_case.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(sample_test_case.id)
        assert data["name"] == sample_test_case.name
        assert data["description"] == sample_test_case.description

    @pytest.mark.asyncio
    async def test_get_test_case_not_found(self, client: AsyncClient):
        """Test getting non-existent test case returns 404"""
        import uuid
        fake_id = uuid.uuid4()
        
        response = await client.get(f"/api/v1/tests/{fake_id}")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_update_test_case(self, client: AsyncClient, sample_test_case):
        """Test updating a test case"""
        update_data = {
            "name": "Updated Test Name",
            "description": "Updated description",
            "status": "inactive",
            "priority": "low"
        }
        
        response = await client.put(f"/api/v1/tests/{sample_test_case.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["status"] == update_data["status"]
        assert data["priority"] == update_data["priority"]

    @pytest.mark.asyncio
    async def test_delete_test_case(self, client: AsyncClient, sample_test_case):
        """Test deleting a test case"""
        response = await client.delete(f"/api/v1/tests/{sample_test_case.id}")
        
        assert response.status_code == 204
        
        # Verify it's deleted
        get_response = await client.get(f"/api/v1/tests/{sample_test_case.id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_list_test_cases(self, client: AsyncClient, sample_test_cases):
        """Test listing test cases with pagination"""
        response = await client.get("/api/v1/tests/")
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "pages" in data
        assert len(data["items"]) <= data["limit"]
        assert data["total"] >= len(sample_test_cases)

    @pytest.mark.asyncio
    async def test_list_test_cases_with_filters(self, client: AsyncClient, sample_test_cases):
        """Test listing test cases with filters"""
        # Filter by status
        response = await client.get("/api/v1/tests/?status=active")
        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["status"] == "active"
        
        # Filter by priority
        response = await client.get("/api/v1/tests/?priority=high")
        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["priority"] == "high"

    @pytest.mark.asyncio
    async def test_list_test_cases_with_pagination(self, client: AsyncClient, sample_test_cases):
        """Test pagination parameters"""
        # Test page 1 with limit 2
        response = await client.get("/api/v1/tests/?page=1&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["limit"] == 2
        assert len(data["items"]) <= 2
        
        # Test page 2
        if data["pages"] > 1:
            response = await client.get("/api/v1/tests/?page=2&limit=2")
            assert response.status_code == 200
            page2_data = response.json()
            assert page2_data["page"] == 2

    @pytest.mark.asyncio
    async def test_search_test_cases(self, client: AsyncClient, sample_test_cases):
        """Test searching test cases"""
        response = await client.get("/api/v1/tests/search?q=login")
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        
        # All results should contain 'login' in name or description
        for item in data["items"]:
            assert ("login" in item["name"].lower() or 
                   (item["description"] and "login" in item["description"].lower()))

    @pytest.mark.asyncio
    async def test_bulk_create_test_cases(self, client: AsyncClient):
        """Test bulk creating test cases"""
        test_cases_data = [
            {
                "name": "Bulk Test 1",
                "description": "First bulk test",
                "status": "active",
                "priority": "medium"
            },
            {
                "name": "Bulk Test 2", 
                "description": "Second bulk test",
                "status": "active",
                "priority": "low"
            }
        ]
        
        response = await client.post("/api/v1/tests/bulk", json=test_cases_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 2
        assert data["failure_count"] == 0
        assert data["total_count"] == 2


class TestTestStepAPI:
    """Test step management API tests"""

    @pytest.mark.asyncio
    async def test_create_test_step(self, client: AsyncClient, sample_test_case):
        """Test creating a test step"""
        step_data = {
            "order_index": 1,
            "name": "Navigate to login page",
            "description": "Navigate to the login page",
            "step_type": "navigate",
            "selector": None,
            "input_data": "/login",
            "expected_result": "Login page loads successfully",
            "timeout_seconds": 30,
            "is_optional": False,
            "continue_on_failure": False
        }
        
        response = await client.post(f"/api/v1/tests/{sample_test_case.id}/steps", json=step_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == step_data["name"]
        assert data["step_type"] == step_data["step_type"]
        assert data["test_case_id"] == str(sample_test_case.id)

    @pytest.mark.asyncio
    async def test_get_test_steps(self, client: AsyncClient, sample_test_case_with_steps):
        """Test retrieving test steps"""
        test_case, steps = sample_test_case_with_steps
        
        response = await client.get(f"/api/v1/tests/{test_case.id}/steps")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == len(steps)
        
        # Verify steps are ordered correctly
        for i, step_data in enumerate(data):
            assert step_data["order_index"] == i + 1

    @pytest.mark.asyncio
    async def test_update_test_step(self, client: AsyncClient, sample_test_case_with_steps):
        """Test updating a test step"""
        test_case, steps = sample_test_case_with_steps
        step_to_update = steps[0]
        
        update_data = {
            "name": "Updated Step Name",
            "description": "Updated description",
            "timeout_seconds": 60
        }
        
        response = await client.put(
            f"/api/v1/tests/{test_case.id}/steps/{step_to_update.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["timeout_seconds"] == update_data["timeout_seconds"]

    @pytest.mark.asyncio
    async def test_delete_test_step(self, client: AsyncClient, sample_test_case_with_steps):
        """Test deleting a test step"""
        test_case, steps = sample_test_case_with_steps
        step_to_delete = steps[0]
        
        response = await client.delete(
            f"/api/v1/tests/{test_case.id}/steps/{step_to_delete.id}"
        )
        
        assert response.status_code == 204
        
        # Verify step count decreased
        get_response = await client.get(f"/api/v1/tests/{test_case.id}/steps")
        assert get_response.status_code == 200
        remaining_steps = get_response.json()
        assert len(remaining_steps) == len(steps) - 1


class TestTestCaseValidation:
    """Test input validation and error handling"""

    @pytest.mark.asyncio
    async def test_create_test_case_invalid_data(self, client: AsyncClient):
        """Test creating test case with invalid data"""
        invalid_data = {
            "name": "",  # Empty name should be invalid
            "priority": "invalid_priority",  # Invalid priority
            "expected_duration_seconds": -5  # Negative duration
        }
        
        response = await client.post("/api/v1/tests/", json=invalid_data)
        
        assert response.status_code == 422
        error_data = response.json()
        assert "detail" in error_data

    @pytest.mark.asyncio
    async def test_create_step_invalid_order(self, client: AsyncClient, sample_test_case):
        """Test creating step with invalid order index"""
        step_data = {
            "order_index": -1,  # Negative order should be invalid
            "name": "Invalid Step",
            "step_type": "click"
        }
        
        response = await client.post(f"/api/v1/tests/{sample_test_case.id}/steps", json=step_data)
        
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_step_nonexistent_test_case(self, client: AsyncClient):
        """Test creating step for non-existent test case"""
        import uuid
        fake_id = uuid.uuid4()
        
        step_data = {
            "order_index": 1,
            "name": "Test Step",
            "step_type": "click"
        }
        
        response = await client.post(f"/api/v1/tests/{fake_id}/steps", json=step_data)
        
        assert response.status_code == 404


class TestAPIPerformance:
    """Performance and load testing for APIs"""

    @pytest.mark.asyncio
    async def test_list_performance_large_dataset(self, client: AsyncClient, many_test_cases):
        """Test list performance with large dataset"""
        import time
        
        start_time = time.time()
        response = await client.get("/api/v1/tests/?limit=100")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 1.0  # Should complete in under 1 second
        
        data = response.json()
        assert len(data["items"]) <= 100
        assert data["total"] >= len(many_test_cases)

    @pytest.mark.asyncio
    async def test_search_performance(self, client: AsyncClient, many_test_cases):
        """Test search performance"""
        import time
        
        start_time = time.time()
        response = await client.get("/api/v1/tests/search?q=test")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 1.0  # Should complete in under 1 second