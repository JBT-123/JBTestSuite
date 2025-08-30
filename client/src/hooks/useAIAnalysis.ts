import { useState, useCallback } from 'react'
import { useCompetitionAI } from './useCompetitionAI'

interface AIAnalysisResult {
  success: boolean
  competition_analysis?: any
  analysis?: any
  usage?: {
    total_tokens: number
  }
  error?: string
  timestamp: string
}

export function useAIAnalysis(competitionMode: boolean = false) {
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisResult[]>([])
  
  const competitionAI = useCompetitionAI()

  const analyzeScreenshot = useCallback(async (
    screenshotPath: string, 
    testContext?: {
      test_name: string
      step_number: number
      expected_action: string
      target_url?: string
    }
  ) => {
    setIsAnalyzing(true)
    setCurrentAnalysis(null)

    try {
      let result
      
      if (competitionMode) {
        // Use competition AI analysis
        result = await competitionAI.analyzeScreenshot.mutateAsync({
          screenshot_path: screenshotPath,
          test_context: testContext
        })
      } else {
        // Use standard AI analysis  
        const response = await fetch('/api/v1/ai/analyze-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenshot_path: screenshotPath,
            context: testContext ? `Test: ${testContext.test_name}, Step ${testContext.step_number}: ${testContext.expected_action}` : undefined
          })
        })
        
        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`)
        }
        
        result = await response.json()
      }

      const analysisResult: AIAnalysisResult = {
        success: result.success,
        competition_analysis: result.competition_analysis,
        analysis: result.analysis,
        usage: result.usage,
        error: result.error,
        timestamp: new Date().toISOString()
      }

      setCurrentAnalysis(analysisResult)
      setAnalysisHistory(prev => [...prev, analysisResult])
      
      return analysisResult

    } catch (error) {
      const errorResult: AIAnalysisResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
      
      setCurrentAnalysis(errorResult)
      setAnalysisHistory(prev => [...prev, errorResult])
      
      return errorResult
    } finally {
      setIsAnalyzing(false)
    }
  }, [competitionMode, competitionAI.analyzeScreenshot])

  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null)
  }, [])

  const clearHistory = useCallback(() => {
    setAnalysisHistory([])
    setCurrentAnalysis(null)
  }, [])

  return {
    // Current state
    currentAnalysis,
    isAnalyzing,
    analysisHistory,
    
    // Actions
    analyzeScreenshot,
    clearAnalysis,
    clearHistory,
    
    // Computed values
    hasAnalysis: currentAnalysis !== null,
    hasError: currentAnalysis?.success === false,
    totalTokensUsed: analysisHistory.reduce((sum, analysis) => 
      sum + (analysis.usage?.total_tokens || 0), 0
    ),
    successfulAnalyses: analysisHistory.filter(a => a.success).length,
    failedAnalyses: analysisHistory.filter(a => !a.success).length,
    
    // Competition-specific metrics
    getConsistencyScore: useCallback(() => {
      return currentAnalysis?.competition_analysis?.consistency_verification?.ui_pattern_compliance?.score || 0
    }, [currentAnalysis]),
    
    getCriticalIssues: useCallback(() => {
      return currentAnalysis?.competition_analysis?.exception_detection?.anomaly_severity?.critical?.length || 0
    }, [currentAnalysis]),
    
    // AI service status
    isAIHealthy: competitionAI.isAIHealthy,
    isHealthLoading: competitionAI.isHealthLoading
  }
}