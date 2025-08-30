import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Checkbox from './Checkbox'

describe('Checkbox Component', () => {
  it('renders with basic props', () => {
    render(<Checkbox />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toHaveClass('h-4', 'w-4', 'text-blue-600', 'border-gray-300', 'rounded')
  })

  it('renders with label', () => {
    render(<Checkbox label="Accept terms" />)
    
    const label = screen.getByText('Accept terms')
    const checkbox = screen.getByRole('checkbox')
    
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('for', 'accept-terms')
    expect(checkbox).toHaveAttribute('id', 'accept-terms')
    expect(label).toHaveClass('cursor-pointer')
  })

  it('renders with custom id', () => {
    render(<Checkbox id="custom-checkbox" label="Accept terms" />)
    
    const label = screen.getByText('Accept terms')
    const checkbox = screen.getByRole('checkbox')
    
    expect(label).toHaveAttribute('for', 'custom-checkbox')
    expect(checkbox).toHaveAttribute('id', 'custom-checkbox')
  })

  it('handles checked state changes', () => {
    const handleChange = vi.fn()
    render(<Checkbox onChange={handleChange} />)
    
    const checkbox = screen.getByRole('checkbox')
    
    expect(checkbox).not.toBeChecked()
    
    fireEvent.click(checkbox)
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(checkbox).toBeChecked()
  })

  it('renders with description', () => {
    render(<Checkbox label="Newsletter" description="Receive updates about new features" />)
    
    const description = screen.getByText('Receive updates about new features')
    expect(description).toBeInTheDocument()
    expect(description).toHaveClass('text-gray-500')
  })

  it('renders error state correctly', () => {
    render(<Checkbox label="Required field" error="This field is required" />)
    
    const checkbox = screen.getByRole('checkbox')
    const label = screen.getByText('Required field')
    const errorMessage = screen.getByRole('alert')
    
    expect(checkbox).toHaveClass('border-red-300', 'focus:ring-red-500')
    expect(label).toHaveClass('text-red-700')
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveTextContent('This field is required')
    expect(errorMessage).toHaveClass('text-red-600')
  })

  it('handles disabled state', () => {
    render(<Checkbox label="Disabled checkbox" disabled />)
    
    const checkbox = screen.getByRole('checkbox')
    const label = screen.getByText('Disabled checkbox')
    
    expect(checkbox).toBeDisabled()
    expect(checkbox).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    expect(label).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('handles disabled state with description', () => {
    render(
      <Checkbox 
        label="Disabled checkbox" 
        description="This is disabled"
        disabled 
      />
    )
    
    const description = screen.getByText('This is disabled')
    expect(description).toHaveClass('opacity-50')
  })

  it('handles indeterminate state', () => {
    const ref = vi.fn()
    render(<Checkbox ref={ref} indeterminate />)
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement))
    const checkbox = ref.mock.calls[0][0] as HTMLInputElement
    expect(checkbox.indeterminate).toBe(true)
  })

  it('does not set indeterminate when false', () => {
    const ref = vi.fn()
    render(<Checkbox ref={ref} indeterminate={false} />)
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement))
    const checkbox = ref.mock.calls[0][0] as HTMLInputElement
    expect(checkbox.indeterminate).toBe(false)
  })

  it('applies custom className', () => {
    render(<Checkbox className="custom-class" />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveClass('custom-class')
  })

  it('forwards ref correctly with function ref', () => {
    const ref = vi.fn()
    render(<Checkbox ref={ref} />)
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement))
  })

  it('forwards ref correctly with object ref', () => {
    const ref = { current: null }
    render(<Checkbox ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('passes through additional HTML attributes', () => {
    render(
      <Checkbox 
        data-testid="custom-checkbox"
        aria-label="Custom checkbox"
        required
        value="checkbox-value"
      />
    )
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('data-testid', 'custom-checkbox')
    expect(checkbox).toHaveAttribute('aria-label', 'Custom checkbox')
    expect(checkbox).toBeRequired()
    expect(checkbox).toHaveAttribute('value', 'checkbox-value')
  })

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()
    
    render(<Checkbox onFocus={handleFocus} onBlur={handleBlur} />)
    
    const checkbox = screen.getByRole('checkbox')
    
    fireEvent.focus(checkbox)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(checkbox)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('renders without label and description', () => {
    render(<Checkbox />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    
    const labelContainer = checkbox.closest('div')?.querySelector('.ml-3')
    expect(labelContainer).not.toBeInTheDocument()
  })

  it('renders with label but without description', () => {
    render(<Checkbox label="Just a label" />)
    
    const label = screen.getByText('Just a label')
    const description = screen.queryByText(/description/i)
    
    expect(label).toBeInTheDocument()
    expect(description).not.toBeInTheDocument()
  })

  it('renders with description but without label', () => {
    render(<Checkbox description="Just a description" />)
    
    const description = screen.getByText('Just a description')
    const label = screen.queryByRole('label')
    
    expect(description).toBeInTheDocument()
    expect(label).not.toBeInTheDocument()
  })

  it('maintains proper styling hierarchy', () => {
    render(<Checkbox error="Error" className="custom-class" />)
    
    const checkbox = screen.getByRole('checkbox')
    const classes = checkbox.className
    
    // Should include base classes
    expect(classes).toContain('h-4 w-4 text-blue-600')
    // Should include error classes
    expect(classes).toContain('border-red-300')
    // Should include custom class
    expect(classes).toContain('custom-class')
  })

  it('has proper accessibility attributes', () => {
    render(
      <Checkbox 
        label="Accessible Checkbox" 
        error="Required field"
        required
      />
    )
    
    const checkbox = screen.getByRole('checkbox')
    const label = screen.getByText('Accessible Checkbox')
    const errorMessage = screen.getByRole('alert')
    
    expect(checkbox).toBeRequired()
    expect(label).toHaveAttribute('for', checkbox.id)
    expect(errorMessage).toHaveAttribute('role', 'alert')
  })

  it('handles controlled component behavior', () => {
    const { rerender } = render(<Checkbox checked={false} readOnly />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
    
    rerender(<Checkbox checked={true} readOnly />)
    expect(checkbox).toBeChecked()
  })

  it('handles keyboard events', () => {
    const handleKeyDown = vi.fn()
    const handleKeyUp = vi.fn()
    
    render(<Checkbox onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />)
    
    const checkbox = screen.getByRole('checkbox')
    
    fireEvent.keyDown(checkbox, { key: 'Space' })
    expect(handleKeyDown).toHaveBeenCalledTimes(1)
    
    fireEvent.keyUp(checkbox, { key: 'Space' })
    expect(handleKeyUp).toHaveBeenCalledTimes(1)
  })

  it('properly handles ref with indeterminate state change', () => {
    const ref = vi.fn()
    const { rerender } = render(<Checkbox ref={ref} indeterminate={false} />)
    
    const firstCall = ref.mock.calls.find(call => call[0] !== null)
    expect(firstCall).toBeTruthy()
    let checkbox = firstCall?.[0] as HTMLInputElement
    expect(checkbox?.indeterminate).toBe(false)
    
    rerender(<Checkbox ref={ref} indeterminate={true} />)
    const secondCall = ref.mock.calls.slice().reverse().find(call => call[0] !== null)
    checkbox = secondCall?.[0] as HTMLInputElement
    expect(checkbox?.indeterminate).toBe(true)
  })
})