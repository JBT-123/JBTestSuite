import { useState, useEffect } from 'react'

export interface ResponsiveFormLayoutProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  breakpoints?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  className?: string
  adaptiveColumns?: boolean
}

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

function ResponsiveFormLayout({
  children,
  columns = 1,
  gap = 'md',
  breakpoints = { mobile: 1, tablet: 2, desktop: 3 },
  className = '',
  adaptiveColumns = true,
}: ResponsiveFormLayoutProps) {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const getColumnClasses = () => {
    if (!adaptiveColumns) {
      return `grid-cols-${columns}`
    }

    const mobileColumns = breakpoints.mobile || 1
    const tabletColumns = breakpoints.tablet || 2
    const desktopColumns = breakpoints.desktop || columns

    return `grid-cols-${mobileColumns} md:grid-cols-${tabletColumns} lg:grid-cols-${desktopColumns}`
  }

  return (
    <div className={`grid ${getColumnClasses()} ${gapClasses[gap]} ${className}`}>{children}</div>
  )
}

export interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  fullWidth?: boolean
}

export function FormSection({
  title,
  description,
  children,
  className = '',
  collapsible = false,
  defaultCollapsed = false,
  fullWidth = false,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <div className={`${fullWidth ? 'col-span-full' : ''} ${className}`}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              {collapsible && (
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                  aria-expanded={!isCollapsed}
                  aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${title} section`}
                >
                  <svg
                    className={`h-5 w-5 transform transition-transform duration-200 ${
                      isCollapsed ? 'rotate-0' : 'rotate-180'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
      )}
      {(!collapsible || !isCollapsed) && <div className="space-y-4">{children}</div>}
    </div>
  )
}

export interface FormFieldGroupProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  className?: string
  wrap?: boolean
}

export function FormFieldGroup({
  children,
  orientation = 'vertical',
  className = '',
  wrap = true,
}: FormFieldGroupProps) {
  const flexClasses =
    orientation === 'horizontal' ? `flex ${wrap ? 'flex-wrap' : ''} gap-4` : 'space-y-4'

  return <div className={`${flexClasses} ${className}`}>{children}</div>
}

export interface ResponsiveFieldProps {
  children: React.ReactNode
  label?: string
  description?: string
  error?: string
  required?: boolean
  className?: string
  fullWidth?: boolean
  mobileFullWidth?: boolean
}

export function ResponsiveField({
  children,
  label,
  description,
  error,
  required = false,
  className = '',
  fullWidth = false,
  mobileFullWidth = true,
}: ResponsiveFieldProps) {
  const fieldClasses = `
    ${fullWidth ? 'col-span-full' : ''}
    ${mobileFullWidth ? 'col-span-full sm:col-span-1' : ''}
    ${className}
  `

  return (
    <div className={fieldClasses}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="Required">
              *
            </span>
          )}
        </label>
      )}
      {description && <p className="text-sm text-gray-600 mb-2">{description}</p>}
      {children}
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default ResponsiveFormLayout
