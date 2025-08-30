import { apiClient } from './client'
import type {
  TestCaseCreate,
  TestCaseUpdate,
  TestCaseResponse,
  TestCaseListResponse,
  TestStepCreate,
  TestStepUpdate,
  TestStepResponse,
  PaginatedResponse,
  BulkOperationResponse,
  FilterParams,
  PaginationParams,
  SortParams,
  SearchParams,
} from '../types'

export class TestCaseService {
  private readonly basePath = '/tests'

  // Test Case CRUD operations
  async getTestCases(params?: {
    pagination?: Partial<PaginationParams>
    filters?: Partial<FilterParams>
    sort?: Partial<SortParams>
    fields?: string[]
  }): Promise<PaginatedResponse<TestCaseListResponse>> {
    const queryParams = new URLSearchParams()

    // Pagination
    if (params?.pagination?.page) {
      queryParams.set('page', params.pagination.page.toString())
    }
    if (params?.pagination?.limit) {
      queryParams.set('limit', params.pagination.limit.toString())
    }

    // Filters
    if (params?.filters?.status) {
      queryParams.set('status', params.filters.status)
    }
    if (params?.filters?.category) {
      queryParams.set('category', params.filters.category)
    }
    if (params?.filters?.author) {
      queryParams.set('author', params.filters.author)
    }
    if (params?.filters?.tags && params.filters.tags.length > 0) {
      params.filters.tags.forEach((tag) => queryParams.append('tags', tag))
    }
    if (params?.filters?.created_after) {
      queryParams.set('created_after', params.filters.created_after)
    }
    if (params?.filters?.created_before) {
      queryParams.set('created_before', params.filters.created_before)
    }

    // Sorting
    if (params?.sort?.sort_by) {
      queryParams.set('sort_by', params.sort.sort_by)
    }
    if (params?.sort?.order) {
      queryParams.set('order', params.sort.order)
    }

    // Fields
    if (params?.fields && params.fields.length > 0) {
      queryParams.set('fields', params.fields.join(','))
    }

    const url = `${this.basePath}/?${queryParams.toString()}`
    return apiClient.get<PaginatedResponse<TestCaseListResponse>>(url)
  }

  async getTestCase(testId: string, includeSteps: boolean = true): Promise<TestCaseResponse> {
    const queryParams = new URLSearchParams()
    queryParams.set('include_steps', includeSteps.toString())

    const url = `${this.basePath}/${testId}?${queryParams.toString()}`
    return apiClient.get<TestCaseResponse>(url)
  }

  async createTestCase(data: TestCaseCreate): Promise<TestCaseResponse> {
    return apiClient.post<TestCaseResponse>(this.basePath, data)
  }

  async updateTestCase(testId: string, data: TestCaseUpdate): Promise<TestCaseResponse> {
    const url = `${this.basePath}/${testId}`
    return apiClient.put<TestCaseResponse>(url, data)
  }

  async deleteTestCase(testId: string): Promise<void> {
    const url = `${this.basePath}/${testId}`
    return apiClient.delete<void>(url)
  }

  async bulkCreateTestCases(testsData: TestCaseCreate[]): Promise<BulkOperationResponse> {
    const url = `${this.basePath}/bulk`
    return apiClient.post<BulkOperationResponse>(url, testsData)
  }

  // Test Steps operations
  async getTestSteps(testId: string): Promise<TestStepResponse[]> {
    const url = `${this.basePath}/${testId}/steps`
    return apiClient.get<TestStepResponse[]>(url)
  }

  async createTestStep(testId: string, stepData: TestStepCreate): Promise<TestStepResponse> {
    const url = `${this.basePath}/${testId}/steps`
    return apiClient.post<TestStepResponse>(url, stepData)
  }

  async updateTestStep(
    testId: string,
    stepId: string,
    stepData: TestStepUpdate
  ): Promise<TestStepResponse> {
    const url = `${this.basePath}/${testId}/steps/${stepId}`
    return apiClient.put<TestStepResponse>(url, stepData)
  }

  async deleteTestStep(testId: string, stepId: string): Promise<void> {
    const url = `${this.basePath}/${testId}/steps/${stepId}`
    return apiClient.delete<void>(url)
  }

  // Search operations
  async searchTestCases(params: SearchParams): Promise<PaginatedResponse<TestCaseListResponse>> {
    const queryParams = new URLSearchParams()
    queryParams.set('q', params.q)
    queryParams.set('page', params.page.toString())
    queryParams.set('limit', params.limit.toString())

    const url = `${this.basePath}/search?${queryParams.toString()}`
    return apiClient.get<PaginatedResponse<TestCaseListResponse>>(url)
  }

  // Utility methods for query keys (used with TanStack Query)
  getQueryKeys() {
    return {
      all: ['testCases'] as const,
      lists: () => [...this.getQueryKeys().all, 'list'] as const,
      list: (params?: any) => [...this.getQueryKeys().lists(), params] as const,
      details: () => [...this.getQueryKeys().all, 'detail'] as const,
      detail: (id: string) => [...this.getQueryKeys().details(), id] as const,
      steps: (testId: string) => [...this.getQueryKeys().detail(testId), 'steps'] as const,
      search: (query: string) => [...this.getQueryKeys().all, 'search', query] as const,
    }
  }
}

// Export singleton instance
export const testCaseService = new TestCaseService()

// Export individual functions for convenience
export const {
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
} = testCaseService
