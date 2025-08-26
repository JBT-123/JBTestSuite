import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTestCase, useDeleteTestCase } from '../hooks'
import { formatDateTime, formatDuration } from '../api'
import { 
  Button, 
  Loading, 
  Alert, 
  EmptyState,
  Modal,
  Table,
  type TableColumn
} from '../components/ui'
import { StatusBadge, PriorityBadge } from '../components/test-cases'
import { useState } from 'react'
import type { TestStepResponse } from '../types'

export const Route = createFileRoute('/tests/$testId')({
  component: TestCaseDetail,
})

function TestCaseDetail() {
  const { testId } = Route.useParams()
  const navigate = useNavigate()
  
  const { data: testCase, isLoading, error, refetch } = useTestCase(testId, true)
  const deleteTestCase = useDeleteTestCase()
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExecuteModal, setShowExecuteModal] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteTestCase.mutateAsync(testId)
      navigate({ to: '/tests' })
    } catch (error) {
      console.error('Failed to delete test case:', error)
    }
  }

  const handleClone = () => {
    if (testCase) {
      navigate({ 
        to: '/tests/create',
        search: { 
          clone: testCase.id,
          name: `Copy of ${testCase.name}`
        }
      })
    }
  }

  const handleExecute = () => {
    // TODO: Implement test execution in future phase
    setShowExecuteModal(true)
  }

  const stepColumns: TableColumn<TestStepResponse>[] = [
    {
      key: 'order_index',
      label: '#',
      render: (_, step) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
          {step.order_index}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Step',
      render: (_, step) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{step.name}</div>
          {step.description && (
            <div className="text-sm text-gray-500">{step.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'step_type',
      label: 'Type',
      render: (_, step) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
          {step.step_type}
        </span>
      )
    },
    {
      key: 'selector',
      label: 'Selector',
      render: (_, step) => step.selector ? (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{step.selector}</code>
      ) : (
        <span className="text-gray-400">—</span>
      )
    },
    {
      key: 'timeout_seconds',
      label: 'Timeout',
      render: (_, step) => step.timeout_seconds ? (
        <span className="text-sm text-gray-600">{step.timeout_seconds}s</span>
      ) : (
        <span className="text-gray-400">Default</span>
      )
    },
    {
      key: 'is_optional',
      label: 'Optional',
      render: (_, step) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          step.is_optional 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {step.is_optional ? 'Yes' : 'No'}
        </span>
      )
    }
  ]

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Loading size="lg" text="Loading test case details..." />
        </div>
      </div>
    )
  }

  if (error || !testCase) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Alert
            type="error"
            title="Error Loading Test Case"
            message={error ? `${String((error as any)?.message ?? error)}` : 'Test case not found'}
          />
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/tests' })}
            >
              ← Back to Tests
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link 
                to="/tests" 
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Test Cases
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-500 text-sm font-medium truncate max-w-xs">
                  {testCase.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 truncate">
                {testCase.name}
              </h1>
              <StatusBadge status={testCase.status || 'unknown'} />
              <PriorityBadge priority={testCase.priority || 'unknown'} />
            </div>
            
            {testCase.description && (
              <p className="text-gray-600 text-lg">{testCase.description}</p>
            )}
            
            <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
              <span>Created: {formatDateTime(testCase.created_at)}</span>
              <span>Updated: {formatDateTime(testCase.updated_at)}</span>
              {testCase.author && <span>Author: {testCase.author}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              onClick={handleExecute}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 16h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Execute Test
            </Button>
            <Button
              variant="outline"
              onClick={handleClone}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Clone
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: `/tests/${testId}/edit` })}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              loading={deleteTestCase.isPending}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Test Steps */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Test Steps ({testCase.steps?.length || 0})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: `/tests/${testId}/edit`, hash: 'steps' })}
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Step
                  </Button>
                </div>
              </div>

              <div>
                {testCase.steps && testCase.steps.length > 0 ? (
                  <Table
                    data={testCase.steps.sort((a, b) => a.order_index - b.order_index)}
                    columns={stepColumns}
                    getItemId={(step) => step.id}
                  />
                ) : (
                  <div className="p-8">
                    <EmptyState
                      title="No Test Steps"
                      description="This test case doesn't have any steps yet."
                      action={{
                        label: "Add First Step",
                        onClick: () => navigate({ to: `/tests/${testId}/edit`, hash: 'steps' })
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Expected Results */}
            {testCase.steps?.some(step => step.expected_result) && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Expected Results</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {testCase.steps
                      ?.filter(step => step.expected_result)
                      .map((step) => (
                        <div key={step.id} className="flex">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium mr-3 mt-0.5">
                            {step.order_index}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 mb-1">{step.name}</div>
                            <div className="text-sm text-gray-600">{step.expected_result}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Test Case Info */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Test Case Info</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <div className="text-sm text-gray-900">
                    {testCase.category || 'No category'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Automated</label>
                  <div className="text-sm text-gray-900">
                    {testCase.is_automated ? 'Yes' : 'No'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Retry Count</label>
                  <div className="text-sm text-gray-900">
                    {testCase.retry_count}
                  </div>
                </div>

                {testCase.expected_duration_seconds && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expected Duration</label>
                    <div className="text-sm text-gray-900">
                      {formatDuration(testCase.expected_duration_seconds)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {testCase.tags && testCase.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {testCase.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            {testCase.metadata && Object.keys(testCase.metadata).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Metadata</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {Object.entries(testCase.metadata).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-sm font-medium text-gray-500 capitalize">
                          {key.replace(/[_-]/g, ' ')}
                        </label>
                        <div className="text-sm text-gray-900">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => refetch()}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const url = `${window.location.origin}/tests/${testId}`
                    navigator.clipboard.writeText(url)
                  }}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Test Case"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete "{testCase.name}"? This action cannot be undone. 
              The test case and all its steps will be permanently deleted.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteTestCase.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deleteTestCase.isPending}
              >
                Delete Test Case
              </Button>
            </div>
          </div>
        </Modal>

        {/* Execute Test Modal */}
        <Modal
          isOpen={showExecuteModal}
          onClose={() => setShowExecuteModal(false)}
          title="Execute Test Case"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Test execution will be available in a future release. This feature is coming soon!
            </p>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowExecuteModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>

        {/* Error Alert */}
        {deleteTestCase.error && (
          <Alert
            type="error"
            title="Error deleting test case"
            message={String((deleteTestCase.error as any)?.message ?? deleteTestCase.error)}
            className="mt-4"
          />
        )}
      </div>
    </div>
  )
}