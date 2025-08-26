import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tests')({
  component: Tests,
})

function Tests() {
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Management</h1>
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="h-full w-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Yet</h3>
          <p className="text-gray-600 mb-6">
            Test management features will be implemented in Phase 2.
          </p>
          <button className="btn btn-primary">Create First Test</button>
        </div>
      </div>
    </div>
  )
}