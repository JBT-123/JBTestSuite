import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { user } from '../../tests/utils'
import Button from './Button'

describe('Button', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      const { getByRole } = render(<Button>Click me</Button>)
      const button = getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Click me')
    })

    it('applies default variant and size classes', () => {
      const { getByRole } = render(<Button>Default</Button>)
      const button = getByRole('button')
      expect(button).toHaveClass('bg-blue-600', 'text-white', 'h-10', 'px-4')
    })

    it('applies custom className', () => {
      const { getByRole } = render(
        <Button className="custom-class">Button</Button>
      )
      const button = getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    it('renders primary variant correctly', () => {
      const { getByRole } = render(
        <Button variant="primary">Primary</Button>
      )
      const button = getByRole('button')
      expect(button).toHaveClass('bg-blue-600', 'text-white')
    })

    it('renders secondary variant correctly', () => {
      const { getByRole } = render(
        <Button variant="secondary">Secondary</Button>
      )
      const button = getByRole('button')
      expect(button).toHaveClass('bg-gray-100', 'text-gray-900')
    })

    it('renders danger variant correctly', () => {
      const { getByRole } = render(
        <Button variant="danger">Danger</Button>
      )
      const button = getByRole('button')
      expect(button).toHaveClass('bg-red-600', 'text-white')
    })

    it('renders ghost variant correctly', () => {
      const { getByRole } = render(
        <Button variant="ghost">Ghost</Button>
      )
      const button = getByRole('button')
      expect(button).toHaveClass('text-gray-700')
    })

    it('renders outline variant correctly', () => {
      const { getByRole } = render(
        <Button variant="outline">Outline</Button>
      )
      const button = getByRole('button')
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-transparent')
    })
  })

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      const { getByRole } = render(<Button size="sm">Small</Button>)
      const button = getByRole('button')
      expect(button).toHaveClass('h-8', 'px-3', 'text-sm')
    })

    it('renders medium size correctly (default)', () => {
      const { getByRole } = render(<Button size="md">Medium</Button>)
      const button = getByRole('button')
      expect(button).toHaveClass('h-10', 'px-4', 'text-sm')
    })

    it('renders large size correctly', () => {
      const { getByRole } = render(<Button size="lg">Large</Button>)
      const button = getByRole('button')
      expect(button).toHaveClass('h-12', 'px-6', 'text-base')
    })
  })

  describe('States', () => {
    it('shows loading state correctly', () => {
      const { getByRole, getByText } = render(
        <Button loading>Loading Button</Button>
      )
      const button = getByRole('button')
      expect(button).toBeDisabled()
      expect(getByText('Loading...')).toBeInTheDocument()
      
      // Should have spinner
      const spinner = button.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('is disabled when disabled prop is true', () => {
      const { getByRole } = render(
        <Button disabled>Disabled</Button>
      )
      const button = getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('is disabled when loading', () => {
      const { getByRole } = render(
        <Button loading>Loading</Button>
      )
      const button = getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Icons', () => {
    const mockIcon = <span data-testid="mock-icon">📄</span>

    it('renders left icon correctly', () => {
      const { getByTestId } = render(
        <Button leftIcon={mockIcon}>With Left Icon</Button>
      )
      expect(getByTestId('mock-icon')).toBeInTheDocument()
    })

    it('renders right icon correctly', () => {
      const { getByTestId } = render(
        <Button rightIcon={mockIcon}>With Right Icon</Button>
      )
      expect(getByTestId('mock-icon')).toBeInTheDocument()
    })

    it('hides icons when loading', () => {
      const { queryByTestId } = render(
        <Button loading leftIcon={mockIcon} rightIcon={mockIcon}>
          Loading
        </Button>
      )
      expect(queryByTestId('mock-icon')).not.toBeInTheDocument()
    })
  })

  describe('Full Width', () => {
    it('applies full width class when fullWidth is true', () => {
      const { getByRole } = render(
        <Button fullWidth>Full Width</Button>
      )
      const button = getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('does not apply full width class by default', () => {
      const { getByRole } = render(<Button>Normal</Button>)
      const button = getByRole('button')
      expect(button).not.toHaveClass('w-full')
    })
  })

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn()
      const { getByRole } = render(
        <Button onClick={handleClick}>Clickable</Button>
      )
      
      const button = getByRole('button')
      await user.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      const { getByRole } = render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      )
      
      const button = getByRole('button')
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn()
      const { getByRole } = render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      )
      
      const button = getByRole('button')
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Enhanced Features', () => {
    it('applies hover lift effect when withHoverLift is true', () => {
      const { getByRole } = render(
        <Button withHoverLift>Hover Lift</Button>
      )
      const button = getByRole('button')
      expect(button).toHaveClass('hover:-translate-y-0.5')
    })

    it('creates ripple effect when withRipple is true and clicked', async () => {
      const { getByRole } = render(
        <Button withRipple>Ripple</Button>
      )
      
      const button = getByRole('button')
      expect(button).toHaveClass('relative', 'overflow-hidden')
      
      // Click to create ripple
      await user.click(button)
      
      // Check that ripple container exists
      const rippleContainer = button.querySelector('[class*="absolute inset-0"]')
      expect(rippleContainer).toBeInTheDocument()
    })

    it('does not create ripple when disabled', async () => {
      const handleClick = vi.fn()
      const { getByRole } = render(
        <Button withRipple disabled onClick={handleClick}>
          Disabled Ripple
        </Button>
      )
      
      const button = getByRole('button')
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      const { getByRole } = render(<Button>Accessible</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveAttribute('type', 'button')
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
    })

    it('provides screen reader text for loading state', () => {
      const { getByText } = render(
        <Button loading>Loading Button</Button>
      )
      
      const screenReaderText = getByText('Loading, please wait')
      expect(screenReaderText).toBeInTheDocument()
      expect(screenReaderText).toHaveClass('sr-only')
    })

    it('supports custom aria attributes', () => {
      const { getByRole } = render(
        <Button aria-label="Custom label" aria-describedby="description">
          Button
        </Button>
      )
      
      const button = getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
      expect(button).toHaveAttribute('aria-describedby', 'description')
    })
  })

  describe('Keyboard Navigation', () => {
    it('responds to Enter key', async () => {
      const handleClick = vi.fn()
      const { getByRole } = render(
        <Button onClick={handleClick}>Keyboard</Button>
      )
      
      const button = getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('responds to Space key', async () => {
      const handleClick = vi.fn()
      const { getByRole } = render(
        <Button onClick={handleClick}>Keyboard</Button>
      )
      
      const button = getByRole('button')
      button.focus()
      await user.keyboard(' ')
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})