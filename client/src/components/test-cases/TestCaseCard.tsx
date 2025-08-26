import React from 'react'
import { TestCaseListResponse } from '../../types'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'

export interface TestCaseCardProps {
  testCase: TestCaseListResponse
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

const TestCaseCard: React.FC<TestCaseCardProps> = ({
  testCase,
  onClick,
  onEdit,
  onDelete,
  className = ''
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('button')) {
      onClick?.()
    }
  }

  const cardClasses = [
    'bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200',
    onClick ? 'cursor-pointer hover:border-gray-300' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClasses} onClick={handleCardClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {testCase.name}
          </h3>
          {testCase.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {testCase.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {(onEdit || onDelete) && (
            <div className="flex items-center space-x-1">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                  aria-label="Edit test case"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                  aria-label="Delete test case"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <StatusBadge status={testCase.status} />
          <PriorityBadge priority={testCase.priority} />
          
          {testCase.is_automated && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Automated
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {testCase.step_count !== undefined && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {testCase.step_count} steps
            </div>
          )}
          
          {testCase.execution_count !== undefined && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l4.828 4.829a2 2 0 002.828 0 2 2 0 000-2.829L14.121 7.464A1 1 0 0013.414 7H9a3 3 0 00-3 3v4a3 3 0 003 3z" />
              </svg>
              {testCase.execution_count} runs
            </div>
          )}
        </div>
      </div>

      {testCase.tags && testCase.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {testCase.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
          {testCase.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              +{testCase.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          {testCase.category && (
            <span>Category: {testCase.category}</span>
          )}
          {testCase.author && (
            <span>By: {testCase.author}</span>
          )}
        </div>
        <span>
          Updated: {new Date(testCase.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

export default TestCaseCard