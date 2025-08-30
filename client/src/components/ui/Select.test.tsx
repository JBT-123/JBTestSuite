import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Select, { type SelectOption } from './Select'

const mockOptions: SelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
]

describe('Select Component', () => {
  it('renders with basic props', () => {
    render(<Select options={mockOptions} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select).toHaveClass('block', 'px-3', 'py-2', 'border', 'rounded-md')
  })

  it('renders with label', () => {
    render(<Select label="Test Label" options={mockOptions} />)
    
    const label = screen.getByText('Test Label')
    const select = screen.getByRole('combobox')
    
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('for', 'test-label')
    expect(select).toHaveAttribute('id', 'test-label')
  })

  it('renders with custom id', () => {
    render(<Select id="custom-id" label="Test Label" options={mockOptions} />)
    
    const label = screen.getByText('Test Label')
    const select = screen.getByRole('combobox')
    
    expect(label).toHaveAttribute('for', 'custom-id')
    expect(select).toHaveAttribute('id', 'custom-id')
  })

  it('renders all options correctly', () => {
    render(<Select options={mockOptions} />)
    
    const option1 = screen.getByRole('option', { name: 'Option 1' })
    const option2 = screen.getByRole('option', { name: 'Option 2' })
    const option3 = screen.getByRole('option', { name: 'Option 3' })
    
    expect(option1).toBeInTheDocument()
    expect(option1).toHaveValue('option1')
    expect(option1).not.toBeDisabled()
    
    expect(option2).toBeInTheDocument()
    expect(option2).toHaveValue('option2')
    expect(option2).not.toBeDisabled()
    
    expect(option3).toBeInTheDocument()
    expect(option3).toHaveValue('option3')
    expect(option3).toBeDisabled()
  })

  it('renders placeholder when provided', () => {
    render(<Select options={mockOptions} placeholder="Choose an option" />)
    
    const placeholder = screen.getByRole('option', { name: 'Choose an option' })
    expect(placeholder).toBeInTheDocument()
    expect(placeholder).toHaveValue('')
    expect(placeholder).toBeDisabled()
  })

  it('handles value selection', () => {
    const handleChange = vi.fn()
    render(<Select options={mockOptions} onChange={handleChange} />)
    
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'option2' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(select).toHaveValue('option2')
  })

  it('renders error state correctly', () => {
    render(<Select options={mockOptions} error="This field is required" />)
    
    const select = screen.getByRole('combobox')
    const errorMessage = screen.getByRole('alert')
    
    expect(select).toHaveClass('border-red-300', 'hover:border-red-400')
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveTextContent('This field is required')
    expect(errorMessage).toHaveClass('text-red-600')
  })

  it('renders helper text when no error', () => {
    render(<Select options={mockOptions} helperText="Choose your preferred option" />)
    
    const helperText = screen.getByText('Choose your preferred option')
    expect(helperText).toBeInTheDocument()
    expect(helperText).toHaveClass('text-gray-500')
  })

  it('does not render helper text when error is present', () => {
    render(
      <Select 
        options={mockOptions} 
        error="Error message" 
        helperText="Helper text should not show" 
      />
    )
    
    const errorMessage = screen.getByText('Error message')
    const helperText = screen.queryByText('Helper text should not show')
    
    expect(errorMessage).toBeInTheDocument()
    expect(helperText).not.toBeInTheDocument()
  })

  it('applies fullWidth class when fullWidth is true', () => {
    render(<Select options={mockOptions} fullWidth />)
    
    const select = screen.getByRole('combobox')
    const relativeDiv = select.parentElement
    const outerContainer = relativeDiv?.parentElement
    
    expect(select).toHaveClass('w-full')
    expect(outerContainer).toHaveClass('w-full')
  })

  it('does not apply fullWidth class when fullWidth is false', () => {
    render(<Select options={mockOptions} fullWidth={false} />)
    
    const select = screen.getByRole('combobox')
    const relativeDiv = select.parentElement
    const outerContainer = relativeDiv?.parentElement
    
    expect(select).not.toHaveClass('w-full')
    expect(outerContainer).not.toHaveClass('w-full')
  })

  it('handles disabled state', () => {
    render(<Select options={mockOptions} disabled />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
    expect(select).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
  })

  it('applies custom className', () => {
    render(<Select options={mockOptions} className="custom-class" />)
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('custom-class')
  })

  it('renders dropdown icon', () => {
    render(<Select options={mockOptions} />)
    
    const container = screen.getByRole('combobox').parentElement
    const icon = container?.querySelector('svg')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('w-4', 'h-4', 'text-gray-400')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Select ref={ref} options={mockOptions} />)
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLSelectElement))
  })

  it('passes through additional HTML attributes', () => {
    render(
      <Select 
        options={mockOptions} 
        data-testid="custom-select"
        aria-label="Custom select"
        required
      />
    )
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveAttribute('data-testid', 'custom-select')
    expect(select).toHaveAttribute('aria-label', 'Custom select')
    expect(select).toBeRequired()
  })

  it('handles empty options array', () => {
    render(<Select options={[]} placeholder="No options available" />)
    
    const select = screen.getByRole('combobox')
    const placeholder = screen.getByRole('option', { name: 'No options available' })
    
    expect(select).toBeInTheDocument()
    expect(placeholder).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()
    
    render(<Select options={mockOptions} onFocus={handleFocus} onBlur={handleBlur} />)
    
    const select = screen.getByRole('combobox')
    
    fireEvent.focus(select)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(select)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('maintains proper styling hierarchy', () => {
    render(<Select options={mockOptions} error="Error" className="custom-class" />)
    
    const select = screen.getByRole('combobox')
    const classes = select.className
    
    // Should include base classes
    expect(classes).toContain('block px-3 py-2')
    // Should include error classes
    expect(classes).toContain('border-red-300')
    // Should include custom class
    expect(classes).toContain('custom-class')
  })

  it('has proper accessibility attributes', () => {
    render(
      <Select 
        options={mockOptions} 
        label="Accessible Select" 
        error="Required field"
        required
      />
    )
    
    const select = screen.getByRole('combobox')
    const label = screen.getByText('Accessible Select')
    const errorMessage = screen.getByRole('alert')
    
    expect(select).toBeRequired()
    expect(label).toHaveAttribute('for', select.id)
    expect(errorMessage).toHaveAttribute('role', 'alert')
  })
})