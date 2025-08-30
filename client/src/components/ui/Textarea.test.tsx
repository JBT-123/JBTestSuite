import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Textarea from './Textarea'

describe('Textarea Component', () => {
  it('renders with basic props', () => {
    render(<Textarea />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveClass('block', 'px-3', 'py-2', 'border', 'rounded-md')
  })

  it('renders with label', () => {
    render(<Textarea label="Description" />)
    
    const label = screen.getByText('Description')
    const textarea = screen.getByRole('textbox')
    
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('for', 'description')
    expect(textarea).toHaveAttribute('id', 'description')
  })

  it('renders with custom id', () => {
    render(<Textarea id="custom-textarea" label="Description" />)
    
    const label = screen.getByText('Description')
    const textarea = screen.getByRole('textbox')
    
    expect(label).toHaveAttribute('for', 'custom-textarea')
    expect(textarea).toHaveAttribute('id', 'custom-textarea')
  })

  it('handles text input and change events', () => {
    const handleChange = vi.fn()
    render(<Textarea onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello World' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(textarea).toHaveValue('Hello World')
  })

  it('renders error state correctly', () => {
    render(<Textarea error="This field is required" />)
    
    const textarea = screen.getByRole('textbox')
    const errorMessage = screen.getByRole('alert')
    
    expect(textarea).toHaveClass('border-red-300', 'bg-red-50', 'hover:border-red-400')
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveTextContent('This field is required')
    expect(errorMessage).toHaveClass('text-red-600')
  })

  it('renders helper text when no error', () => {
    render(<Textarea helperText="Please provide detailed description" />)
    
    const helperText = screen.getByText('Please provide detailed description')
    expect(helperText).toBeInTheDocument()
    expect(helperText).toHaveClass('text-gray-500')
  })

  it('does not render helper text when error is present', () => {
    render(
      <Textarea 
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
    render(<Textarea fullWidth />)
    
    const textarea = screen.getByRole('textbox')
    const container = textarea.closest('div')
    
    expect(textarea).toHaveClass('w-full')
    expect(container).toHaveClass('w-full')
  })

  it('does not apply fullWidth class when fullWidth is false', () => {
    render(<Textarea fullWidth={false} />)
    
    const textarea = screen.getByRole('textbox')
    const container = textarea.closest('div')
    
    expect(textarea).not.toHaveClass('w-full')
    expect(container).not.toHaveClass('w-full')
  })

  it('handles disabled state', () => {
    render(<Textarea disabled />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-class" />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('custom-class')
  })

  it('applies resize classes correctly', () => {
    const { rerender } = render(<Textarea resize="none" />)
    expect(screen.getByRole('textbox')).toHaveClass('resize-none')

    rerender(<Textarea resize="both" />)
    expect(screen.getByRole('textbox')).toHaveClass('resize')

    rerender(<Textarea resize="horizontal" />)
    expect(screen.getByRole('textbox')).toHaveClass('resize-x')

    rerender(<Textarea resize="vertical" />)
    expect(screen.getByRole('textbox')).toHaveClass('resize-y')
  })

  it('uses vertical resize as default', () => {
    render(<Textarea />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('resize-y')
  })

  it('sets default rows attribute', () => {
    render(<Textarea />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('rows', '3')
  })

  it('accepts custom rows attribute', () => {
    render(<Textarea rows={5} />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('rows', '5')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Textarea ref={ref} />)
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement))
  })

  it('passes through additional HTML attributes', () => {
    render(
      <Textarea 
        data-testid="custom-textarea"
        aria-label="Custom textarea"
        required
        placeholder="Enter text here"
        maxLength={100}
      />
    )
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('data-testid', 'custom-textarea')
    expect(textarea).toHaveAttribute('aria-label', 'Custom textarea')
    expect(textarea).toBeRequired()
    expect(textarea).toHaveAttribute('placeholder', 'Enter text here')
    expect(textarea).toHaveAttribute('maxlength', '100')
  })

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()
    
    render(<Textarea onFocus={handleFocus} onBlur={handleBlur} />)
    
    const textarea = screen.getByRole('textbox')
    
    fireEvent.focus(textarea)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(textarea)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('handles keyboard events', () => {
    const handleKeyDown = vi.fn()
    const handleKeyUp = vi.fn()
    
    render(<Textarea onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />)
    
    const textarea = screen.getByRole('textbox')
    
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(handleKeyDown).toHaveBeenCalledTimes(1)
    
    fireEvent.keyUp(textarea, { key: 'Enter' })
    expect(handleKeyUp).toHaveBeenCalledTimes(1)
  })

  it('maintains proper styling hierarchy', () => {
    render(<Textarea error="Error" className="custom-class" resize="none" />)
    
    const textarea = screen.getByRole('textbox')
    const classes = textarea.className
    
    // Should include base classes
    expect(classes).toContain('block px-3 py-2')
    // Should include error classes
    expect(classes).toContain('border-red-300')
    // Should include resize classes
    expect(classes).toContain('resize-none')
    // Should include custom class
    expect(classes).toContain('custom-class')
  })

  it('has proper accessibility attributes', () => {
    render(
      <Textarea 
        label="Accessible Textarea" 
        error="Required field"
        required
      />
    )
    
    const textarea = screen.getByRole('textbox')
    const label = screen.getByText('Accessible Textarea')
    const errorMessage = screen.getByRole('alert')
    
    expect(textarea).toBeRequired()
    expect(label).toHaveAttribute('for', textarea.id)
    expect(errorMessage).toHaveAttribute('role', 'alert')
  })

  it('handles multiline text correctly', () => {
    render(<Textarea />)
    
    const textarea = screen.getByRole('textbox')
    const multilineText = 'Line 1\nLine 2\nLine 3'
    
    fireEvent.change(textarea, { target: { value: multilineText } })
    expect(textarea).toHaveValue(multilineText)
  })

  it('maintains value when props change', () => {
    const { rerender } = render(<Textarea value="Initial value" readOnly />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('Initial value')
    
    rerender(<Textarea value="Updated value" readOnly />)
    expect(textarea).toHaveValue('Updated value')
  })
})