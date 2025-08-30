#!/usr/bin/env python3
"""
Manual test script to verify the data consistency fix
Run this script to test the exact workflow: create test case -> save test case -> dashboard -> tests

Usage:
    python test_data_consistency_manual.py
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime


class DataConsistencyTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def create_test_case(self, data):
        """Create a new test case"""
        url = f"{self.base_url}/api/v1/tests/"
        async with self.session.post(url, json=data) as response:
            if response.status != 201:
                text = await response.text()
                raise Exception(f"Failed to create test case: {response.status} - {text}")
            return await response.json()
    
    async def update_test_case(self, test_id, data):
        """Update/save a test case"""
        url = f"{self.base_url}/api/v1/tests/{test_id}"
        async with self.session.put(url, json=data) as response:
            if response.status != 200:
                text = await response.text()
                raise Exception(f"Failed to update test case: {response.status} - {text}")
            return await response.json()
    
    async def get_test_case_list(self):
        """Get test case list (dashboard view)"""
        url = f"{self.base_url}/api/v1/tests/"
        async with self.session.get(url) as response:
            if response.status != 200:
                text = await response.text()
                raise Exception(f"Failed to get test case list: {response.status} - {text}")
            return await response.json()
    
    async def get_test_case_detail(self, test_id):
        """Get individual test case detail"""
        url = f"{self.base_url}/api/v1/tests/{test_id}"
        async with self.session.get(url) as response:
            if response.status != 200:
                text = await response.text()
                raise Exception(f"Failed to get test case detail: {response.status} - {text}")
            return await response.json()
    
    async def add_test_step(self, test_id, step_data):
        """Add a step to test case"""
        url = f"{self.base_url}/api/v1/tests/{test_id}/steps"
        async with self.session.post(url, json=step_data) as response:
            if response.status != 201:
                text = await response.text()
                raise Exception(f"Failed to add test step: {response.status} - {text}")
            return await response.json()
    
    def print_status(self, step, message, success=True):
        """Print colored status message"""
        status = "✅" if success else "❌"
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status} Step {step}: {message}")
    
    def print_separator(self, title):
        """Print section separator"""
        print(f"\n{'='*60}")
        print(f"  {title}")
        print('='*60)
    
    async def test_basic_create_update_workflow(self):
        """Test the basic create -> update -> dashboard workflow"""
        self.print_separator("BASIC CREATE-UPDATE-DASHBOARD WORKFLOW TEST")
        
        # Step 1: Create test case
        test_data = {
            "name": f"Data Consistency Test {int(time.time())}",
            "description": "Testing immediate data reflection after operations",
            "status": "draft",
            "priority": "medium",
            "tags": ["consistency-test", "workflow"],
            "author": "manual-tester",
            "category": "system-test"
        }
        
        created_test = await self.create_test_case(test_data)
        test_id = created_test["id"]
        self.print_status(1, f"Created test case: {created_test['name']} (ID: {test_id})")
        
        # Step 2: Verify it appears in dashboard immediately
        dashboard_data = await self.get_test_case_list()
        test_in_dashboard = next(
            (item for item in dashboard_data["items"] if item["id"] == test_id), 
            None
        )
        
        if test_in_dashboard:
            self.print_status(2, f"✓ Test case found in dashboard: {test_in_dashboard['name']}")
        else:
            self.print_status(2, "✗ Test case NOT found in dashboard immediately after creation", False)
            return False
        
        # Step 3: Update/save the test case
        update_data = {
            "name": f"UPDATED - Data Consistency Test {int(time.time())}",
            "description": "Updated description after save operation",
            "status": "active",
            "priority": "high"
        }
        
        updated_test = await self.update_test_case(test_id, update_data)
        self.print_status(3, f"Updated test case: {updated_test['name']}")
        
        # Step 4: Check dashboard immediately for updates
        dashboard_data_after = await self.get_test_case_list()
        updated_test_in_dashboard = next(
            (item for item in dashboard_data_after["items"] if item["id"] == test_id), 
            None
        )
        
        if updated_test_in_dashboard:
            if updated_test_in_dashboard["name"] == update_data["name"]:
                self.print_status(4, "✓ Dashboard shows updated name immediately")
            else:
                self.print_status(4, f"✗ Dashboard shows old name: {updated_test_in_dashboard['name']} vs expected: {update_data['name']}", False)
                return False
            
            if updated_test_in_dashboard["status"] == update_data["status"]:
                self.print_status(4, "✓ Dashboard shows updated status immediately")  
            else:
                self.print_status(4, f"✗ Dashboard shows old status: {updated_test_in_dashboard['status']} vs expected: {update_data['status']}", False)
                return False
                
            if updated_test_in_dashboard["priority"] == update_data["priority"]:
                self.print_status(4, "✓ Dashboard shows updated priority immediately")
            else:
                self.print_status(4, f"✗ Dashboard shows old priority: {updated_test_in_dashboard['priority']} vs expected: {update_data['priority']}", False)
                return False
        else:
            self.print_status(4, "✗ Test case disappeared from dashboard after update", False)
            return False
        
        # Step 5: Verify individual test endpoint consistency
        individual_test = await self.get_test_case_detail(test_id)
        if individual_test["name"] == update_data["name"]:
            self.print_status(5, "✓ Individual endpoint shows updated data")
        else:
            self.print_status(5, "✗ Individual endpoint shows stale data", False)
            return False
        
        self.print_status("✅", "BASIC WORKFLOW TEST PASSED", True)
        return True
    
    async def test_step_count_consistency(self):
        """Test that step counts are immediately reflected"""
        self.print_separator("STEP COUNT CONSISTENCY TEST")
        
        # Create test case
        test_data = {
            "name": f"Step Count Test {int(time.time())}",
            "description": "Testing step count immediate updates",
            "status": "active"
        }
        
        created_test = await self.create_test_case(test_data)
        test_id = created_test["id"]
        self.print_status(1, f"Created test case: {test_id}")
        
        # Check initial step count in dashboard (should be 0)
        dashboard_data = await self.get_test_case_list()
        test_in_dashboard = next(item for item in dashboard_data["items"] if item["id"] == test_id)
        
        if test_in_dashboard["step_count"] == 0:
            self.print_status(2, "✓ Initial step count is 0")
        else:
            self.print_status(2, f"✗ Initial step count is {test_in_dashboard['step_count']}, expected 0", False)
            return False
        
        # Add first step
        step1_data = {
            "order_index": 1,
            "name": "Navigate to login page",
            "step_type": "navigate", 
            "input_data": "/login",
            "expected_result": "Login page loads"
        }
        
        await self.add_test_step(test_id, step1_data)
        self.print_status(3, "Added first step")
        
        # Check step count immediately (should be 1)
        dashboard_data_after_step1 = await self.get_test_case_list()
        test_after_step1 = next(item for item in dashboard_data_after_step1["items"] if item["id"] == test_id)
        
        if test_after_step1["step_count"] == 1:
            self.print_status(4, "✓ Step count updated to 1 immediately")
        else:
            self.print_status(4, f"✗ Step count is {test_after_step1['step_count']}, expected 1", False)
            return False
        
        # Add second step
        step2_data = {
            "order_index": 2,
            "name": "Enter credentials",
            "step_type": "type",
            "selector": "#username",
            "input_data": "testuser",
            "expected_result": "Username entered"
        }
        
        await self.add_test_step(test_id, step2_data)
        self.print_status(5, "Added second step")
        
        # Check step count immediately (should be 2)
        dashboard_data_after_step2 = await self.get_test_case_list()
        test_after_step2 = next(item for item in dashboard_data_after_step2["items"] if item["id"] == test_id)
        
        if test_after_step2["step_count"] == 2:
            self.print_status(6, "✓ Step count updated to 2 immediately")
        else:
            self.print_status(6, f"✗ Step count is {test_after_step2['step_count']}, expected 2", False)
            return False
        
        self.print_status("✅", "STEP COUNT CONSISTENCY TEST PASSED", True)
        return True
    
    async def test_rapid_operations(self):
        """Test rapid consecutive operations"""
        self.print_separator("RAPID OPERATIONS CONSISTENCY TEST")
        
        # Create initial test case
        test_data = {
            "name": f"Rapid Operations Test {int(time.time())}",
            "status": "draft", 
            "priority": "low"
        }
        
        created_test = await self.create_test_case(test_data)
        test_id = created_test["id"]
        self.print_status(1, f"Created test case: {test_id}")
        
        # Perform rapid updates
        updates = [
            {"name": "Rapid Update 1", "status": "active"},
            {"name": "Rapid Update 2", "priority": "medium"},
            {"name": "Rapid Update 3", "status": "inactive", "priority": "high"},
            {"name": "Final Rapid Update", "description": "Final description", "priority": "critical"}
        ]
        
        for i, update_data in enumerate(updates, 2):
            # Apply update
            await self.update_test_case(test_id, update_data)
            self.print_status(i, f"Applied update {i-1}: {update_data}")
            
            # Check dashboard immediately
            dashboard_data = await self.get_test_case_list()
            test_in_dashboard = next(item for item in dashboard_data["items"] if item["id"] == test_id)
            
            # Verify changes are reflected
            changes_reflected = True
            if "name" in update_data and test_in_dashboard["name"] != update_data["name"]:
                changes_reflected = False
            if "status" in update_data and test_in_dashboard["status"] != update_data["status"]:
                changes_reflected = False
            if "priority" in update_data and test_in_dashboard["priority"] != update_data["priority"]:
                changes_reflected = False
            
            if changes_reflected:
                self.print_status(i, f"✓ Rapid update {i-1} reflected in dashboard immediately")
            else:
                self.print_status(i, f"✗ Rapid update {i-1} NOT reflected in dashboard", False)
                return False
        
        self.print_status("✅", "RAPID OPERATIONS CONSISTENCY TEST PASSED", True)
        return True
    
    async def run_all_tests(self):
        """Run all consistency tests"""
        self.print_separator("DATA CONSISTENCY TEST SUITE")
        print(f"Testing server at: {self.base_url}")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        all_passed = True
        
        try:
            # Test 1: Basic workflow
            if not await self.test_basic_create_update_workflow():
                all_passed = False
            
            # Test 2: Step count consistency  
            if not await self.test_step_count_consistency():
                all_passed = False
            
            # Test 3: Rapid operations
            if not await self.test_rapid_operations():
                all_passed = False
            
        except Exception as e:
            self.print_status("ERROR", f"Test suite failed with error: {e}", False)
            all_passed = False
        
        # Final result
        self.print_separator("TEST RESULTS")
        if all_passed:
            print("🎉 ALL TESTS PASSED - Data consistency issue is FIXED!")
        else:
            print("❌ SOME TESTS FAILED - Data consistency issue still exists")
        
        return all_passed


async def main():
    """Main entry point"""
    async with DataConsistencyTester() as tester:
        success = await tester.run_all_tests()
        return success


if __name__ == "__main__":
    import sys
    
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        sys.exit(1)