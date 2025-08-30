import React, { useEffect, useRef } from 'react'

export interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        bg-blue-600 text-white px-4 py-2 rounded-md font-medium 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        z-50 transition-all duration-200
        ${className}
      `}
    >
      {children}
    </a>
  )
}

export interface VisuallyHiddenProps {
  children: React.ReactNode
  asChild?: boolean
}

export function VisuallyHidden({ children, asChild = false }: VisuallyHiddenProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `sr-only ${children.props.className || ''}`,
    })
  }

  return <span className="sr-only">{children}</span>
}

export interface LiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  className?: string
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'all',
  className = '',
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
    >
      {children}
    </div>
  )
}

export interface FocusTrapProps {
  children: React.ReactNode
  enabled?: boolean
  className?: string
}

export function FocusTrap({ children, enabled = true, className = '' }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLElement | null>(null)
  const lastFocusableRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    firstFocusableRef.current = focusableElements[0]
    lastFocusableRef.current = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault()
          lastFocusableRef.current?.focus()
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault()
          firstFocusableRef.current?.focus()
        }
      }
    }

    firstFocusableRef.current?.focus()
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

export interface KeyboardNavigationProps {
  children: React.ReactNode
  onEscape?: () => void
  onEnter?: () => void
  className?: string
}

export function KeyboardNavigation({
  children,
  onEscape,
  onEnter,
  className = '',
}: KeyboardNavigationProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        onEscape?.()
        break
      case 'Enter':
        if (onEnter) {
          e.preventDefault()
          onEnter()
        }
        break
    }
  }

  return (
    <div onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  )
}

export interface AriaLabelledByProps {
  labelledBy: string
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
  className?: string
  [key: string]: any
}

export function AriaLabelledBy({
  labelledBy,
  children,
  as: Component = 'div',
  className = '',
  ...props
}: AriaLabelledByProps) {
  return (
    <Component aria-labelledby={labelledBy} className={className} {...props}>
      {children}
    </Component>
  )
}

export interface AriaDescribedByProps {
  describedBy: string
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
  className?: string
  [key: string]: any
}

export function AriaDescribedBy({
  describedBy,
  children,
  as: Component = 'div',
  className = '',
  ...props
}: AriaDescribedByProps) {
  return (
    <Component aria-describedby={describedBy} className={className} {...props}>
      {children}
    </Component>
  )
}

export interface AccessibleIconProps {
  children: React.ReactNode
  label: string
  decorative?: boolean
  className?: string
}

export function AccessibleIcon({
  children,
  label,
  decorative = false,
  className = '',
}: AccessibleIconProps) {
  if (decorative) {
    return (
      <span aria-hidden="true" className={className}>
        {children}
      </span>
    )
  }

  return (
    <span aria-label={label} role="img" className={className}>
      {children}
    </span>
  )
}

export interface HighContrastProps {
  children: React.ReactNode
  className?: string
}

export function HighContrast({ children, className = '' }: HighContrastProps) {
  return (
    <div
      className={`
        ${className}
        contrast-more:border-2 contrast-more:border-current
        forced-colors:border-2 forced-colors:border-[ButtonBorder]
      `}
    >
      {children}
    </div>
  )
}

export interface ReducedMotionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function ReducedMotion({ children, fallback, className = '' }: ReducedMotionProps) {
  return (
    <>
      <div className={`motion-safe:block motion-reduce:hidden ${className}`}>
        {children}
      </div>
      {fallback && (
        <div className={`motion-safe:hidden motion-reduce:block ${className}`}>
          {fallback}
        </div>
      )}
    </>
  )
}

export interface RoleProps {
  children: React.ReactNode
  role: 
    | 'alert'
    | 'alertdialog'
    | 'application'
    | 'article'
    | 'banner'
    | 'button'
    | 'cell'
    | 'checkbox'
    | 'columnheader'
    | 'combobox'
    | 'complementary'
    | 'contentinfo'
    | 'dialog'
    | 'document'
    | 'form'
    | 'grid'
    | 'gridcell'
    | 'group'
    | 'heading'
    | 'img'
    | 'link'
    | 'list'
    | 'listbox'
    | 'listitem'
    | 'main'
    | 'menu'
    | 'menubar'
    | 'menuitem'
    | 'navigation'
    | 'option'
    | 'presentation'
    | 'progressbar'
    | 'radio'
    | 'radiogroup'
    | 'region'
    | 'row'
    | 'rowgroup'
    | 'rowheader'
    | 'search'
    | 'separator'
    | 'slider'
    | 'spinbutton'
    | 'status'
    | 'tab'
    | 'table'
    | 'tablist'
    | 'tabpanel'
    | 'textbox'
    | 'timer'
    | 'toolbar'
    | 'tooltip'
    | 'tree'
    | 'treegrid'
    | 'treeitem'
  as?: keyof JSX.IntrinsicElements
  className?: string
  [key: string]: any
}

export function Role({
  children,
  role,
  as: Component = 'div',
  className = '',
  ...props
}: RoleProps) {
  return (
    <Component role={role} className={className} {...props}>
      {children}
    </Component>
  )
}

export interface LandmarkProps {
  children: React.ReactNode
  label?: string
  className?: string
}

export function Main({ children, label, className = '', ...props }: LandmarkProps) {
  return (
    <main aria-label={label} className={className} {...props}>
      {children}
    </main>
  )
}

export function Nav({ children, label, className = '', ...props }: LandmarkProps) {
  return (
    <nav aria-label={label} className={className} {...props}>
      {children}
    </nav>
  )
}

export function Section({ children, label, className = '', ...props }: LandmarkProps) {
  return (
    <section aria-label={label} className={className} {...props}>
      {children}
    </section>
  )
}

export function Aside({ children, label, className = '', ...props }: LandmarkProps) {
  return (
    <aside aria-label={label} className={className} {...props}>
      {children}
    </aside>
  )
}

export function Header({ children, className = '', ...props }: Omit<LandmarkProps, 'label'>) {
  return (
    <header className={className} {...props}>
      {children}
    </header>
  )
}

export function Footer({ children, className = '', ...props }: Omit<LandmarkProps, 'label'>) {
  return (
    <footer className={className} {...props}>
      {children}
    </footer>
  )
}