// Export API client
export { apiClient, type ApiError, type ApiResponse } from './client'

// Export test case service
export { testCaseService } from './testCases'

// Export individual API functions for convenience
export {
  getTestCases,
  getTestCase,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  bulkCreateTestCases,
  getTestSteps,
  createTestStep,
  updateTestStep,
  deleteTestStep,
  searchTestCases,
} from './testCases'

// Export utilities
export * from './utils'
