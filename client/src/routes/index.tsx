import { createFileRoute } from '@tanstack/react-router'
import CreateTestCaseForm from '../components/CreateTestCaseForm'
import TestCaseList from '../components/TestCaseList'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          JBTestSuite Dashboard
        </h1>
        <p className="text-gray-600">
          Manage and execute your web automation test cases with AI-powered analysis
        </p>
      </div>
      
      <CreateTestCaseForm />
      <TestCaseList />
    </div>
  )
}
