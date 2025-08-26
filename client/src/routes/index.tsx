import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to JBTestSuite
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Full-Stack Web Automation Platform with AI Integration
        </p>
        <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Test Management
              </h3>
              <p className="text-gray-600">
                Create, organize, and execute automated test cases with ease.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Integration
              </h3>
              <p className="text-gray-600">
                Leverage ChatGPT and Vision AI for intelligent test generation and analysis.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Real-time Monitoring
              </h3>
              <p className="text-gray-600">
                Monitor test execution with live updates and screenshot capture.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">System Status</h4>
              <p className="text-sm text-green-700">
                ✅ Client application is running successfully!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}