export interface AIHealthCheck {
  timestamp: string
  openai_service: {
    status: 'healthy' | 'disabled' | 'error'
    message: string
    api_accessible: boolean
    model_available?: boolean
  }
}

export interface AIServiceStatus {
  openai_enabled: boolean
  available_features: {
    screenshot_analysis: boolean
    test_result_analysis: boolean
    test_improvement_suggestions: boolean
    test_step_generation: boolean
  }
  timestamp: string
}

export interface AIUsageStats {
  usage_stats: {
    total_requests: number
    total_tokens: number
    by_operation: Record<string, { requests: number; tokens: number }>
    by_date: Record<string, {
      total_requests: number
      total_tokens: number
      operations: Record<string, {
        requests: number
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }>
    }>
  }
  period_days: number
  timestamp: string
}

export interface ScreenshotAnalysisRequest {
  screenshot_path: string
  context?: string
}

export interface ScreenshotAnalysisResult {
  analysis: {
    interactive_elements: string[]
    test_suggestions: string[]
    potential_issues: string[]
    raw_analysis: string
  }
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  timestamp: string
}

export interface TestResultAnalysisRequest {
  execution_result: Record<string, any>
}

export interface TestResultAnalysis {
  insights: {
    overall_status: 'success' | 'partial' | 'failure'
    key_findings: string[]
    performance_insights: {
      execution_time_assessment: 'fast' | 'normal' | 'slow'
      bottleneck_analysis: string
    }
    reliability_concerns: string[]
    improvement_suggestions: Array<{
      category: 'performance' | 'reliability' | 'maintainability'
      suggestion: string
      priority: 'high' | 'medium' | 'low'
    }>
    next_steps: string[]
  }
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  timestamp: string
}

export interface TestImprovementRequest {
  test_case_data: Record<string, any>
}

export interface TestImprovementSuggestions {
  suggestions: {
    test_case_quality: {
      score: number
      strengths: string[]
      weaknesses: string[]
    }
    improvements: Array<{
      category: 'reliability' | 'performance' | 'maintainability' | 'coverage'
      current_issue: string
      proposed_solution: string
      implementation_effort: 'low' | 'medium' | 'high'
      impact: 'low' | 'medium' | 'high'
    }>
    best_practices: Array<{
      practice: string
      how_to_implement: string
    }>
    risk_assessment: {
      flaky_test_risk: 'low' | 'medium' | 'high'
      maintenance_burden: 'low' | 'medium' | 'high'
      coverage_gaps: string[]
    }
  }
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  timestamp: string
}

export interface TestGenerationRequest {
  description: string
  target_url?: string
}

export interface TestStepGeneration {
  test_steps: {
    test_name: string
    test_description: string
    prerequisites: string[]
    steps: Array<{
      step_number: number
      action_type: 'navigate' | 'click' | 'input' | 'verify' | 'wait' | 'screenshot'
      description: string
      target_element: {
        selector: string
        selector_type: 'css' | 'xpath' | 'id' | 'name'
        description: string
      }
      input_data?: string
      expected_result: string
      timeout_seconds: number
    }>
    expected_outcomes: Array<{
      outcome: string
      verification_method: string
    }>
    cleanup_steps: string[]
  }
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  timestamp: string
}

export interface DemoScreenshotAnalysis {
  demo: true
  message: string
  mock_analysis?: {
    interactive_elements: string[]
    test_suggestions: string[]
    potential_issues: string[]
  }
  execution_id?: string
}