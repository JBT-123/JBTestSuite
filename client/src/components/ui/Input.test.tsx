import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { user } from '../../tests/utils'
import Input from './Input'

describe('Input', () => {
  describe('Basic Rendering', () => {
    it('renders basic input correctly', () => {
      render(<Input placeholder="Enter text" />)
      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeInTheDocument()
      expect(input.tagName.toLowerCase()).toBe('input')
    })

    it('renders with label', () => {
      render(<Input label="Username" />)
      const label = screen.getByText('Username')
      const input = screen.getByLabelText('Username')
      
      expect(label).toBeInTheDocument()
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('id', 'username')
    })

    it('applies custom className', () => {
      render(<Input className="custom-class" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('border-gray-300', 'bg-white')
    })

    it('renders filled variant correctly', () => {
      render(<Input variant="filled" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('border-gray-200', 'bg-gray-50')
    })
  })

  describe('States', () => {
    it('displays error state correctly', () => {
      render(<Input error="This field is required" label="Email" />)
      
      const input = screen.getByLabelText('Email')
      const errorMessage = screen.getByRole('alert')
      
      expect(input).toHaveClass('border-red-300', 'bg-red-50')
      expect(errorMessage).toHaveTextContent('This field is required')
    })

    it('displays helper text when no error', () => {
      render(<Input helperText="Enter a valid email address" label="Email" />)
      
      const helperText = screen.getByText('Enter a valid email address')
      expect(helperText).toBeInTheDocument()
      expect(helperText).toHaveClass('text-gray-500')
    })

    it('shows error instead of helper text when both provided', () => {
      render(
        <Input 
          error="This field is required" 
          helperText="Enter a valid email address"
          label="Email"
        />
      )
      
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
      expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument()
    })

    it('is disabled when disabled prop is true', () => {
      render(<Input disabled data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:opacity-50')
    })
  })

  describe('Icons', () => {
    const leftIcon = <span data-testid="left-icon">📧</span>
    const rightIcon = <span data-testid="right-icon">👁️</span>

    it('renders left icon correctly', () => {
      render(<Input leftIcon={leftIcon} data-testid="input" />)
      const input = screen.getByTestId('input')
      const icon = screen.getByTestId('left-icon')
      
      expect(icon).toBeInTheDocument()
      expect(input).toHaveClass('pl-10')
    })

    it('renders right icon correctly', () => {
      render(<Input rightIcon={rightIcon} data-testid="input" />)
      const input = screen.getByTestId('input')
      const icon = screen.getByTestId('right-icon')
      
      expect(icon).toBeInTheDocument()
      expect(input).toHaveClass('pr-10')
    })

    it('renders both icons correctly', () => {
      render(<Input leftIcon={leftIcon} rightIcon={rightIcon} data-testid="input" />)
      const input = screen.getByTestId('input')
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
      expect(input).toHaveClass('pl-10', 'pr-10')
    })
  })

  describe('Full Width', () => {
    it('applies full width class when fullWidth is true', () => {
      const { container } = render(<Input fullWidth data-testid="input" />)
      const input = screen.getByTestId('input')
      const wrapper = container.firstChild
      
      expect(input).toHaveClass('w-full')
      expect(wrapper).toHaveClass('w-full')
    })

    it('does not apply full width class by default', () => {
      const { container } = render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      const wrapper = container.firstChild
      
      expect(input).not.toHaveClass('w-full')
      expect(wrapper).not.toHaveClass('w-full')
    })
  })

  describe('Interactions', () => {
    it('handles onChange events', async () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} data-testid="input" />)
      
      const input = screen.getByTestId('input')
      await user.type(input, 'test value')
      
      expect(handleChange).toHaveBeenCalled()
      expect(input).toHaveValue('test value')
    })

    it('handles focus and blur events', async () => {
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      
      render(
        <Input 
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid="input"
        />
      )
      
      const input = screen.getByTestId('input')
      
      await user.click(input)
      expect(handleFocus).toHaveBeenCalledTimes(1)
      
      await user.tab()
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes with error', () => {
      render(<Input error="Invalid input" label="Email" />)
      
      const input = screen.getByLabelText('Email')
      const errorMessage = screen.getByRole('alert')
      
      expect(errorMessage).toHaveAttribute('role', 'alert')
      expect(errorMessage).toHaveClass('text-red-600')
    })

    it('generates correct id from label', () => {
      render(<Input label="First Name" />)
      const input = screen.getByLabelText('First Name')
      expect(input).toHaveAttribute('id', 'first-name')
    })

    it('uses custom id when provided', () => {
      render(<Input label="Email Address" id="email-field" />)
      const input = screen.getByLabelText('Email Address')
      expect(input).toHaveAttribute('id', 'email-field')
    })

    it('supports ARIA attributes', () => {
      render(
        <Input 
          aria-describedby="description"
          aria-required="true"
          data-testid="input"
        />
      )
      
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-describedby', 'description')
      expect(input).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('Input Types', () => {
    it('supports different input types', () => {
      const { rerender } = render(<Input type="password" data-testid="input" />)
      let input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'password')

      rerender(<Input type="email" data-testid="input" />)
      input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'email')

      rerender(<Input type="number" data-testid="input" />)
      input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'number')
    })
  })
})