// Base interfaces
export interface BaseResponse {
  id: string
  created_at: string
  updated_at: string
}

// Test Case types
export interface TestCaseBase {
  name: string
  description?: string
  status?: string
  priority?: string
  tags?: string[]
  metadata?: Record<string, any>
  author?: string
  category?: string
  expected_duration_seconds?: number
  is_automated: boolean
  retry_count: number
}

export interface TestCaseCreate extends TestCaseBase {}

export interface TestCaseUpdate {
  name?: string
  description?: string
  status?: string
  priority?: string
  tags?: string[]
  metadata?: Record<string, any>
  author?: string
  category?: string
  expected_duration_seconds?: number
  is_automated?: boolean
  retry_count?: number
}

export interface TestCaseResponse extends TestCaseBase, BaseResponse {
  steps?: TestStepResponse[]
}

export interface TestCaseListResponse {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  tags?: string[]
  author?: string
  category?: string
  is_automated: boolean
  step_count?: number
  execution_count?: number
  last_execution_status?: string
  created_at: string
  updated_at: string
}

// Test Step types
export interface TestStepBase {
  order_index: number
  name: string
  description?: string
  step_type: string
  selector?: string
  input_data?: string
  expected_result?: string
  configuration?: Record<string, any>
  timeout_seconds?: number
  is_optional: boolean
  continue_on_failure: boolean
}

export interface TestStepCreate extends TestStepBase {}

export interface TestStepUpdate {
  order_index?: number
  name?: string
  description?: string
  step_type?: string
  selector?: string
  input_data?: string
  expected_result?: string
  configuration?: Record<string, any>
  timeout_seconds?: number
  is_optional?: boolean
  continue_on_failure?: boolean
}

export interface TestStepResponse extends TestStepBase, BaseResponse {
  test_case_id: string
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface ErrorResponse {
  error: string
  message: string
  details?: Record<string, any>
}

export interface BulkOperationResponse {
  success_count: number
  failure_count: number
  total_count: number
  errors?: string[]
}

// Query parameter types
export interface FilterParams {
  status?: string
  tags?: string[]
  category?: string
  author?: string
  created_after?: string
  created_before?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface SortParams {
  sort_by: string
  order: 'asc' | 'desc'
}

export interface SearchParams extends PaginationParams {
  q: string
}

// API utility types
export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  message: string
  details?: Record<string, any>
}

// Form types for UI
export interface TestCaseFormData extends TestCaseBase {
  steps: TestStepFormData[]
}

export interface TestStepFormData extends Omit<TestStepBase, 'order_index'> {
  id?: string
  temp_id?: string
}

// UI state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface QueryState<T> {
  data?: T
  loading: boolean
  error?: ApiError | null
}