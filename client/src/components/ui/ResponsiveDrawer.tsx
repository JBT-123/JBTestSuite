import { useState, useEffect, useRef } from 'react'
import Button from './Button'

export interface ResponsiveDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  position?: 'left' | 'right' | 'bottom'
  showCloseButton?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
}

const positionClasses = {
  left: 'left-0 top-0 h-full',
  right: 'right-0 top-0 h-full',
  bottom: 'bottom-0 left-0 right-0 max-h-[75vh]',
}

const transformClasses = {
  left: {
    closed: '-translate-x-full',
    open: 'translate-x-0',
  },
  right: {
    closed: 'translate-x-full',
    open: 'translate-x-0',
  },
  bottom: {
    closed: 'translate-y-full',
    open: 'translate-y-0',
  },
}

function ResponsiveDrawer({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'md',
  position = 'left',
  showCloseButton = true,
}: ResponsiveDrawerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      setIsVisible(true)
      document.body.style.overflow = 'hidden'

      // Focus management
      setTimeout(() => {
        if (drawerRef.current) {
          const firstFocusable = drawerRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement
          firstFocusable?.focus()
        }
      }, 100)
    } else {
      setIsVisible(false)
      document.body.style.overflow = ''

      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isVisible && !isOpen) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          absolute bg-white shadow-xl transition-transform duration-300 ease-in-out
          ${positionClasses[position]}
          ${sizeClasses[size]}
          ${transformClasses[position][isOpen ? 'open' : 'closed']}
          ${position === 'bottom' ? 'rounded-t-lg' : ''}
          ${className}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h2 id="drawer-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="ml-auto"
                aria-label="Close drawer"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={`${position === 'bottom' ? 'max-h-[calc(75vh-4rem)] overflow-y-auto' : 'h-full'} p-4`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default ResponsiveDrawer
