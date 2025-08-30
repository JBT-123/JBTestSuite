import React, { memo, useMemo } from 'react'

export interface PriorityBadgeProps {
  priority: string
  className?: string
}

const PriorityBadge: React.FC<PriorityBadgeProps> = memo(({ priority, className = '' }) => {
  const config = useMemo(() => {
    const normalizedPriority = priority.toLowerCase()

    switch (normalizedPriority) {
      case 'high':
      case 'urgent':
      case 'critical':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
          label: priority.charAt(0).toUpperCase() + priority.slice(1),
        }
      case 'medium':
      case 'normal':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
          label: priority.charAt(0).toUpperCase() + priority.slice(1),
        }
      case 'low':
      case 'minor':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          ),
          label: priority.charAt(0).toUpperCase() + priority.slice(1),
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
          label: priority.charAt(0).toUpperCase() + priority.slice(1),
        }
    }
  }, [priority])

  const badgeClasses = useMemo(
    () =>
      [
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        className,
      ]
        .filter(Boolean)
        .join(' '),
    [config, className]
  )

  return (
    <span className={badgeClasses}>
      <span className="mr-1" aria-hidden="true">
        {config.icon}
      </span>
      <span className="sr-only">Priority: </span>
      {config.label}
    </span>
  )
})

export default PriorityBadge
