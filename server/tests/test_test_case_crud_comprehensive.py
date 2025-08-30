"""
Comprehensive test suite for test case CRUD operations and data consistency
Tests the complete lifecycle of test cases including edge cases and consistency
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4

from src.models.test_definition import TestCase, TestStep, TestCaseStatus, TestCasePriority


class TestTestCaseDataConsistency:
    """Test data consistency and immediate reflection of changes"""

    @pytest.mark.asyncio
    async def test_create_test_case_immediate_availability(self, client: AsyncClient, session: AsyncSession):
        """Test that newly created test case is immediately available in list"""
        test_data = {
            "name": "Immediate Availability Test",
            "description": "Test immediate availability after creation",
            "status": "active",
            "priority": "high",
            "tags": ["consistency", "test"],
            "author": "test_user",
            "category": "system"
        }
        
        # Create test case
        create_response = await client.post("/api/v1/tests/", json=test_data)
        assert create_response.status_code == 201
        created_test = create_response.json()
        
        # Immediately check if it appears in list endpoint
        list_response = await client.get("/api/v1/tests/")
        assert list_response.status_code == 200
        list_data = list_response.json()
        
        # Verify the newly created test appears in the list
        created_test_in_list = next(
            (item for item in list_data["items"] if item["id"] == created_test["id"]), 
            None
        )
        assert created_test_in_list is not None, "Newly created test case should appear in list immediately"
        assert created_test_in_list["name"] == test_data["name"]
        assert created_test_in_list["status"] == test_data["status"]
        
        # Also verify it's in the database
        db_result = await session.execute(select(TestCase).where(TestCase.id == created_test["id"]))
        db_test_case = db_result.scalar_one_or_none()
        assert db_test_case is not None
        assert db_test_case.name == test_data["name"]

    @pytest.mark.asyncio
    async def test_update_test_case_immediate_reflection(self, client: AsyncClient, sample_test_case):
        """Test that updates are immediately reflected in list and detail endpoints"""
        original_name = sample_test_case.name
        update_data = {
            "name": "Updated Name for Consistency Test",
            "description": "Updated description",
            "status": "inactive",
            "priority": "low"
        }
        
        # Update the test case
        update_response = await client.put(f"/api/v1/tests/{sample_test_case.id}", json=update_data)
        assert update_response.status_code == 200
        updated_test = update_response.json()
        assert updated_test["name"] == update_data["name"]
        
        # Check detail endpoint immediately
        detail_response = await client.get(f"/api/v1/tests/{sample_test_case.id}")
        assert detail_response.status_code == 200
        detail_data = detail_response.json()
        assert detail_data["name"] == update_data["name"]
        assert detail_data["status"] == update_data["status"]
        assert detail_data["priority"] == update_data["priority"]
        
        # Check list endpoint immediately
        list_response = await client.get("/api/v1/tests/")
        assert list_response.status_code == 200
        list_data = list_response.json()
        
        updated_test_in_list = next(
            (item for item in list_data["items"] if item["id"] == str(sample_test_case.id)), 
            None
        )
        assert updated_test_in_list is not None
        assert updated_test_in_list["name"] == update_data["name"]
        assert updated_test_in_list["name"] != original_name

    @pytest.mark.asyncio
    async def test_delete_test_case_immediate_removal(self, client: AsyncClient, session: AsyncSession):
        """Test that deleted test case is immediately removed from lists"""
        # Create a test case first
        test_data = {
            "name": "Test Case to Delete",
            "description": "This will be deleted",
            "status": "active",
            "priority": "medium"
        }
        
        create_response = await client.post("/api/v1/tests/", json=test_data)
        assert create_response.status_code == 201
        created_test = create_response.json()
        test_id = created_test["id"]
        
        # Verify it exists in list
        list_response = await client.get("/api/v1/tests/")
        list_data = list_response.json()
        assert any(item["id"] == test_id for item in list_data["items"])
        
        # Delete the test case
        delete_response = await client.delete(f"/api/v1/tests/{test_id}")
        assert delete_response.status_code == 204
        
        # Verify it's immediately removed from list
        updated_list_response = await client.get("/api/v1/tests/")
        updated_list_data = updated_list_response.json()
        assert not any(item["id"] == test_id for item in updated_list_data["items"])
        
        # Verify it's actually deleted from database
        db_result = await session.execute(select(TestCase).where(TestCase.id == test_id))
        db_test_case = db_result.scalar_one_or_none()
        assert db_test_case is None

    @pytest.mark.asyncio
    async def test_create_with_steps_consistency(self, client: AsyncClient):
        """Test creating test case with steps and verifying step count consistency"""
        # Create test case
        test_data = {
            "name": "Test Case with Steps",
            "description": "Test with immediate step creation",
            "status": "active",
            "priority": "high"
        }
        
        create_response = await client.post("/api/v1/tests/", json=test_data)
        assert create_response.status_code == 201
        test_case = create_response.json()
        test_id = test_case["id"]
        
        # Add steps immediately
        steps_data = [
            {
                "order_index": 1,
                "name": "Step 1",
                "step_type": "navigate",
                "input_data": "/test",
                "expected_result": "Page loads"
            },
            {
                "order_index": 2,
                "name": "Step 2",
                "step_type": "click",
                "selector": "#button",
                "expected_result": "Button clicked"
            }
        ]
        
        for step_data in steps_data:
            step_response = await client.post(f"/api/v1/tests/{test_id}/steps", json=step_data)
            assert step_response.status_code == 201
        
        # Check that test case detail shows correct step count
        detail_response = await client.get(f"/api/v1/tests/{test_id}")
        assert detail_response.status_code == 200
        detail_data = detail_response.json()
        assert len(detail_data["steps"]) == 2
        
        # Check that list view shows correct step count
        list_response = await client.get("/api/v1/tests/")
        list_data = list_response.json()
        test_in_list = next((item for item in list_data["items"] if item["id"] == test_id), None)
        assert test_in_list is not None
        assert test_in_list["step_count"] == 2


class TestTestCaseEdgeCases:
    """Test edge cases and error conditions"""

    @pytest.mark.asyncio
    async def test_create_test_case_with_all_optional_fields(self, client: AsyncClient):
        """Test creating test case with all optional fields populated"""
        test_data = {
            "name": "Comprehensive Test Case",
            "description": "Test case with all fields",
            "status": "draft",
            "priority": "critical",
            "tags": ["comprehensive", "full-featured", "test"],
            "test_metadata": {
                "environment": "production",
                "browser": "chrome",
                "version": "1.0.0"
            },
            "author": "test_author",
            "category": "integration",
            "expected_duration_seconds": 120,
            "is_automated": True,
            "retry_count": 3
        }
        
        response = await client.post("/api/v1/tests/", json=test_data)
        assert response.status_code == 201
        
        created_test = response.json()
        assert created_test["name"] == test_data["name"]
        assert created_test["tags"] == test_data["tags"]
        assert created_test["test_metadata"] == test_data["test_metadata"]
        assert created_test["expected_duration_seconds"] == test_data["expected_duration_seconds"]
        assert created_test["retry_count"] == test_data["retry_count"]

    @pytest.mark.asyncio
    async def test_create_test_case_minimal_required_fields(self, client: AsyncClient):
        """Test creating test case with only required fields"""
        test_data = {
            "name": "Minimal Test Case"
        }
        
        response = await client.post("/api/v1/tests/", json=test_data)
        assert response.status_code == 201
        
        created_test = response.json()
        assert created_test["name"] == test_data["name"]
        assert created_test["status"] == "draft"  # Default value
        assert created_test["priority"] == "medium"  # Default value
        assert created_test["is_automated"] == True  # Default value
        assert created_test["retry_count"] == 0  # Default value

    @pytest.mark.asyncio
    async def test_create_test_case_invalid_enum_values(self, client: AsyncClient):
        """Test validation of enum fields"""
        invalid_status_data = {
            "name": "Test with Invalid Status",
            "status": "invalid_status"
        }
        
        response = await client.post("/api/v1/tests/", json=invalid_status_data)
        assert response.status_code == 422
        
        invalid_priority_data = {
            "name": "Test with Invalid Priority",
            "priority": "invalid_priority"
        }
        
        response = await client.post("/api/v1/tests/", json=invalid_priority_data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_nonexistent_test_case(self, client: AsyncClient):
        """Test updating a test case that doesn't exist"""
        fake_id = str(uuid4())
        update_data = {
            "name": "Updated Name"
        }
        
        response = await client.put(f"/api/v1/tests/{fake_id}", json=update_data)
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_partial_update_test_case(self, client: AsyncClient, sample_test_case):
        """Test partial updates only modify specified fields"""
        original_description = sample_test_case.description
        original_status = sample_test_case.status
        
        # Update only name and priority
        update_data = {
            "name": "Partially Updated Test",
            "priority": "critical"
        }
        
        response = await client.put(f"/api/v1/tests/{sample_test_case.id}", json=update_data)
        assert response.status_code == 200
        
        updated_test = response.json()
        assert updated_test["name"] == update_data["name"]
        assert updated_test["priority"] == update_data["priority"]
        # Other fields should remain unchanged
        assert updated_test["description"] == original_description
        assert updated_test["status"] == original_status


class TestTestCaseFiltersAndSearch:
    """Test filtering and search functionality with data consistency"""

    @pytest.mark.asyncio
    async def test_filter_by_status_immediate_effect(self, client: AsyncClient):
        """Test that status filters work immediately after status changes"""
        # Create test cases with different statuses
        test_cases_data = [
            {"name": "Active Test 1", "status": "active"},
            {"name": "Draft Test 1", "status": "draft"},
            {"name": "Inactive Test 1", "status": "inactive"}
        ]
        
        created_ids = []
        for test_data in test_cases_data:
            response = await client.post("/api/v1/tests/", json=test_data)
            assert response.status_code == 201
            created_ids.append(response.json()["id"])
        
        # Test filtering by active status
        response = await client.get("/api/v1/tests/?status=active")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all returned items have active status
        for item in data["items"]:
            assert item["status"] == "active"
        
        # Update one test case status and verify filter reflects change
        update_response = await client.put(
            f"/api/v1/tests/{created_ids[1]}", 
            json={"status": "active"}
        )
        assert update_response.status_code == 200
        
        # Check that filter now includes the updated test case
        updated_response = await client.get("/api/v1/tests/?status=active")
        updated_data = updated_response.json()
        
        active_names = [item["name"] for item in updated_data["items"]]
        assert "Draft Test 1" in active_names

    @pytest.mark.asyncio
    async def test_search_immediate_effect(self, client: AsyncClient):
        """Test that search includes newly created items immediately"""
        unique_term = f"SearchTest{uuid4().hex[:8]}"
        
        # Create test case with unique searchable content
        test_data = {
            "name": f"Test Case with {unique_term}",
            "description": f"Description containing {unique_term}",
            "status": "active"
        }
        
        create_response = await client.post("/api/v1/tests/", json=test_data)
        assert create_response.status_code == 201
        
        # Immediately search for the unique term
        search_response = await client.get(f"/api/v1/tests/search?q={unique_term}")
        assert search_response.status_code == 200
        search_data = search_response.json()
        
        # Verify the newly created test case appears in search results
        assert search_data["total"] >= 1
        found_item = next(
            (item for item in search_data["items"] if unique_term in item["name"]), 
            None
        )
        assert found_item is not None
        assert found_item["name"] == test_data["name"]


class TestTestCaseConcurrency:
    """Test concurrent operations and data consistency"""

    @pytest.mark.asyncio
    async def test_concurrent_updates_same_test_case(self, client: AsyncClient, sample_test_case):
        """Test that concurrent updates maintain data consistency"""
        import asyncio
        
        # Define different update operations
        update1 = {"name": "Concurrent Update 1", "priority": "high"}
        update2 = {"description": "Concurrent description update", "status": "inactive"}
        
        # Execute updates concurrently
        tasks = [
            client.put(f"/api/v1/tests/{sample_test_case.id}", json=update1),
            client.put(f"/api/v1/tests/{sample_test_case.id}", json=update2)
        ]
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Both requests should succeed (last one wins for conflicting fields)
        for response in responses:
            if not isinstance(response, Exception):
                assert response.status_code == 200
        
        # Verify final state is consistent
        final_response = await client.get(f"/api/v1/tests/{sample_test_case.id}")
        assert final_response.status_code == 200
        final_data = final_response.json()
        
        # The final state should be consistent (contain updates from last successful operation)
        assert final_data["id"] == str(sample_test_case.id)

    @pytest.mark.asyncio
    async def test_create_and_list_consistency(self, client: AsyncClient):
        """Test that list operations are consistent during rapid creates"""
        import asyncio
        
        base_name = f"ConcurrentTest{uuid4().hex[:8]}"
        
        # Create multiple test cases concurrently
        create_tasks = []
        for i in range(5):
            test_data = {
                "name": f"{base_name} {i}",
                "status": "active",
                "priority": "medium"
            }
            create_tasks.append(client.post("/api/v1/tests/", json=test_data))
        
        # Execute all creates concurrently
        create_responses = await asyncio.gather(*create_tasks, return_exceptions=True)
        
        # Count successful creates
        successful_creates = 0
        created_ids = []
        for response in create_responses:
            if not isinstance(response, Exception) and response.status_code == 201:
                successful_creates += 1
                created_ids.append(response.json()["id"])
        
        # Verify list endpoint shows all created test cases
        list_response = await client.get("/api/v1/tests/")
        assert list_response.status_code == 200
        list_data = list_response.json()
        
        # Check that all successfully created test cases appear in the list
        list_ids = [item["id"] for item in list_data["items"]]
        for created_id in created_ids:
            assert created_id in list_ids


class TestTestCaseBusinessLogic:
    """Test business logic and complex scenarios"""

    @pytest.mark.asyncio
    async def test_test_case_with_complex_metadata(self, client: AsyncClient):
        """Test handling of complex metadata structures"""
        complex_metadata = {
            "browsers": ["chrome", "firefox", "safari"],
            "environments": {
                "staging": {"url": "https://staging.example.com", "auth": "token123"},
                "production": {"url": "https://prod.example.com", "auth": "token456"}
            },
            "configuration": {
                "timeout": 30000,
                "retries": 3,
                "screenshot_on_failure": True,
                "custom_headers": {
                    "X-Test-Session": "automated",
                    "User-Agent": "TestBot/1.0"
                }
            }
        }
        
        test_data = {
            "name": "Complex Metadata Test",
            "description": "Test with complex metadata structure",
            "test_metadata": complex_metadata,
            "status": "active"
        }
        
        create_response = await client.post("/api/v1/tests/", json=test_data)
        assert create_response.status_code == 201
        
        created_test = create_response.json()
        assert created_test["test_metadata"] == complex_metadata
        
        # Verify retrieval maintains metadata structure
        get_response = await client.get(f"/api/v1/tests/{created_test['id']}")
        assert get_response.status_code == 200
        retrieved_test = get_response.json()
        assert retrieved_test["test_metadata"] == complex_metadata

    @pytest.mark.asyncio
    async def test_test_case_tags_operations(self, client: AsyncClient):
        """Test tag-based operations and filtering"""
        # Create test cases with various tag combinations
        test_cases = [
            {"name": "Login Test", "tags": ["auth", "login", "critical"]},
            {"name": "Registration Test", "tags": ["auth", "signup", "medium"]},
            {"name": "Search Test", "tags": ["search", "feature", "low"]},
            {"name": "Payment Test", "tags": ["payment", "critical", "ecommerce"]}
        ]
        
        created_ids = []
        for test_data in test_cases:
            response = await client.post("/api/v1/tests/", json=test_data)
            assert response.status_code == 201
            created_ids.append(response.json()["id"])
        
        # Test filtering by single tag
        auth_response = await client.get("/api/v1/tests/?tags=auth")
        assert auth_response.status_code == 200
        auth_data = auth_response.json()
        
        # Should return tests with auth tag
        auth_names = [item["name"] for item in auth_data["items"]]
        assert "Login Test" in auth_names
        assert "Registration Test" in auth_names
        assert "Search Test" not in auth_names

    @pytest.mark.asyncio
    async def test_step_count_accuracy(self, client: AsyncClient):
        """Test that step_count in list view is always accurate"""
        # Create test case
        test_data = {"name": "Step Count Test", "status": "active"}
        create_response = await client.post("/api/v1/tests/", json=test_data)
        test_id = create_response.json()["id"]
        
        # Initially should have 0 steps
        list_response = await client.get("/api/v1/tests/")
        test_in_list = next(item for item in list_response.json()["items"] if item["id"] == test_id)
        assert test_in_list["step_count"] == 0
        
        # Add 3 steps
        for i in range(3):
            step_data = {
                "order_index": i + 1,
                "name": f"Step {i + 1}",
                "step_type": "click",
                "expected_result": f"Step {i + 1} executed"
            }
            await client.post(f"/api/v1/tests/{test_id}/steps", json=step_data)
        
        # Check that step count is updated to 3
        updated_list_response = await client.get("/api/v1/tests/")
        updated_test_in_list = next(
            item for item in updated_list_response.json()["items"] 
            if item["id"] == test_id
        )
        assert updated_test_in_list["step_count"] == 3
        
        # Delete one step
        steps_response = await client.get(f"/api/v1/tests/{test_id}/steps")
        steps = steps_response.json()
        await client.delete(f"/api/v1/tests/{test_id}/steps/{steps[0]['id']}")
        
        # Check that step count is updated to 2
        final_list_response = await client.get("/api/v1/tests/")
        final_test_in_list = next(
            item for item in final_list_response.json()["items"] 
            if item["id"] == test_id
        )
        assert final_test_in_list["step_count"] == 2