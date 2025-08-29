import React, { useState, useEffect } from 'react'
import TestExecutionPanel from './TestExecutionPanel'
import AIInsightsPanel from './AIInsightsPanel'

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

  const handleExecutionComplete = (success: boolean, executionId: string) => {
    console.log(`Test execution ${executionId} completed with success: ${success}`)
    setExecutionResults({ success, executionId, timestamp: new Date() })
  }

  const handleExecutionError = (error: string) => {
    console.error('Test execution error:', error)
    setExecutionResults({ success: false, error, timestamp: new Date() })
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
          <div className="lg:col-span-2">
            <TestExecutionPanel
              testCaseId={selectedTestCase.id}
              testCaseName={selectedTestCase.name}
              onExecutionComplete={handleExecutionComplete}
              onExecutionError={handleExecutionError}
            />
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
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border">
                  🤖 AI Analysis Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}