import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import TestExecutionDashboard from '../components/test-execution/TestExecutionDashboard'
import Loading from '../components/ui/Loading'

export const Route = createFileRoute('/tests/$testId/execute')({
  component: TestExecute
})

function TestExecute() {
  const { testId } = Route.useParams()
  const navigate = useNavigate()

  const { data: testCase, isLoading, error } = useQuery({
    queryKey: ['test-case', testId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/tests/${testId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch test case: ${response.statusText}`)
      }
      return response.json()
    },
  })

  const handleBack = () => {
    navigate({ to: '/tests/$testId', params: { testId } })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Test Case</h1>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Tests
          </button>
        </div>
      </div>
    )
  }

  if (!testCase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Case Not Found</h1>
          <p className="text-gray-600 mb-4">
            The test case with ID "{testId}" could not be found.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Tests
          </button>
        </div>
      </div>
    )
  }

  return (
    <TestExecutionDashboard 
      testCase={testCase}
      onBack={handleBack}
    />
  )
}