import React, { useState, useEffect } from 'react'
import TestExecutionPanel from './TestExecutionPanel'
import AIInsightsPanel from './AIInsightsPanel'
import CompetitionAIPanel from './CompetitionAIPanel'
import { useCompetitionAI, useRealTimeAIAnalysis } from '../../hooks/useCompetitionAI'

interface TestCase {
  id: string
  name: string
  description?: string
  status: string
}

interface TestExecutionDashboardProps {
  testCase?: TestCase
  onBack?: () => void
}

export default function TestExecutionDashboard({ testCase, onBack }: TestExecutionDashboardProps) {
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(testCase || null)
  const [executionResults, setExecutionResults] = useState<any>(null)
  const [competitionAnalyses, setCompetitionAnalyses] = useState<any[]>([])
  const [showCompetitionAI, setShowCompetitionAI] = useState(true)
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null)
  
  // Competition AI analysis hooks
  const competitionAI = useRealTimeAIAnalysis()

  const handleExecutionComplete = (success: boolean, executionId: string) => {
    console.log(`Test execution ${executionId} completed with success: ${success}`)
    setExecutionResults({ success, executionId, timestamp: new Date() })
    setCurrentExecutionId(executionId)
  }

  const handleExecutionError = (error: string) => {
    console.error('Test execution error:', error)
    setExecutionResults({ success: false, error, timestamp: new Date() })
  }

  // Handle screenshot captured during test execution
  const handleScreenshotCaptured = async (screenshotPath: string, stepData?: any) => {
    if (!showCompetitionAI || !selectedTestCase) return
    
    try {
      const analysis = await competitionAI.analyzeTestStep({
        screenshot_path: screenshotPath,
        test_name: selectedTestCase.name,
        step_number: stepData?.stepNumber || 1,
        step_type: stepData?.stepType || 'screenshot',
        target_element: stepData?.targetElement,
        expected_result: stepData?.expectedResult
      })

      if (analysis.success && analysis.competition_analysis) {
        setCompetitionAnalyses(prev => [...prev, {
          ...analysis.competition_analysis,
          screenshot_path: screenshotPath,
          timestamp: new Date().toISOString(),
          usage_tokens: analysis.usage?.total_tokens || 0
        }])
      }
    } catch (error) {
      console.error('Competition AI analysis failed:', error)
    }
  }

  // Toggle between AI analysis modes
  const toggleAIMode = () => {
    setShowCompetitionAI(!showCompetitionAI)
    if (showCompetitionAI) {
      setCompetitionAnalyses([]) // Clear competition analyses when switching modes
    }
  }

  if (!selectedTestCase) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Test Execution Dashboard
        </h2>
        <p className="text-gray-600">
          No test case selected. Please select a test case to execute.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Test Cases
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Test Execution Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Execute and monitor test case: <strong>{selectedTestCase.name}</strong>
              </p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:border-gray-400"
              >
                ← Back to Test Cases
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Execution Panel */}
          <div className="lg:col-span-2 space-y-6">
            <TestExecutionPanel
              testCaseId={selectedTestCase.id}
              testCaseName={selectedTestCase.name}
              onExecutionComplete={handleExecutionComplete}
              onExecutionError={handleExecutionError}
              onScreenshotCaptured={handleScreenshotCaptured}
              competitionMode={showCompetitionAI}
            />
            
            {/* AI Analysis Panel */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
                  <div className="flex items-center space-x-3">
                    {competitionAI.isAIHealthy && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1"></div>
                        AI Ready
                      </span>
                    )}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={toggleAIMode}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          !showCompetitionAI
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Standard AI
                      </button>
                      <button
                        onClick={toggleAIMode}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          showCompetitionAI
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        🏆 Advanced AI
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {showCompetitionAI ? (
                  <CompetitionAIPanel 
                    competitionAnalyses={competitionAnalyses}
                    isAnalyzing={competitionAI.isAnalyzing}
                  />
                ) : (
                  <AIInsightsPanel 
                    aiAnalyses={[]}
                    finalAnalysis={undefined}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Test Case Info and Quick Actions */}
          <div className="space-y-6">
            {/* Test Case Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Test Case Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{selectedTestCase.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {selectedTestCase.id}
                  </p>
                </div>
                {selectedTestCase.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedTestCase.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedTestCase.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Execution Results Summary */}
            {executionResults && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Latest Execution</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      executionResults.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {executionResults.success ? 'Success' : 'Failed'}
                    </div>
                  </div>
                  {executionResults.executionId && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Execution ID</label>
                      <p className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {executionResults.executionId}
                      </p>
                    </div>
                  )}
                  {executionResults.error && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Error</label>
                      <p className="text-sm text-red-600">{executionResults.error}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Timestamp</label>
                    <p className="text-sm text-gray-900">
                      {executionResults.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis Summary */}
            {showCompetitionAI && competitionAnalyses.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow p-6 border border-blue-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Advanced AI Summary
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(competitionAnalyses.reduce((sum, analysis) => 
                          sum + (analysis.consistency_verification?.ui_pattern_compliance?.score || 0), 0
                        ) / competitionAnalyses.length) || 0}
                      </div>
                      <div className="text-xs text-gray-600">Avg UI Score</div>
                    </div>
                    <div className="text-center bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-2xl font-bold text-red-600">
                        {competitionAnalyses.reduce((sum, analysis) => 
                          sum + (analysis.exception_detection?.anomaly_severity?.critical?.length || 0), 0
                        )}
                      </div>
                      <div className="text-xs text-gray-600">Critical Issues</div>
                    </div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 border border-blue-200">
                    <div className="text-lg font-bold text-purple-600">
                      {competitionAnalyses.reduce((sum, analysis) => sum + (analysis.usage_tokens || 0), 0)}
                    </div>
                    <div className="text-xs text-gray-600">Total Tokens Used</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border">
                  📊 View Execution History
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border">
                  📋 Edit Test Case
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border">
                  📸 View Screenshots
                </button>
                <button 
                  onClick={() => competitionAI.refetchUsage()}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border"
                >
                  🤖 AI Usage Stats
                </button>
                {showCompetitionAI && (
                  <button 
                    onClick={toggleAIMode}
                    className="w-full text-left px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded border border-purple-200 bg-purple-50"
                  >
                    🏆 Advanced Mode Active
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}