import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Alert from './Alert'

describe('Alert Component', () => {
  it('renders with basic props', () => {
    render(<Alert type="info" message="This is an info message" />)
    
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.getByText('This is an info message')).toBeInTheDocument()
  })

  it('renders with title', () => {
    render(
      <Alert 
        type="success" 
        title="Success!" 
        message="Operation completed successfully" 
      />
    )
    
    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument()
  })

  it('renders different alert types with correct styling', () => {
    const { rerender } = render(<Alert type="success" message="Success message" />)
    
    let alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-green-50', 'border-green-200')
    
    rerender(<Alert type="error" message="Error message" />)
    alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-red-50', 'border-red-200')
    
    rerender(<Alert type="warning" message="Warning message" />)
    alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200')
    
    rerender(<Alert type="info" message="Info message" />)
    alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-200')
  })

  it('renders correct icons for each type', () => {
    const { rerender } = render(<Alert type="success" message="Success message" />)
    
    let icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('text-green-400')
    
    rerender(<Alert type="error" message="Error message" />)
    icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toHaveClass('text-red-400')
    
    rerender(<Alert type="warning" message="Warning message" />)
    icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toHaveClass('text-yellow-400')
    
    rerender(<Alert type="info" message="Info message" />)
    icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toHaveClass('text-blue-400')
  })

  it('applies correct text colors for each type', () => {
    const { rerender } = render(
      <Alert type="success" title="Success" message="Success message" />
    )
    
    let title = screen.getByText('Success')
    let message = screen.getByText('Success message')
    expect(title).toHaveClass('text-green-800')
    expect(message).toHaveClass('text-green-700')
    
    rerender(<Alert type="error" title="Error" message="Error message" />)
    title = screen.getByText('Error')
    message = screen.getByText('Error message')
    expect(title).toHaveClass('text-red-800')
    expect(message).toHaveClass('text-red-700')
    
    rerender(<Alert type="warning" title="Warning" message="Warning message" />)
    title = screen.getByText('Warning')
    message = screen.getByText('Warning message')
    expect(title).toHaveClass('text-yellow-800')
    expect(message).toHaveClass('text-yellow-700')
    
    rerender(<Alert type="info" title="Info" message="Info message" />)
    title = screen.getByText('Info')
    message = screen.getByText('Info message')
    expect(title).toHaveClass('text-blue-800')
    expect(message).toHaveClass('text-blue-700')
  })

  it('renders dismiss button when dismissible is true', () => {
    const mockOnDismiss = vi.fn()
    
    render(
      <Alert 
        type="info" 
        message="Dismissible message" 
        dismissible={true} 
        onDismiss={mockOnDismiss}
      />
    )
    
    const dismissButton = screen.getByLabelText('Dismiss alert')
    expect(dismissButton).toBeInTheDocument()
  })

  it('does not render dismiss button when dismissible is false', () => {
    render(<Alert type="info" message="Non-dismissible message" dismissible={false} />)
    
    const dismissButton = screen.queryByLabelText('Dismiss alert')
    expect(dismissButton).not.toBeInTheDocument()
  })

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(<Alert type="info" message="Message without onDismiss" dismissible={true} />)
    
    const dismissButton = screen.queryByLabelText('Dismiss alert')
    expect(dismissButton).not.toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    const mockOnDismiss = vi.fn()
    
    render(
      <Alert 
        type="info" 
        message="Dismissible message" 
        dismissible={true} 
        onDismiss={mockOnDismiss}
      />
    )
    
    const dismissButton = screen.getByLabelText('Dismiss alert')
    fireEvent.click(dismissButton)
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(
      <Alert 
        type="info" 
        message="Custom styled message" 
        className="custom-alert-class"
      />
    )
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('custom-alert-class')
  })

  it('applies correct spacing when title is present', () => {
    render(
      <Alert 
        type="info" 
        title="Title" 
        message="Message with title" 
      />
    )
    
    const message = screen.getByText('Message with title')
    expect(message).toHaveClass('mt-2')
  })

  it('does not apply title spacing when title is not present', () => {
    render(<Alert type="info" message="Message without title" />)
    
    const message = screen.getByText('Message without title')
    expect(message).not.toHaveClass('mt-2')
  })

  it('has proper accessibility attributes', () => {
    render(<Alert type="error" message="Error message" />)
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('role', 'alert')
  })

  it('renders dismiss button with proper accessibility', () => {
    const mockOnDismiss = vi.fn()
    
    render(
      <Alert 
        type="warning" 
        message="Warning message" 
        dismissible={true} 
        onDismiss={mockOnDismiss}
      />
    )
    
    const dismissButton = screen.getByLabelText('Dismiss alert')
    expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss alert')
    expect(dismissButton).toHaveAttribute('type', 'button')
  })

  it('handles keyboard navigation for dismiss button', () => {
    const mockOnDismiss = vi.fn()
    
    render(
      <Alert 
        type="error" 
        message="Error message" 
        dismissible={true} 
        onDismiss={mockOnDismiss}
      />
    )
    
    const dismissButton = screen.getByLabelText('Dismiss alert')
    
    fireEvent.keyDown(dismissButton, { key: 'Enter' })
    fireEvent.keyDown(dismissButton, { key: 'Space' })
    
    // The button should be focusable and have focus styles
    expect(dismissButton).toHaveClass('focus:outline-none', 'focus:ring-2')
  })

  it('renders alert with all elements properly structured', () => {
    const mockOnDismiss = vi.fn()
    
    render(
      <Alert 
        type="success" 
        title="Success Title" 
        message="Success message content" 
        dismissible={true} 
        onDismiss={mockOnDismiss}
        className="test-class"
      />
    )
    
    const alert = screen.getByRole('alert')
    const icon = alert.querySelector('svg')
    const title = screen.getByText('Success Title')
    const message = screen.getByText('Success message content')
    const dismissButton = screen.getByLabelText('Dismiss alert')
    
    expect(alert).toHaveClass('test-class', 'bg-green-50')
    expect(icon).toBeInTheDocument()
    expect(title).toBeInTheDocument()
    expect(message).toBeInTheDocument()
    expect(dismissButton).toBeInTheDocument()
  })

  it('maintains consistent layout structure', () => {
    render(<Alert type="info" title="Title" message="Message" />)
    
    const alert = screen.getByRole('alert')
    const flexContainer = alert.querySelector('.flex')
    const iconContainer = flexContainer?.querySelector('.flex-shrink-0')
    const contentContainer = flexContainer?.querySelector('.ml-3.flex-1')
    
    expect(flexContainer).toBeInTheDocument()
    expect(iconContainer).toBeInTheDocument()
    expect(contentContainer).toBeInTheDocument()
  })

  it('renders multiple alerts independently', () => {
    render(
      <div>
        <Alert type="success" message="First alert" />
        <Alert type="error" message="Second alert" />
      </div>
    )
    
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(2)
    
    expect(alerts[0]).toHaveClass('bg-green-50')
    expect(alerts[1]).toHaveClass('bg-red-50')
    
    expect(screen.getByText('First alert')).toBeInTheDocument()
    expect(screen.getByText('Second alert')).toBeInTheDocument()
  })

  it('handles long messages properly', () => {
    const longMessage = 'This is a very long alert message that should wrap properly and maintain good readability across multiple lines of text content.'
    
    render(<Alert type="warning" message={longMessage} />)
    
    const message = screen.getByText(longMessage)
    expect(message).toBeInTheDocument()
    expect(message).toHaveClass('text-sm')
  })

  it('combines base classes with type-specific classes correctly', () => {
    render(<Alert type="error" message="Error message" className="additional-class" />)
    
    const alert = screen.getByRole('alert')
    const classes = alert.className
    
    // Should include base classes
    expect(classes).toContain('rounded-md border p-4')
    // Should include type-specific classes  
    expect(classes).toContain('bg-red-50 border-red-200')
    // Should include custom class
    expect(classes).toContain('additional-class')
  })
})