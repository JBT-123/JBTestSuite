import React, { memo, useMemo } from 'react'

export interface StatusBadgeProps {
  status: string
  className?: string
}

const StatusBadge: React.FC<StatusBadgeProps> = memo(({ status, className = '' }) => {
  const config = useMemo(() => {
    const normalizedStatus = status.toLowerCase()

    switch (normalizedStatus) {
      case 'active':
      case 'ready':
      case 'published':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          dot: 'bg-green-400',
          label: status.charAt(0).toUpperCase() + status.slice(1),
        }
      case 'draft':
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          dot: 'bg-yellow-400',
          label: status.charAt(0).toUpperCase() + status.slice(1),
        }
      case 'inactive':
      case 'disabled':
      case 'archived':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          dot: 'bg-gray-400',
          label: status.charAt(0).toUpperCase() + status.slice(1),
        }
      case 'deprecated':
      case 'failed':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          dot: 'bg-red-400',
          label: status.charAt(0).toUpperCase() + status.slice(1),
        }
      case 'in progress':
      case 'running':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          dot: 'bg-blue-400',
          label: status.charAt(0).toUpperCase() + status.slice(1),
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          dot: 'bg-gray-400',
          label: status.charAt(0).toUpperCase() + status.slice(1),
        }
    }
  }, [status])

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
      <svg
        className={`w-2 h-2 mr-1.5 ${config.dot}`}
        fill="currentColor"
        viewBox="0 0 8 8"
        aria-hidden="true"
      >
        <circle cx={4} cy={4} r={3} />
      </svg>
      <span className="sr-only">Status: </span>
      {config.label}
    </span>
  )
})

export default StatusBadge
