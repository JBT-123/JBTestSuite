export interface TestCase {
  id: string
  name: string
  description?: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  created_at: string
  updated_at: string
}

export interface TestResult {
  id: string
  test_case_id: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  started_at?: string
  completed_at?: string
  error_message?: string
  screenshots?: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}