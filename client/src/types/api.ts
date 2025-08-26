export type TestStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface TestCase {
  id: number
  name: string
  description?: string
  url: string
  status: TestStatus
  created_at: string
  updated_at: string
  execution_log?: string
  screenshot_path?: string
  ai_analysis?: string
}

export interface CreateTestCase {
  name: string
  description?: string
  url: string
}

export interface UpdateTestCase {
  name?: string
  description?: string
  url?: string
  status?: TestStatus
  execution_log?: string
  screenshot_path?: string
  ai_analysis?: string
}

export interface WebSocketMessage {
  type: string
  test_case_id?: number
  status?: string
  message?: string
  timestamp?: string
}