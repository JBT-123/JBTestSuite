import React, { forwardRef } from 'react'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
  indeterminate?: boolean
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, indeterminate = false, className = '', id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const checkboxClasses = [
      'h-4 w-4 text-blue-600 border-gray-300 rounded transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      error ? 'border-red-300 focus:ring-red-500' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={(node) => {
              if (node) node.indeterminate = indeterminate
              if (typeof ref === 'function') {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
            }}
            id={checkboxId}
            type="checkbox"
            className={checkboxClasses}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                htmlFor={checkboxId}
                className={`font-medium cursor-pointer ${
                  error ? 'text-red-700' : 'text-gray-700'
                } ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={`text-gray-500 ${props.disabled ? 'opacity-50' : ''}`}>{description}</p>
            )}
            {error && (
              <p className="text-red-600 mt-1" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
