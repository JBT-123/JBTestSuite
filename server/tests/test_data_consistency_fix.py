"""
Test suite specifically for verifying the data consistency fix
Tests the exact scenario described: create test case -> save test case -> dashboard -> tests
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.test_definition import TestCase


class TestDataConsistencyFix:
    """Test the exact workflow that was causing issues"""

    @pytest.mark.asyncio
    async def test_create_save_dashboard_workflow(self, client: AsyncClient, session: AsyncSession):
        """
        Test the exact workflow: create test case -> save test case -> dashboard -> tests
        This should now show changes immediately
        """
        # Step 1: Create test case
        test_data = {
            "name": "Data Consistency Test Case",
            "description": "Testing the fix for immediate data reflection",
            "status": "active",
            "priority": "high",
            "tags": ["consistency-fix", "workflow-test"],
            "author": "test_user",
            "category": "system-test"
        }
        
        create_response = await client.post("/api/v1/tests/", json=test_data)
        assert create_response.status_code == 201
        created_test = create_response.json()
        test_id = created_test["id"]
        
        print(f"✅ Step 1 - Created test case with ID: {test_id}")
        
        # Step 2: Save test case (simulate update/save operation)
        update_data = {
            "name": "Updated Data Consistency Test Case",
            "description": "Updated description after save",
            "status": "active",
            "priority": "critical"
        }
        
        update_response = await client.put(f"/api/v1/tests/{test_id}", json=update_data)
        assert update_response.status_code == 200
        updated_test = update_response.json()
        
        print(f"✅ Step 2 - Updated/saved test case: {updated_test['name']}")
        
        # Step 3: Check dashboard (list endpoint) immediately
        dashboard_response = await client.get("/api/v1/tests/")
        assert dashboard_response.status_code == 200
        dashboard_data = dashboard_response.json()
        
        # The updated test case should be in the dashboard results immediately
        test_in_dashboard = next(
            (item for item in dashboard_data["items"] if item["id"] == test_id), 
            None
        )
        
        assert test_in_dashboard is not None, f"Test case {test_id} should appear in dashboard immediately"
        assert test_in_dashboard["name"] == update_data["name"], "Dashboard should show updated name immediately"
        assert test_in_dashboard["priority"] == update_data["priority"], "Dashboard should show updated priority immediately"
        
        print(f"✅ Step 3 - Dashboard shows updated data: {test_in_dashboard['name']}")
        
        # Step 4: Verify individual test endpoint also shows changes
        individual_response = await client.get(f"/api/v1/tests/{test_id}")
        assert individual_response.status_code == 200
        individual_data = individual_response.json()
        
        assert individual_data["name"] == update_data["name"]
        assert individual_data["description"] == update_data["description"] 
        assert individual_data["priority"] == update_data["priority"]
        
        print(f"✅ Step 4 - Individual endpoint shows updated data: {individual_data['name']}")
        
        # Step 5: Verify database consistency
        db_result = await session.execute(select(TestCase).where(TestCase.id == test_id))
        db_test_case = db_result.scalar_one_or_none()
        
        assert db_test_case is not None
        assert db_test_case.name == update_data["name"]
        assert db_test_case.description == update_data["description"]
        assert db_test_case.priority.value == update_data["priority"]
        
        print(f"✅ Step 5 - Database shows consistent data: {db_test_case.name}")
        
        print("🎉 All steps passed - data consistency issue is FIXED!")

    @pytest.mark.asyncio
    async def test_create_with_steps_workflow(self, client: AsyncClient):
        """
        Test creating test case with steps and verifying step count is immediately reflected
        """
        # Create test case
        test_data = {
            "name": "Test Case with Steps Workflow",
            "description": "Testing step count consistency",
            "status": "active"
        }
        
        create_response = await client.post("/api/v1/tests/", json=test_data)
        assert create_response.status_code == 201
        test_case = create_response.json()
        test_id = test_case["id"]
        
        # Initially should show 0 steps in dashboard
        initial_dashboard = await client.get("/api/v1/tests/")
        initial_test = next(item for item in initial_dashboard.json()["items"] if item["id"] == test_id)
        assert initial_test["step_count"] == 0
        
        # Add steps
        step_data = {
            "order_index": 1,
            "name": "Test Step 1",
            "step_type": "navigate",
            "input_data": "/test-page",
            "expected_result": "Page loads successfully"
        }
        
        step_response = await client.post(f"/api/v1/tests/{test_id}/steps", json=step_data)
        assert step_response.status_code == 201
        
        # Dashboard should immediately show step count = 1
        updated_dashboard = await client.get("/api/v1/tests/")
        updated_test = next(item for item in updated_dashboard.json()["items"] if item["id"] == test_id)
        assert updated_test["step_count"] == 1, "Step count should be updated immediately in dashboard"
        
        # Add another step
        step_data_2 = {
            "order_index": 2,
            "name": "Test Step 2", 
            "step_type": "click",
            "selector": "#submit-btn",
            "expected_result": "Button is clicked"
        }
        
        step_response_2 = await client.post(f"/api/v1/tests/{test_id}/steps", json=step_data_2)
        assert step_response_2.status_code == 201
        
        # Dashboard should immediately show step count = 2
        final_dashboard = await client.get("/api/v1/tests/")
        final_test = next(item for item in final_dashboard.json()["items"] if item["id"] == test_id)
        assert final_test["step_count"] == 2, "Step count should be updated immediately after adding second step"
        
        print("🎉 Step count consistency test passed!")

    @pytest.mark.asyncio 
    async def test_multiple_rapid_operations_consistency(self, client: AsyncClient):
        """
        Test rapid create/update operations maintain consistency
        """
        # Create test case
        test_data = {
            "name": "Rapid Operations Test",
            "status": "draft",
            "priority": "low"
        }
        
        create_response = await client.post("/api/v1/tests/", json=test_data)
        test_id = create_response.json()["id"]
        
        # Rapid updates
        updates = [
            {"name": "Rapid Update 1", "status": "active"},
            {"name": "Rapid Update 2", "priority": "medium"}, 
            {"name": "Rapid Update 3", "status": "inactive", "priority": "high"},
            {"name": "Final Rapid Update", "description": "Final state"}
        ]
        
        for i, update_data in enumerate(updates):
            update_response = await client.put(f"/api/v1/tests/{test_id}", json=update_data)
            assert update_response.status_code == 200
            
            # Check that dashboard reflects each update immediately
            dashboard_response = await client.get("/api/v1/tests/")
            dashboard_test = next(
                item for item in dashboard_response.json()["items"] if item["id"] == test_id
            )
            
            # Verify the last update is reflected
            if "name" in update_data:
                assert dashboard_test["name"] == update_data["name"]
            if "status" in update_data:
                assert dashboard_test["status"] == update_data["status"]
            if "priority" in update_data:
                assert dashboard_test["priority"] == update_data["priority"]
            
            print(f"✅ Update {i+1} immediately reflected in dashboard")
        
        print("🎉 Rapid operations consistency test passed!")

    @pytest.mark.asyncio
    async def test_filter_consistency_after_updates(self, client: AsyncClient):
        """
        Test that filters work correctly immediately after updates
        """
        # Create test cases with different statuses
        test_cases = [
            {"name": "Active Test 1", "status": "active", "category": "auth"},
            {"name": "Draft Test 1", "status": "draft", "category": "feature"},
            {"name": "Inactive Test 1", "status": "inactive", "category": "auth"}
        ]
        
        created_ids = []
        for test_data in test_cases:
            response = await client.post("/api/v1/tests/", json=test_data)
            created_ids.append(response.json()["id"])
        
        # Test filtering by status=active
        active_response = await client.get("/api/v1/tests/?status=active")
        active_data = active_response.json()
        active_count_before = len([item for item in active_data["items"] if item["status"] == "active"])
        
        # Update one draft test to active
        update_response = await client.put(
            f"/api/v1/tests/{created_ids[1]}", 
            json={"status": "active"}
        )
        assert update_response.status_code == 200
        
        # Filter should immediately show the updated test
        updated_active_response = await client.get("/api/v1/tests/?status=active") 
        updated_active_data = updated_active_response.json()
        active_count_after = len([item for item in updated_active_data["items"] if item["status"] == "active"])
        
        assert active_count_after == active_count_before + 1, "Filter should immediately reflect status change"
        
        # Verify the updated test appears in active filter
        updated_test_in_active = next(
            (item for item in updated_active_data["items"] if item["id"] == created_ids[1]), 
            None
        )
        assert updated_test_in_active is not None, "Updated test should appear in active filter immediately"
        assert updated_test_in_active["status"] == "active"
        
        print("🎉 Filter consistency test passed!")