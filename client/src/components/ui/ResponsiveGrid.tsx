import React from 'react'

export interface ResponsiveGridProps {
  children: React.ReactNode
  columns?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?:
    | {
        xs?: number
        sm?: number
        md?: number
        lg?: number
        xl?: number
      }
    | number
  className?: string
  autoFit?: boolean
  minItemWidth?: string
}

const getColumnClass = (columns: number, breakpoint: string) => {
  if (breakpoint === 'xs') return `grid-cols-${columns}`
  return `${breakpoint}:grid-cols-${columns}`
}

const getGapClass = (gap: number, breakpoint: string) => {
  if (breakpoint === 'xs') return `gap-${gap}`
  return `${breakpoint}:gap-${gap}`
}

function ResponsiveGrid({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 4,
  className = '',
  autoFit = false,
  minItemWidth = '250px',
}: ResponsiveGridProps) {
  if (autoFit) {
    return (
      <div
        className={`grid ${className}`}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
          gap: typeof gap === 'number' ? `${gap * 0.25}rem` : undefined,
        }}
      >
        {children}
      </div>
    )
  }

  const columnClasses = Object.entries(columns)
    .map(([breakpoint, cols]) => getColumnClass(cols, breakpoint))
    .join(' ')

  const gapClasses =
    typeof gap === 'number'
      ? `gap-${gap}`
      : Object.entries(gap)
          .map(([breakpoint, gapValue]) => getGapClass(gapValue, breakpoint))
          .join(' ')

  return <div className={`grid ${columnClasses} ${gapClasses} ${className}`}>{children}</div>
}

export interface ResponsiveGridItemProps {
  children: React.ReactNode
  span?:
    | {
        xs?: number
        sm?: number
        md?: number
        lg?: number
        xl?: number
      }
    | number
  className?: string
}

export function ResponsiveGridItem({ children, span, className = '' }: ResponsiveGridItemProps) {
  if (!span) {
    return <div className={className}>{children}</div>
  }

  const spanClasses =
    typeof span === 'number'
      ? `col-span-${span}`
      : Object.entries(span)
          .map(([breakpoint, spanValue]) =>
            breakpoint === 'xs' ? `col-span-${spanValue}` : `${breakpoint}:col-span-${spanValue}`
          )
          .join(' ')

  return <div className={`${spanClasses} ${className}`}>{children}</div>
}

export interface ResponsiveContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  padding?:
    | {
        xs?: number
        sm?: number
        md?: number
        lg?: number
        xl?: number
      }
    | number
  centered?: boolean
  className?: string
}

export function ResponsiveContainer({
  children,
  maxWidth = '7xl',
  padding = { xs: 4, sm: 6, lg: 8 },
  centered = true,
  className = '',
}: ResponsiveContainerProps) {
  const maxWidthClass = maxWidth === 'full' ? 'max-w-full' : `max-w-${maxWidth}`
  const centeredClass = centered ? 'mx-auto' : ''

  const paddingClasses =
    typeof padding === 'number'
      ? `px-${padding}`
      : Object.entries(padding)
          .map(([breakpoint, padValue]) =>
            breakpoint === 'xs' ? `px-${padValue}` : `${breakpoint}:px-${padValue}`
          )
          .join(' ')

  return (
    <div className={`${maxWidthClass} ${centeredClass} ${paddingClasses} ${className}`}>
      {children}
    </div>
  )
}

export interface ResponsiveStackProps {
  children: React.ReactNode
  direction?:
    | {
        xs?: 'row' | 'col'
        sm?: 'row' | 'col'
        md?: 'row' | 'col'
        lg?: 'row' | 'col'
        xl?: 'row' | 'col'
      }
    | 'row'
    | 'col'
  gap?:
    | {
        xs?: number
        sm?: number
        md?: number
        lg?: number
        xl?: number
      }
    | number
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  className?: string
}

export function ResponsiveStack({
  children,
  direction = 'col',
  gap = 4,
  align,
  justify,
  wrap = false,
  className = '',
}: ResponsiveStackProps) {
  const directionClasses =
    typeof direction === 'string'
      ? `flex-${direction}`
      : Object.entries(direction)
          .map(([breakpoint, dir]) =>
            breakpoint === 'xs' ? `flex-${dir}` : `${breakpoint}:flex-${dir}`
          )
          .join(' ')

  const gapClasses =
    typeof gap === 'number'
      ? `gap-${gap}`
      : Object.entries(gap)
          .map(([breakpoint, gapValue]) =>
            breakpoint === 'xs' ? `gap-${gapValue}` : `${breakpoint}:gap-${gapValue}`
          )
          .join(' ')

  const alignClass = align ? `items-${align}` : ''
  const justifyClass = justify ? `justify-${justify}` : ''
  const wrapClass = wrap ? 'flex-wrap' : ''

  return (
    <div
      className={`flex ${directionClasses} ${gapClasses} ${alignClass} ${justifyClass} ${wrapClass} ${className}`}
    >
      {children}
    </div>
  )
}

export default ResponsiveGrid
