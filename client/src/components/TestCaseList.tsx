import { useEffect } from 'react'
import { useTestCases, useDeleteTestCase, useExecuteTestCase } from '../hooks/useTestCases'
import { useWebSocket } from '../hooks/useWebSocket'
import type { TestCase, TestStatus } from '../types'

const statusColors: Record<TestStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export default function TestCaseList() {
  const { data: testCases, isLoading, error, refetch } = useTestCases()
  const deleteTestCase = useDeleteTestCase()
  const executeTestCase = useExecuteTestCase()
  
  // Connect to WebSocket for real-time updates
  const wsUrl = `ws://localhost:8000/api/ws/test_updates`
  const { messages, connectionStatus } = useWebSocket(wsUrl)
  
  // Handle WebSocket messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      if (latestMessage.type === 'test_update') {
        // Refetch test cases when we receive an update
        refetch()
      }
    }
  }, [messages, refetch])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load test cases: {error.message}
      </div>
    )
  }

  if (!testCases || testCases.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No test cases found. Create your first test case to get started.
      </div>
    )
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this test case?')) {
      try {
        await deleteTestCase.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete test case:', error)
      }
    }
  }

  const handleExecute = async (id: number) => {
    try {
      await executeTestCase.mutateAsync(id)
    } catch (error) {
      console.error('Failed to execute test case:', error)
    }
  }

  return (
    <div className="space-y-4">
      {testCases.map((testCase: TestCase) => (
        <div
          key={testCase.id}
          className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {testCase.name}
              </h3>
              {testCase.description && (
                <p className="mt-1 text-gray-600">{testCase.description}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">URL: {testCase.url}</p>
              <div className="mt-3 flex items-center space-x-4">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    statusColors[testCase.status]
                  }`}
                >
                  {testCase.status}
                </span>
                <span className="text-xs text-gray-500">
                  Created: {new Date(testCase.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExecute(testCase.id)}
                disabled={
                  testCase.status === 'running' || executeTestCase.isPending
                }
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executeTestCase.isPending ? 'Starting...' : 'Execute'}
              </button>
              <button
                onClick={() => handleDelete(testCase.id)}
                disabled={deleteTestCase.isPending}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteTestCase.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
          {testCase.execution_log && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
              <h4 className="font-semibold mb-2">Execution Log:</h4>
              <pre className="whitespace-pre-wrap text-xs text-gray-700">
                {testCase.execution_log}
              </pre>
            </div>
          )}
          {testCase.ai_analysis && (
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
              <h4 className="font-semibold mb-2 text-blue-800">AI Analysis:</h4>
              <p className="text-blue-700">{testCase.ai_analysis}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}