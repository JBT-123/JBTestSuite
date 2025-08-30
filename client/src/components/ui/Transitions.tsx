import React, { useState, useEffect } from 'react'

export interface FadeInProps {
  children: React.ReactNode
  duration?: number
  delay?: number
  className?: string
  from?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export function FadeIn({
  children,
  duration = 300,
  delay = 0,
  className = '',
  from = 'center',
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const fromClasses = {
    top: 'translate-y-[-20px]',
    bottom: 'translate-y-[20px]',
    left: 'translate-x-[-20px]',
    right: 'translate-x-[20px]',
    center: 'scale-95',
  }

  const transitionClass = `transition-all duration-${duration} ease-out`
  const initialClass = `opacity-0 ${fromClasses[from]}`
  const finalClass = 'opacity-100 translate-y-0 translate-x-0 scale-100'

  return (
    <div
      className={`${transitionClass} ${isVisible ? finalClass : initialClass} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}

export interface SlideInProps {
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
  delay?: number
  className?: string
}

export function SlideIn({
  children,
  direction = 'up',
  duration = 300,
  delay = 0,
  className = '',
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const directionClasses = {
    up: isVisible ? 'translate-y-0' : 'translate-y-8',
    down: isVisible ? 'translate-y-0' : 'translate-y-[-32px]',
    left: isVisible ? 'translate-x-0' : 'translate-x-8',
    right: isVisible ? 'translate-x-0' : 'translate-x-[-32px]',
  }

  return (
    <div
      className={`opacity-0 transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${directionClasses[direction]} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export interface StaggeredListProps {
  children: React.ReactNode[]
  staggerDelay?: number
  className?: string
}

export function StaggeredList({ children, staggerDelay = 100, className = '' }: StaggeredListProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn key={index} delay={index * staggerDelay} from="bottom">
          {child}
        </FadeIn>
      ))}
    </div>
  )
}

export interface PulseProps {
  children: React.ReactNode
  className?: string
  intensity?: 'subtle' | 'normal' | 'strong'
}

export function Pulse({ children, className = '', intensity = 'normal' }: PulseProps) {
  const intensityClasses = {
    subtle: 'animate-pulse-subtle',
    normal: 'animate-pulse',
    strong: 'animate-pulse-strong',
  }

  return <div className={`${intensityClasses[intensity]} ${className}`}>{children}</div>
}

export interface BounceInProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function BounceIn({ children, delay = 0, className = '' }: BounceInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 scale-100 animate-bounce-in'
          : 'opacity-0 scale-50'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export interface HoverLiftProps {
  children: React.ReactNode
  className?: string
  liftAmount?: 'sm' | 'md' | 'lg'
}

export function HoverLift({ children, className = '', liftAmount = 'md' }: HoverLiftProps) {
  const liftClasses = {
    sm: 'hover:-translate-y-1 hover:shadow-md',
    md: 'hover:-translate-y-2 hover:shadow-lg',
    lg: 'hover:-translate-y-3 hover:shadow-xl',
  }

  return (
    <div
      className={`transition-all duration-200 ease-out transform ${liftClasses[liftAmount]} ${className}`}
    >
      {children}
    </div>
  )
}

export interface ScaleOnHoverProps {
  children: React.ReactNode
  className?: string
  scale?: number
}

export function ScaleOnHover({ children, className = '', scale = 1.05 }: ScaleOnHoverProps) {
  return (
    <div
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ '--scale': scale } as React.CSSProperties}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `scale(${scale})`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {children}
    </div>
  )
}

export interface ProgressBarProps {
  progress: number
  className?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  animated?: boolean
  showPercentage?: boolean
}

export function ProgressBar({
  progress,
  className = '',
  color = 'blue',
  animated = true,
  showPercentage = false,
}: ProgressBarProps) {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={`relative overflow-hidden rounded-full bg-gray-200 ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${
          colorClasses[color]
        } ${animated ? 'animate-pulse-slow' : ''}`}
        style={{ width: `${clampedProgress}%` }}
      />
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  )
}

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  className?: string
}

export function Spinner({ size = 'md', color = 'blue', className = '' }: SpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600',
  }

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <svg className="h-full w-full" fill="none" viewBox="0 0 24 24">
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
    </div>
  )
}