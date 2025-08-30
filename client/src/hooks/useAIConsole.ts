import { useState, useCallback, useRef } from 'react'

interface AIMessage {
  id: string
  type: 'info' | 'analysis' | 'warning' | 'error' | 'success' | 'competition'
  timestamp: Date
  message: string
  data?: any
  stepNumber?: number
  screenshotPath?: string
}

interface UseAIConsoleOptions {
  maxMessages?: number
  autoAnalyze?: boolean
  competitionMode?: boolean
}

export function useAIConsole(options: UseAIConsoleOptions = {}) {
  const { maxMessages = 100, autoAnalyze = true, competitionMode = false } = options
  
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isAIActive, setIsAIActive] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const messageIdCounter = useRef(0)

  const addMessage = useCallback((
    type: AIMessage['type'],
    message: string,
    data?: any,
    stepNumber?: number,
    screenshotPath?: string
  ) => {
    const newMessage: AIMessage = {
      id: `ai-msg-${Date.now()}-${messageIdCounter.current++}`,
      type,
      timestamp: new Date(),
      message,
      data,
      stepNumber,
      screenshotPath
    }

    setMessages(prev => {
      const updated = [...prev, newMessage]
      // Keep only the last maxMessages
      if (updated.length > maxMessages) {
        return updated.slice(-maxMessages)
      }
      return updated
    })

    return newMessage.id
  }, [maxMessages])

  // Convenience methods for different message types
  const logInfo = useCallback((message: string, data?: any, stepNumber?: number) => 
    addMessage('info', message, data, stepNumber), [addMessage])

  const logAnalysis = useCallback((message: string, data?: any, stepNumber?: number, screenshotPath?: string) => 
    addMessage('analysis', message, data, stepNumber, screenshotPath), [addMessage])

  const logCompetition = useCallback((message: string, data?: any, stepNumber?: number, screenshotPath?: string) => 
    addMessage('competition', message, data, stepNumber, screenshotPath), [addMessage])

  const logWarning = useCallback((message: string, data?: any, stepNumber?: number) => 
    addMessage('warning', message, data, stepNumber), [addMessage])

  const logError = useCallback((message: string, data?: any, stepNumber?: number) => 
    addMessage('error', message, data, stepNumber), [addMessage])

  const logSuccess = useCallback((message: string, data?: any, stepNumber?: number) => 
    addMessage('success', message, data, stepNumber), [addMessage])

  // Handle AI analysis results
  const handleAnalysisResult = useCallback((result: any, stepNumber?: number, screenshotPath?: string) => {
    if (!isAIActive) return

    setIsProcessing(false)

    if (result.success) {
      if (competitionMode && result.competition_analysis) {
        const analysis = result.competition_analysis
        const consistency_score = analysis.consistency_verification?.ui_pattern_compliance?.score || 0
        const critical_issues = analysis.exception_detection?.anomaly_severity?.critical?.length || 0
        const tokens_used = result.usage?.total_tokens || 0

        logCompetition(
          'Advanced AI Analysis Complete',
          {
            consistency_score,
            critical_issues,
            tokens_used,
            challenges: {
              consistency: consistency_score,
              exceptions: critical_issues,
              regression: analysis.regression_testing_insights?.critical_test_points?.primary_user_actions?.length || 0
            }
          },
          stepNumber,
          screenshotPath
        )

        // Log specific findings
        if (critical_issues > 0) {
          logWarning(
            `${critical_issues} critical issues detected`,
            { issues: analysis.exception_detection.anomaly_severity.critical },
            stepNumber
          )
        }

        if (consistency_score < 80) {
          logWarning(
            `UI consistency score below threshold: ${consistency_score}/100`,
            { score: consistency_score },
            stepNumber
          )
        }

        // Log automation insights
        const selectors = analysis.regression_testing_insights?.automation_selectors?.robust_selectors || []
        if (selectors.length > 0) {
          logInfo(
            `Found ${selectors.length} automation-ready elements`,
            { selectors: selectors.map(s => s.recommended_selector) },
            stepNumber
          )
        }

      } else if (result.analysis) {
        // Standard AI analysis
        logAnalysis(
          'AI Analysis Complete',
          {
            interactive_elements: result.analysis.interactive_elements?.length || 0,
            suggestions: result.analysis.test_suggestions?.length || 0,
            issues: result.analysis.potential_issues?.length || 0
          },
          stepNumber,
          screenshotPath
        )
      }
    } else {
      logError(
        `AI Analysis Failed: ${result.error || 'Unknown error'}`,
        { error: result.error },
        stepNumber
      )
    }
  }, [isAIActive, competitionMode, logCompetition, logWarning, logInfo, logAnalysis, logError])

  // Handle test execution events
  const handleTestEvent = useCallback((event: string, data?: any, stepNumber?: number) => {
    if (!isAIActive) return

    switch (event) {
      case 'test_started':
        logInfo(`Test execution started: ${data?.testName}`, data)
        break
      case 'step_started':
        logInfo(`Step ${stepNumber}: ${data?.action}`, data, stepNumber)
        break
      case 'screenshot_captured':
        logInfo(`Screenshot captured`, data, stepNumber, data?.screenshotPath)
        if (autoAnalyze) {
          setIsProcessing(true)
          logInfo('Starting AI analysis...', undefined, stepNumber)
        }
        break
      case 'step_completed':
        logSuccess(`Step ${stepNumber} completed`, data, stepNumber)
        break
      case 'step_failed':
        logError(`Step ${stepNumber} failed: ${data?.error}`, data, stepNumber)
        break
      case 'test_completed':
        logSuccess(`Test execution completed`, data)
        break
      case 'test_failed':
        logError(`Test execution failed: ${data?.error}`, data)
        break
      default:
        logInfo(event, data, stepNumber)
    }
  }, [isAIActive, autoAnalyze, logInfo, logSuccess, logError])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const toggleAI = useCallback(() => {
    setIsAIActive(prev => !prev)
    if (!isAIActive) {
      logInfo('AI Console activated')
    } else {
      logInfo('AI Console deactivated')
    }
  }, [isAIActive, logInfo])

  const setProcessing = useCallback((processing: boolean) => {
    setIsProcessing(processing)
  }, [])

  // Filter messages by type
  const getMessagesByType = useCallback((type: AIMessage['type']) => {
    return messages.filter(msg => msg.type === type)
  }, [messages])

  // Get recent messages
  const getRecentMessages = useCallback((count: number) => {
    return messages.slice(-count)
  }, [messages])

  return {
    // State
    messages,
    isAIActive,
    isProcessing,
    competitionMode,
    
    // Actions
    addMessage,
    clearMessages,
    toggleAI,
    setProcessing,
    
    // Convenience methods
    logInfo,
    logAnalysis,
    logCompetition,
    logWarning,
    logError,
    logSuccess,
    
    // Event handlers
    handleAnalysisResult,
    handleTestEvent,
    
    // Utilities
    getMessagesByType,
    getRecentMessages,
    
    // Stats
    totalMessages: messages.length,
    errorCount: messages.filter(m => m.type === 'error').length,
    warningCount: messages.filter(m => m.type === 'warning').length,
    analysisCount: messages.filter(m => m.type === 'analysis' || m.type === 'competition').length
  }
}