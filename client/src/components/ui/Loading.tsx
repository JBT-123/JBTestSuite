import React from 'react'

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  className?: string
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const spinner = (
    <svg
      className={`animate-spin ${sizeClasses[size]} text-blue-600`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm">
        <div className="text-center">
          {spinner}
          {text && (
            <p className={`mt-2 text-gray-600 ${textSizeClasses[size]}`}>
              {text}
            </p>
          )}
        </div>
      </div>
    )
  }

  const containerClasses = [
    'flex items-center justify-center',
    text ? 'space-x-2' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {spinner}
      {text && (
        <span className={`text-gray-600 ${textSizeClasses[size]}`}>
          {text}
        </span>
      )}
    </div>
  )
}

export default Loading