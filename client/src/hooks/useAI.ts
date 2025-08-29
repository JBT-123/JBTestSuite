import { useMutation, useQuery } from '@tanstack/react-query'
import type {
  AIHealthCheck,
  AIServiceStatus,
  AIUsageStats,
  ScreenshotAnalysisRequest,
  ScreenshotAnalysisResult,
  TestResultAnalysisRequest,
  TestResultAnalysis,
  TestImprovementRequest,
  TestImprovementSuggestions,
  TestGenerationRequest,
  TestStepGeneration,
  DemoScreenshotAnalysis
} from '../types/ai'

const API_BASE_URL = 'http://localhost:8000/api/v1/ai'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

export function useAIHealth() {
  return useQuery({
    queryKey: ['ai', 'health'],
    queryFn: () => fetchAPI<AIHealthCheck>('/health'),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useAIStatus() {
  return useQuery({
    queryKey: ['ai', 'status'],
    queryFn: () => fetchAPI<AIServiceStatus>('/status'),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useAIUsageStats(days: number = 7) {
  return useQuery({
    queryKey: ['ai', 'usage-stats', days],
    queryFn: () => fetchAPI<AIUsageStats>(`/usage-stats?days=${days}`),
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export function useScreenshotAnalysis() {
  return useMutation({
    mutationFn: (request: ScreenshotAnalysisRequest) =>
      fetchAPI<ScreenshotAnalysisResult>('/analyze-screenshot', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  })
}

export function useScreenshotUploadAnalysis() {
  return useMutation({
    mutationFn: ({ file, context }: { file: File; context?: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      if (context) {
        formData.append('context', context)
      }

      return fetchAPI<ScreenshotAnalysisResult>('/analyze-screenshot-upload', {
        method: 'POST',
        body: formData,
        headers: {},
      })
    },
  })
}

export function useTestResultAnalysis() {
  return useMutation({
    mutationFn: (request: TestResultAnalysisRequest) =>
      fetchAPI<TestResultAnalysis>('/analyze-test-result', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  })
}

export function useTestImprovementSuggestions() {
  return useMutation({
    mutationFn: (request: TestImprovementRequest) =>
      fetchAPI<TestImprovementSuggestions>('/suggest-improvements', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  })
}

export function useTestStepGeneration() {
  return useMutation({
    mutationFn: (request: TestGenerationRequest) =>
      fetchAPI<TestStepGeneration>('/generate-test-steps', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  })
}

export function useDemoScreenshotAnalysis() {
  return useMutation({
    mutationFn: (executionId: string) =>
      fetchAPI<DemoScreenshotAnalysis>(`/demo/analyze-current-screenshot?execution_id=${executionId}`, {
        method: 'POST',
      }),
  })
}

export function useAI() {
  const healthQuery = useAIHealth()
  const statusQuery = useAIStatus()
  
  const screenshotAnalysis = useScreenshotAnalysis()
  const screenshotUploadAnalysis = useScreenshotUploadAnalysis()
  const testResultAnalysis = useTestResultAnalysis()
  const testImprovementSuggestions = useTestImprovementSuggestions()
  const testStepGeneration = useTestStepGeneration()
  const demoScreenshotAnalysis = useDemoScreenshotAnalysis()

  return {
    health: healthQuery,
    status: statusQuery,
    isEnabled: statusQuery.data?.openai_enabled ?? false,
    isHealthy: healthQuery.data?.openai_service.status === 'healthy',
    
    analyzeScreenshot: screenshotAnalysis.mutate,
    analyzeScreenshotAsync: screenshotAnalysis.mutateAsync,
    screenshotAnalysisStatus: screenshotAnalysis.status,
    screenshotAnalysisResult: screenshotAnalysis.data,
    screenshotAnalysisError: screenshotAnalysis.error,

    analyzeScreenshotUpload: screenshotUploadAnalysis.mutate,
    analyzeScreenshotUploadAsync: screenshotUploadAnalysis.mutateAsync,
    screenshotUploadAnalysisStatus: screenshotUploadAnalysis.status,
    screenshotUploadAnalysisResult: screenshotUploadAnalysis.data,
    screenshotUploadAnalysisError: screenshotUploadAnalysis.error,

    analyzeTestResult: testResultAnalysis.mutate,
    analyzeTestResultAsync: testResultAnalysis.mutateAsync,
    testResultAnalysisStatus: testResultAnalysis.status,
    testResultAnalysisResult: testResultAnalysis.data,
    testResultAnalysisError: testResultAnalysis.error,

    suggestTestImprovements: testImprovementSuggestions.mutate,
    suggestTestImprovementsAsync: testImprovementSuggestions.mutateAsync,
    testImprovementSuggestionsStatus: testImprovementSuggestions.status,
    testImprovementSuggestionsResult: testImprovementSuggestions.data,
    testImprovementSuggestionsError: testImprovementSuggestions.error,

    generateTestSteps: testStepGeneration.mutate,
    generateTestStepsAsync: testStepGeneration.mutateAsync,
    testStepGenerationStatus: testStepGeneration.status,
    testStepGenerationResult: testStepGeneration.data,
    testStepGenerationError: testStepGeneration.error,

    analyzeDemoScreenshot: demoScreenshotAnalysis.mutate,
    analyzeDemoScreenshotAsync: demoScreenshotAnalysis.mutateAsync,
    demoScreenshotAnalysisStatus: demoScreenshotAnalysis.status,
    demoScreenshotAnalysisResult: demoScreenshotAnalysis.data,
    demoScreenshotAnalysisError: demoScreenshotAnalysis.error,
  }
}