import { useState } from 'react'
import Button, { ButtonProps } from './Button'

export interface AnimatedButtonProps extends ButtonProps {
  animation?: 'pulse' | 'bounce' | 'shake' | 'glow' | 'ripple'
  animationDuration?: number
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'shadow'
  children: React.ReactNode
}

function AnimatedButton({
  animation,
  animationDuration = 300,
  hoverEffect = 'lift',
  className = '',
  onClick,
  children,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [rippleEffect, setRippleEffect] = useState<{
    x: number
    y: number
    timestamp: number
  } | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    // Trigger animation
    if (animation) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), animationDuration)
    }

    // Ripple effect
    if (animation === 'ripple') {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setRippleEffect({ x, y, timestamp: Date.now() })
      setTimeout(() => setRippleEffect(null), 600)
    }

    onClick?.(e)
  }

  const getAnimationClasses = () => {
    if (!isAnimating || !animation) return ''

    switch (animation) {
      case 'pulse':
        return 'animate-pulse'
      case 'bounce':
        return 'animate-bounce'
      case 'shake':
        return 'animate-shake'
      case 'glow':
        return 'animate-glow'
      case 'ripple':
        return 'relative overflow-hidden'
      default:
        return ''
    }
  }

  const getHoverClasses = () => {
    switch (hoverEffect) {
      case 'lift':
        return 'hover:-translate-y-0.5 transition-transform duration-150 ease-out'
      case 'scale':
        return 'hover:scale-105 transition-transform duration-150 ease-out'
      case 'glow':
        return 'hover:shadow-lg hover:shadow-blue-500/25 transition-shadow duration-300 ease-out'
      case 'shadow':
        return 'hover:shadow-lg transition-shadow duration-300 ease-out'
      default:
        return ''
    }
  }

  return (
    <div className="relative inline-block">
      <Button
        {...props}
        disabled={disabled}
        className={`
          ${getAnimationClasses()}
          ${getHoverClasses()}
          ${className}
        `}
        onClick={handleClick}
      >
        {children}

        {/* Ripple Effect */}
        {animation === 'ripple' && rippleEffect && (
          <span
            className="absolute bg-white bg-opacity-30 rounded-full animate-ping"
            style={{
              left: rippleEffect.x - 10,
              top: rippleEffect.y - 10,
              width: 20,
              height: 20,
              pointerEvents: 'none',
            }}
          />
        )}
      </Button>
    </div>
  )
}

export default AnimatedButton
