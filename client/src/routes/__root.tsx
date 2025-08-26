import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClient } from '@tanstack/react-query'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-gray-900">JBTestSuite</h1>
                </Link>
              </div>
              <div className="flex items-center space-x-8">
                <Link
                  to="/"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  activeProps={{
                    className: 'text-primary-600 bg-primary-50',
                  }}
                >
                  Dashboard
                </Link>
                <Link
                  to="/tests"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  activeProps={{
                    className: 'text-primary-600 bg-primary-50',
                  }}
                >
                  Tests
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </>
  ),
})