import React, { forwardRef, useRef, useCallback } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  withRipple?: boolean
  withHoverLift?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      withRipple = false,
      withHoverLift = false,
      children,
      disabled,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const rippleRef = useRef<HTMLDivElement>(null)

    const createRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (!withRipple || !rippleRef.current) return

      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const ripple = document.createElement('div')
      ripple.className = 'animate-ripple absolute rounded-full bg-white bg-opacity-30 pointer-events-none'
      ripple.style.left = `${x - 10}px`
      ripple.style.top = `${y - 10}px`
      ripple.style.width = '20px'
      ripple.style.height = '20px'

      rippleRef.current.appendChild(ripple)

      setTimeout(() => {
        if (rippleRef.current && ripple.parentNode) {
          rippleRef.current.removeChild(ripple)
        }
      }, 600)
    }, [withRipple])

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        createRipple(event)
        onClick?.(event)
      }
    }, [disabled, loading, createRipple, onClick])

    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed relative overflow-hidden'

    const variantClasses = {
      primary: `bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ${withHoverLift ? 'hover:-translate-y-0.5 hover:shadow-lg' : ''}`,
      secondary: `bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 ${withHoverLift ? 'hover:-translate-y-0.5 hover:shadow-md' : ''}`,
      danger: `bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ${withHoverLift ? 'hover:-translate-y-0.5 hover:shadow-lg' : ''}`,
      ghost: `text-gray-700 hover:bg-gray-100 active:bg-gray-200 ${withHoverLift ? 'hover:-translate-y-0.5' : ''}`,
      outline: `border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100 ${withHoverLift ? 'hover:-translate-y-0.5 hover:shadow-md' : ''}`,
    }

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm rounded-md',
      md: 'h-10 px-4 text-sm rounded-md',
      lg: 'h-12 px-6 text-base rounded-lg',
    }

    const widthClasses = fullWidth ? 'w-full' : ''

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      widthClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button 
        ref={ref} 
        type="button"
        disabled={disabled || loading} 
        className={classes} 
        onClick={handleClick}
        {...props}
      >
        {withRipple && <div ref={rippleRef} className="absolute inset-0" />}
        
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
            <span>Loading...</span>
            <span className="sr-only">Loading, please wait</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="mr-2 transition-transform duration-200" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            <span className="relative z-10">{children}</span>
            {rightIcon && (
              <span className="ml-2 transition-transform duration-200" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
