import type { TestCaseListResponse, TestCaseResponse, TestStepResponse, PaginatedResponse } from '../types'
import { createMockTestCase, createMockTestCases } from '../tests/utils'

// Mock test steps data
const createMockTestSteps = (testId: string): TestStepResponse[] => [
  {
    id: `step-1-${testId}`,
    test_case_id: testId,
    name: 'Navigate to login page',
    description: 'Open the application and navigate to the login page',
    step_type: 'navigate',
    selector: '',
    value: 'https://example.com/login',
    expected_result: 'Login page is displayed',
    order_index: 1,
    timeout_seconds: 10,
    is_optional: false,
    retry_count: 0,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-10T08:00:00Z',
  },
  {
    id: `step-2-${testId}`,
    test_case_id: testId,
    name: 'Enter credentials',
    description: 'Enter valid username and password',
    step_type: 'input',
    selector: '#username',
    value: 'testuser',
    expected_result: 'Username field is populated',
    order_index: 2,
    timeout_seconds: 5,
    is_optional: false,
    retry_count: 0,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-10T08:00:00Z',
  },
  {
    id: `step-3-${testId}`,
    test_case_id: testId,
    name: 'Click login button',
    description: 'Click the login button to submit the form',
    step_type: 'click',
    selector: '#login-button',
    value: '',
    expected_result: 'User is redirected to dashboard',
    order_index: 3,
    timeout_seconds: 10,
    is_optional: false,
    retry_count: 0,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-10T08:00:00Z',
  },
]

// Mock test case with full details
const createMockTestCaseDetail = (testId: string): TestCaseResponse => ({
  id: testId,
  name: `Test Case ${testId.split('-')[2] || '1'}`,
  description: `Description for test case ${testId}`,
  status: 'active',
  priority: 'high',
  category: 'authentication',
  tags: ['login', 'auth', 'ui'],
  author: 'Test User',
  is_automated: true,
  retry_count: 3,
  expected_duration_seconds: 30,
  metadata: {
    browser: 'chrome',
    environment: 'staging',
    version: '1.0.0'
  },
  steps: createMockTestSteps(testId),
  created_at: '2024-01-10T08:00:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  created_by: 'user-1',
  updated_by: 'user-1',
})

// Development mode flag
export const isDevelopmentMode = import.meta.env.MODE === 'development' && !import.meta.env.VITE_API_BASE_URL

// Mock API responses for development
export const mockApiData = {
  getTestCases: (): PaginatedResponse<TestCaseListResponse> => ({
    items: createMockTestCases(10),
    pagination: {
      page: 1,
      limit: 25,
      total: 10,
      pages: 1
    }
  }),
  
  getTestCase: (testId: string): TestCaseResponse => {
    // For known test IDs, return mock data
    if (testId.startsWith('00000001') || testId === 'test-case-1') {
      return createMockTestCaseDetail('00000001-1234-5678-9012-000000000001')
    }
    if (testId.startsWith('00000002') || testId === 'test-case-2') {
      return createMockTestCaseDetail('00000002-1234-5678-9012-000000000002')
    }
    
    // For any other ID, generate mock data
    return createMockTestCaseDetail(testId)
  }
}

// Helper to check if we should use mock data
export const shouldUseMockData = (error?: any): boolean => {
  return isDevelopmentMode || 
         (error && (error.message?.includes('Connection failed') || 
                   error.message?.includes('Network error') ||
                   error.code === 'ERR_NETWORK'))
}