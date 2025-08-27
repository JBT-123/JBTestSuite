import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isMobileMenuOpen) {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsMobileMenuOpen(false)
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileMenuOpen])

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <nav
          className="bg-white shadow-sm border-b border-gray-200"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex-shrink-0" aria-label="JBTestSuite Home">
                  <h1 className="text-xl font-bold text-gray-900">JBTestSuite</h1>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link
                  to="/"
                  className="text-gray-500 hover:text-gray-700 focus:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  activeProps={{
                    className: 'text-primary-600 bg-primary-50',
                  }}
                >
                  Dashboard
                </Link>
                <Link
                  to="/tests"
                  className="text-gray-500 hover:text-gray-700 focus:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  activeProps={{
                    className: 'text-primary-600 bg-primary-50',
                  }}
                >
                  Tests
                </Link>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-500 hover:text-gray-700 focus:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 p-2 rounded-md transition-colors"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                  aria-label={isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
                >
                  <span className="sr-only">
                    {isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
                  </span>
                  {isMobileMenuOpen ? (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden" id="mobile-menu" role="menu">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 mt-4">
                  <Link
                    to="/"
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:text-gray-700 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    activeProps={{
                      className: 'text-primary-600 bg-primary-50',
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    role="menuitem"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/tests"
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:text-gray-700 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    activeProps={{
                      className: 'text-primary-600 bg-primary-50',
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    role="menuitem"
                  >
                    Tests
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8" role="main">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </>
  )
}
