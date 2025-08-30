import React, { useState, useEffect } from 'react'
import { useWebSocket, TestExecutionEvent } from '../../hooks/useWebSocket'
import Button from '../ui/Button'
import Loading from '../ui/Loading'
import AIInsightsPanel from './AIInsightsPanel'
import AIMessageDisplay from './AIMessageDisplay'
import { useAIAnalysis } from '../../hooks/useAIAnalysis'

interface ExecutionState {
  executionId: string | null
  testCaseId: string | null
  status: 'idle' | 'queued' | 'running' | 'completed' | 'error' | 'cancelled'
  currentStep: number
  totalSteps: number
  stepDescription: string
  progressPercentage: number
  screenshotPath: string | null
  errorMessage: string | null
  resultSummary: string | null
  lastUpdateTimestamp?: string
}

interface TestExecutionPanelProps {
  testCaseId?: string
  testCaseName?: string
  onExecutionComplete?: (success: boolean, executionId: string) => void
  onExecutionError?: (error: string) => void
  onScreenshotCaptured?: (screenshotPath: string, stepData?: any) => void
  competitionMode?: boolean
}

export default function TestExecutionPanel({
  testCaseId,
  testCaseName,
  onExecutionComplete,
  onExecutionError,
  onScreenshotCaptured,
  competitionMode = false
}: TestExecutionPanelProps) {
  const [executionState, setExecutionState] = useState<ExecutionState>({
    executionId: null,
    testCaseId: null,
    status: 'idle',
    currentStep: 0,
    totalSteps: 0,
    stepDescription: '',
    progressPercentage: 0,
    screenshotPath: null,
    errorMessage: null,
    resultSummary: null,
    lastUpdateTimestamp: undefined
  })

  const [executionLog, setExecutionLog] = useState<TestExecutionEvent[]>([])
  const [aiAnalyses, setAiAnalyses] = useState<any[]>([])
  const [finalAiAnalysis, setFinalAiAnalysis] = useState<any>(null)
  
  // AI Analysis integration
  const aiAnalysis = useAIAnalysis(competitionMode)

  const handleTestExecutionEvent = (event: TestExecutionEvent) => {
    console.log('[TestExecution] Received WebSocket event:', event.type, event)
    setExecutionLog(prev => [...prev, event])
    
    // Handle screenshot capture for AI analysis
    if (event.screenshot_path && event.type === 'test_execution_progress') {
      handleScreenshotAnalysis(event.screenshot_path, event.step_number || 0, event.step_description)
    }
    
    // Prevent older events from overriding newer ones
    const eventTime = new Date(event.timestamp).getTime()
    
    setExecutionState(prevState => {
      const lastUpdateTime = prevState.lastUpdateTimestamp 
        ? new Date(prevState.lastUpdateTimestamp).getTime() 
        : 0
        
      if (lastUpdateTime > eventTime) {
        console.log('[TestExecution] Ignoring older event:', event.type, 'Event time:', event.timestamp, 'Last update:', prevState.lastUpdateTimestamp)
        return prevState
      }
      
      const newState = { ...prevState, lastUpdateTimestamp: event.timestamp }
      
      switch (event.type) {
        case 'test_execution_queued':
          // Only allow queued state if we're currently idle or if it's a new execution
          if (prevState.status === 'completed' || prevState.status === 'error') {
            console.log('[TestExecution] Ignoring queued event - execution already completed/errored')
            return prevState
          }
          console.log('[TestExecution] Setting state to QUEUED')
          return {
            ...newState,
            executionId: event.execution_id || null,
            testCaseId: event.test_case_id || null,
            status: 'queued',
            errorMessage: null
          }
          
        case 'test_execution_started':
          console.log('[TestExecution] Setting state to RUNNING')
          return {
            ...newState,
            executionId: event.execution_id || null,
            testCaseId: event.test_case_id || null,
            status: 'running',
            currentStep: 0,
            progressPercentage: 0,
            errorMessage: null
          }
          
        case 'test_execution_progress':
          return {
            ...newState,
            currentStep: event.step_number || 0,
            totalSteps: event.total_steps || 0,
            stepDescription: event.step_description || '',
            progressPercentage: event.progress_percentage || 0,
            screenshotPath: event.screenshot_path || prevState.screenshotPath
          }
          
          // Handle screenshot captured for AI analysis
          if (event.screenshot_path && event.screenshot_path !== prevState.screenshotPath) {
            onScreenshotCaptured?.(event.screenshot_path, {
              stepNumber: event.step_number,
              stepType: 'screenshot',
              expectedResult: event.step_description
            })
            
          }
          
          return newState
          
        case 'test_execution_completed':
          console.log('[TestExecution] Setting state to COMPLETED')
          const completedState = {
            ...newState,
            status: 'completed' as const,
            resultSummary: event.result_summary || null,
            progressPercentage: 100
          }
          if (event.execution_id) {
            onExecutionComplete?.(event.success || false, event.execution_id)
          }
          return completedState
          
        case 'test_execution_error':
          console.log('[TestExecution] Setting state to ERROR')
          const errorState = {
            ...newState,
            status: 'error' as const,
            errorMessage: event.error_message || event.message || 'Unknown error occurred'
          }
          if (event.error_message) {
            onExecutionError?.(event.error_message)
          }
          return errorState
          
        case 'test_execution_cancelled':
          console.log('[TestExecution] Setting state to CANCELLED')
          return {
            ...newState,
            status: 'cancelled' as const,
            errorMessage: null
          }
          
        default:
          return newState
      }
    })

    // Handle AI analysis data
    if (event.ai_analysis) {
      setAiAnalyses(prev => [...prev, event.ai_analysis])
    }
    
    if (event.final_ai_analysis) {
      setFinalAiAnalysis(event.final_ai_analysis)
    }
  }

  // Handle screenshot analysis
  const handleScreenshotAnalysis = async (screenshotPath: string, stepNumber: number, stepDescription?: string) => {
    if (!testCaseName) return
    
    await aiAnalysis.analyzeScreenshot(screenshotPath, {
      test_name: testCaseName,
      step_number: stepNumber,
      expected_action: stepDescription || 'Screenshot captured',
      target_url: 'unknown'
    })
  }

  const { 
    status: wsStatus, 
    isConnected, 
    startTestExecution, 
    stopTestExecution 
  } = useWebSocket({
    onTestExecutionEvent: handleTestExecutionEvent,
    autoConnect: true
  })

  const handleStartExecution = () => {
    if (!testCaseId || !isConnected) return
    
    setExecutionLog([])
    setAiAnalyses([])
    setFinalAiAnalysis(null)
    aiAnalysis.clearHistory()
    setExecutionState(prev => ({
      ...prev,
      status: 'queued',
      errorMessage: null,
      resultSummary: null
    }))
    
    const success = startTestExecution(testCaseId)
    if (!success) {
      setExecutionState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: 'Failed to start test execution - WebSocket not connected'
      }))
    }
  }

  const handleStopExecution = () => {
    if (!executionState.executionId) return
    
    const success = stopTestExecution(executionState.executionId)
    if (!success) {
      console.error('Failed to send stop command - WebSocket not connected')
    }
  }

  const canStartExecution = testCaseId && isConnected && ['idle', 'completed', 'error', 'cancelled'].includes(executionState.status)
  const canStopExecution = executionState.executionId && ['queued', 'running'].includes(executionState.status)

  const getStatusColor = (status: ExecutionState['status']) => {
    switch (status) {
      case 'idle': return 'text-gray-500'
      case 'queued': return 'text-yellow-600'
      case 'running': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'cancelled': return 'text-orange-600'
      default: return 'text-gray-500'
    }
  }

  const getStatusText = (status: ExecutionState['status']) => {
    switch (status) {
      case 'idle': return 'Ready'
      case 'queued': return 'Queued'
      case 'running': return 'Running'
      case 'completed': return 'Completed'
      case 'error': return 'Error'
      case 'cancelled': return 'Cancelled'
      default: return 'Unknown'
    }
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Test Execution {testCaseName && `- ${testCaseName}`}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            WebSocket: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {executionState.executionId && (
              <span className="ml-4">
                Execution ID: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                  {executionState.executionId}
                </code>
              </span>
            )}
          </p>
        </div>
        <div className={`text-sm font-medium ${getStatusColor(executionState.status)}`}>
          {getStatusText(executionState.status)}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-3">
        <Button
          variant="primary"
          onClick={handleStartExecution}
          disabled={!canStartExecution}
          loading={executionState.status === 'queued'}
        >
          {executionState.status === 'queued' ? 'Starting...' : 'Start Test Execution'}
        </Button>
        
        <Button
          variant="danger"
          onClick={handleStopExecution}
          disabled={!canStopExecution}
        >
          Stop Execution
        </Button>
      </div>

      {/* Progress Section */}
      {executionState.status === 'running' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Step {executionState.currentStep} of {executionState.totalSteps}</span>
            <span>{Math.round(executionState.progressPercentage)}% complete</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${executionState.progressPercentage}%` }}
            />
          </div>
          
          {executionState.stepDescription && (
            <p className="text-sm text-gray-700">
              <strong>Current Step:</strong> {executionState.stepDescription}
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {['queued', 'running'].includes(executionState.status) && (
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <Loading size="sm" />
          <span className="text-sm text-blue-700">
            {executionState.status === 'queued' ? 'Waiting to start...' : 'Executing test steps...'}
          </span>
        </div>
      )}

      {/* Results Section */}
      {executionState.status === 'completed' && executionState.resultSummary && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">Execution Complete</h3>
          <p className="text-sm text-green-700">{executionState.resultSummary}</p>
        </div>
      )}

      {/* Error Section */}
      {executionState.status === 'error' && executionState.errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2">Execution Error</h3>
          <p className="text-sm text-red-700">{executionState.errorMessage}</p>
        </div>
      )}

      {/* Screenshot Preview */}
      {executionState.screenshotPath && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Latest Screenshot</h3>
          <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
            <img 
              src={`/api/v1/artifacts/screenshots/${executionState.screenshotPath.split('/').pop()}`}
              alt="Test execution screenshot"
              className="max-w-full h-auto rounded border"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Path: {executionState.screenshotPath}
            </p>
          </div>
        </div>
      )}

      {/* AI Analysis Results */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">OpenAI Analysis</h3>
          <div className="flex items-center space-x-2">
            {competitionMode && (
              <span className="px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
                🏆 Advanced Mode
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              aiAnalysis.isAIHealthy 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {aiAnalysis.isAIHealthy ? 'AI Ready' : 'AI Offline'}
            </span>
          </div>
        </div>
        <AIMessageDisplay 
          analysisResult={aiAnalysis.currentAnalysis}
          isAnalyzing={aiAnalysis.isAnalyzing}
          competitionMode={competitionMode}
        />
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel 
        aiAnalyses={aiAnalyses} 
        finalAnalysis={finalAiAnalysis} 
      />

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Execution Log</h3>
          <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-gray-50 rounded border text-xs font-mono">
            {executionLog.map((event, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-gray-400 min-w-[80px]">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className={`font-medium min-w-[120px] ${
                  event.type.includes('error') ? 'text-red-600' : 
                  event.type.includes('completed') ? 'text-green-600' : 
                  'text-blue-600'
                }`}>
                  {event.type}
                </span>
                <span className="text-gray-700 flex-1">
                  {event.message || event.step_description || event.result_summary || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}