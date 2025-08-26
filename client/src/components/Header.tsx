import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="bg-white shadow border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-xl font-bold text-blue-600 hover:text-blue-800"
            >
              JBTestSuite
            </Link>
          </div>
          <nav className="flex space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
