import { useMutation, useQuery } from '@tanstack/react-query'

interface CompetitionAnalysisRequest {
  screenshot_path: string
  test_context?: {
    test_name: string
    step_number: number
    expected_action: string
    target_url: string
    previous_steps: string[]
  }
}

interface CompetitionAnalysisResponse {
  success: boolean
  competition_analysis?: any
  error?: string
  raw_response?: string
  usage?: {
    total_tokens: number
    prompt_tokens: number
    completion_tokens: number
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useCompetitionAI() {
  // Mutation for analyzing screenshots with competition prompts
  const analyzeScreenshot = useMutation({
    mutationFn: async (request: CompetitionAnalysisRequest): Promise<CompetitionAnalysisResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/analyze-screenshot-competition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Analysis request failed: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: (data) => {
      console.log('Competition AI analysis completed:', data)
    },
    onError: (error) => {
      console.error('Competition AI analysis failed:', error)
    }
  })

  // Query for getting AI service health
  const { data: aiHealth, isLoading: isHealthLoading } = useQuery({
    queryKey: ['ai-health'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/health`)
      if (!response.ok) {
        throw new Error('AI health check failed')
      }
      return response.json()
    },
    refetchInterval: 30000, // Check health every 30 seconds
  })

  // Query for getting AI usage statistics
  const { data: usageStats, refetch: refetchUsage } = useQuery({
    queryKey: ['ai-usage-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/usage-stats`)
      if (!response.ok) {
        throw new Error('Usage stats request failed')
      }
      return response.json()
    },
    enabled: false, // Only fetch when explicitly requested
  })

  return {
    // Competition AI analysis
    analyzeScreenshot,
    isAnalyzing: analyzeScreenshot.isPending,
    analysisError: analyzeScreenshot.error,
    analysisResult: analyzeScreenshot.data,
    
    // AI service status
    aiHealth,
    isAIHealthy: aiHealth?.status === 'healthy',
    isHealthLoading,
    
    // Usage tracking
    usageStats,
    refetchUsage,
    
    // Helper methods
    analyzeMultipleScreenshots: async (screenshots: string[], testContext?: any) => {
      const results = []
      for (const screenshot of screenshots) {
        try {
          const result = await analyzeScreenshot.mutateAsync({
            screenshot_path: screenshot,
            test_context: testContext
          })
          results.push({ screenshot, result })
        } catch (error) {
          results.push({ screenshot, error })
        }
      }
      return results
    }
  }
}

// Hook for managing real-time AI analysis during test execution
export function useRealTimeAIAnalysis() {
  const competitionAI = useCompetitionAI()
  
  const analyzeTestStep = async (stepData: {
    screenshot_path: string
    test_name: string
    step_number: number
    step_type: string
    target_element?: string
    expected_result?: string
  }) => {
    const testContext = {
      test_name: stepData.test_name,
      step_number: stepData.step_number,
      expected_action: `${stepData.step_type}${stepData.target_element ? ` on ${stepData.target_element}` : ''}`,
      target_url: 'unknown', // This should be provided by the test execution context
      previous_steps: [] // This should be built from previous steps
    }

    return competitionAI.analyzeScreenshot.mutateAsync({
      screenshot_path: stepData.screenshot_path,
      test_context: testContext
    })
  }

  return {
    ...competitionAI,
    analyzeTestStep,
    
    // Competition-specific metrics
    getConsistencyScore: (analysisResult: any) => {
      return analysisResult?.competition_analysis?.consistency_verification?.ui_pattern_compliance?.score || 0
    },
    
    getCriticalIssuesCount: (analysisResult: any) => {
      return analysisResult?.competition_analysis?.exception_detection?.anomaly_severity?.critical?.length || 0
    },
    
    getRegressionTestPoints: (analysisResult: any) => {
      return analysisResult?.competition_analysis?.regression_testing_insights?.critical_test_points?.primary_user_actions || []
    }
  }
}