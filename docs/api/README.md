# API Documentation

Comprehensive documentation for the JBTestSuite REST API built with FastAPI.

## 📋 Overview

The JBTestSuite API provides a complete RESTful interface for managing test cases, test execution, and automation workflows. All endpoints return JSON responses and follow standard HTTP conventions.

### Base URL
```
Development: http://localhost:8000
Production: https://your-domain.com
```

### API Version
Current API version: `v1`  
All endpoints are prefixed with `/api/v1`

## 🔐 Authentication

Currently, the API uses basic authentication. In production, implement JWT tokens or API keys.

```http
Authorization: Bearer <your-token>
```

## 📊 Response Format

### Standard Response Structure
```json
{
  "data": {},           // Response payload
  "message": "string",  // Optional message
  "status": "success"   // success | error
}
```

### Error Response Structure
```json
{
  "error": "string",    // Error type
  "message": "string",  // Human-readable message
  "details": {},        // Optional error details
  "status": "error"
}
```

### Pagination Structure
```json
{
  "items": [],          // Array of items
  "total": 100,         // Total item count
  "page": 1,            // Current page
  "limit": 20,          // Items per page
  "pages": 5            // Total pages
}
```

## 🧪 Test Cases API

### List Test Cases
```http
GET /api/v1/tests/
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `status` (string): Filter by status
- `category` (string): Filter by category  
- `author` (string): Filter by author
- `tags` (array): Filter by tags
- `created_after` (datetime): Filter by creation date
- `created_before` (datetime): Filter by creation date
- `sort_by` (string): Sort field (default: created_at)
- `order` (string): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Login Test",
      "description": "Test user login functionality",
      "status": "active",
      "priority": "high",
      "tags": ["authentication", "critical"],
      "author": "john.doe",
      "category": "auth",
      "is_automated": true,
      "step_count": 5,
      "execution_count": 12,
      "last_execution_status": "passed",
      "created_at": "2025-08-27T10:00:00Z",
      "updated_at": "2025-08-27T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

### Create Test Case
```http
POST /api/v1/tests/
```

**Request Body:**
```json
{
  "name": "Login Test",
  "description": "Test user login functionality",
  "status": "draft",
  "priority": "high", 
  "tags": ["authentication", "critical"],
  "metadata": {
    "browser": "chrome",
    "environment": "staging"
  },
  "author": "john.doe",
  "category": "auth",
  "expected_duration_seconds": 120,
  "is_automated": true,
  "retry_count": 3
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Login Test",
  "description": "Test user login functionality",
  "status": "draft",
  "priority": "high",
  "tags": ["authentication", "critical"],
  "metadata": {
    "browser": "chrome",
    "environment": "staging"
  },
  "author": "john.doe",
  "category": "auth",
  "expected_duration_seconds": 120,
  "is_automated": true,
  "retry_count": 3,
  "steps": [],
  "created_at": "2025-08-27T10:00:00Z",
  "updated_at": "2025-08-27T10:00:00Z"
}
```

### Get Test Case
```http
GET /api/v1/tests/{test_id}
```

**Query Parameters:**
- `include_steps` (boolean): Include test steps (default: true)

**Response:**
```json
{
  "id": "uuid",
  "name": "Login Test",
  "description": "Test user login functionality",
  "status": "active",
  "priority": "high",
  "tags": ["authentication", "critical"],
  "metadata": {},
  "author": "john.doe",
  "category": "auth",
  "expected_duration_seconds": 120,
  "is_automated": true,
  "retry_count": 3,
  "steps": [
    {
      "id": "uuid",
      "test_case_id": "uuid",
      "order_index": 1,
      "name": "Navigate to login page",
      "description": "Open the login page in browser",
      "step_type": "navigate",
      "selector": null,
      "input_data": "https://example.com/login",
      "expected_result": "Login page is displayed",
      "configuration": {
        "wait_for": "page_load"
      },
      "timeout_seconds": 30,
      "is_optional": false,
      "continue_on_failure": false,
      "created_at": "2025-08-27T10:00:00Z",
      "updated_at": "2025-08-27T10:00:00Z"
    }
  ],
  "created_at": "2025-08-27T10:00:00Z",
  "updated_at": "2025-08-27T10:00:00Z"
}
```

### Update Test Case
```http
PUT /api/v1/tests/{test_id}
```

**Request Body:** Same as create, all fields optional

### Delete Test Case
```http
DELETE /api/v1/tests/{test_id}
```

**Response:** 204 No Content

### Bulk Create Test Cases
```http
POST /api/v1/tests/bulk
```

**Request Body:**
```json
[
  {
    "name": "Test 1",
    "description": "Description 1",
    "is_automated": true,
    "retry_count": 1
  },
  {
    "name": "Test 2", 
    "description": "Description 2",
    "is_automated": false,
    "retry_count": 0
  }
]
```

**Response:**
```json
{
  "success_count": 2,
  "failure_count": 0,
  "total_count": 2,
  "errors": null
}
```

### Search Test Cases
```http
GET /api/v1/tests/search?q=login
```

**Query Parameters:**
- `q` (string): Search query (searches name and description)
- `page` (integer): Page number
- `limit` (integer): Items per page

**Response:** Same format as list test cases

## 📝 Test Steps API

### Get Test Steps
```http
GET /api/v1/tests/{test_id}/steps
```

**Response:**
```json
[
  {
    "id": "uuid",
    "test_case_id": "uuid",
    "order_index": 1,
    "name": "Navigate to login page",
    "description": "Open the login page in browser",
    "step_type": "navigate",
    "selector": null,
    "input_data": "https://example.com/login",
    "expected_result": "Login page is displayed",
    "configuration": {
      "wait_for": "page_load"
    },
    "timeout_seconds": 30,
    "is_optional": false,
    "continue_on_failure": false,
    "created_at": "2025-08-27T10:00:00Z",
    "updated_at": "2025-08-27T10:00:00Z"
  }
]
```

### Create Test Step
```http
POST /api/v1/tests/{test_id}/steps
```

**Request Body:**
```json
{
  "order_index": 1,
  "name": "Click login button",
  "description": "Click the login submit button",
  "step_type": "click",
  "selector": "#login-button",
  "input_data": null,
  "expected_result": "Form is submitted",
  "configuration": {
    "wait_after": 2000
  },
  "timeout_seconds": 10,
  "is_optional": false,
  "continue_on_failure": false
}
```

### Update Test Step
```http
PUT /api/v1/tests/{test_id}/steps/{step_id}
```

### Delete Test Step
```http
DELETE /api/v1/tests/{test_id}/steps/{step_id}
```

## 🏥 Health Check API

### Basic Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-27T10:00:00Z",
  "version": "1.0.0"
}
```

### Database Health Check
```http
GET /api/v1/health/database
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-08-27T10:00:00Z"
}
```

## 📊 Step Types Reference

### Available Step Types
- `navigate` - Navigate to URL
- `click` - Click element
- `type` - Type text into field
- `wait` - Wait for condition
- `assert` - Assert element/text exists
- `screenshot` - Take screenshot
- `api_call` - Make HTTP request
- `custom` - Custom script execution

### Step Configuration Examples

#### Navigate Step
```json
{
  "step_type": "navigate",
  "input_data": "https://example.com/login",
  "configuration": {
    "wait_for": "page_load",
    "timeout": 30000
  }
}
```

#### Click Step
```json
{
  "step_type": "click",
  "selector": "#login-button",
  "configuration": {
    "wait_after": 1000,
    "scroll_into_view": true
  }
}
```

#### Type Step
```json
{
  "step_type": "type",
  "selector": "#username",
  "input_data": "john.doe@example.com",
  "configuration": {
    "clear_first": true,
    "typing_delay": 100
  }
}
```

#### Assert Step
```json
{
  "step_type": "assert",
  "selector": ".success-message",
  "expected_result": "Login successful",
  "configuration": {
    "assertion_type": "text_contains",
    "case_sensitive": false
  }
}
```

## 📈 Status Codes

### HTTP Status Codes
- `200` - OK (GET, PUT requests)
- `201` - Created (POST requests)
- `204` - No Content (DELETE requests)
- `400` - Bad Request (Invalid input)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Access denied)
- `404` - Not Found (Resource doesn't exist)
- `422` - Unprocessable Entity (Validation error)
- `429` - Too Many Requests (Rate limited)
- `500` - Internal Server Error

### Test Case Status Values
- `draft` - Test case is being created
- `active` - Test case is ready for execution
- `archived` - Test case is archived
- `deprecated` - Test case is no longer used

### Priority Values
- `critical` - Must pass for release
- `high` - Important functionality
- `medium` - Standard features
- `low` - Nice-to-have features

## 🔄 Rate Limiting

API requests are rate limited to prevent abuse:
- **Limit**: 100 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## 📱 WebSocket API

Real-time updates are available via WebSocket connection:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

### WebSocket Message Types
- `test_execution_started`
- `test_execution_progress`
- `test_execution_completed`
- `test_step_completed`
- `screenshot_captured`

## 🧪 Testing the API

### Using cURL
```bash
# Get all test cases
curl -X GET "http://localhost:8000/api/v1/tests/" \
  -H "accept: application/json"

# Create a test case
curl -X POST "http://localhost:8000/api/v1/tests/" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Test",
    "description": "A sample test case",
    "is_automated": true,
    "retry_count": 3
  }'
```

### Using the Interactive Docs
Visit http://localhost:8000/docs for the auto-generated interactive API documentation powered by Swagger UI.

## 🔧 SDK Examples

### Python
```python
import requests

# Base URL
BASE_URL = "http://localhost:8000/api/v1"

# Get all test cases
response = requests.get(f"{BASE_URL}/tests/")
test_cases = response.json()

# Create a test case
test_data = {
    "name": "Login Test",
    "description": "Test user login",
    "is_automated": True,
    "retry_count": 3
}
response = requests.post(f"{BASE_URL}/tests/", json=test_data)
new_test = response.json()
```

### JavaScript
```javascript
// Fetch API example
const BASE_URL = 'http://localhost:8000/api/v1';

// Get all test cases
const response = await fetch(`${BASE_URL}/tests/`);
const testCases = await response.json();

// Create a test case
const testData = {
  name: 'Login Test',
  description: 'Test user login',
  is_automated: true,
  retry_count: 3
};

const createResponse = await fetch(`${BASE_URL}/tests/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
});

const newTest = await createResponse.json();
```

---

*For more examples and advanced usage, see the [Usage Guide](../features/test-management.md).*