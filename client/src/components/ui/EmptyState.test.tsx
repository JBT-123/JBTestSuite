import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EmptyState from './EmptyState'

describe('EmptyState Component', () => {
  it('renders with required title', () => {
    render(<EmptyState title="No items found" />)
    
    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('No items found')
  })

  it('renders with description', () => {
    render(
      <EmptyState 
        title="No data available" 
        description="Try adjusting your search criteria or create new items"
      />
    )
    
    expect(screen.getByText('No data available')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search criteria or create new items')).toBeInTheDocument()
  })

  it('renders default icon when no icon is provided', () => {
    render(<EmptyState title="Empty state" />)
    
    const container = screen.getByText('Empty state').closest('div')
    const svg = container?.querySelector('svg')
    
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('h-12', 'w-12', 'text-gray-400')
  })

  it('renders custom icon when provided', () => {
    const customIcon = (
      <div data-testid="custom-icon" className="custom-icon">
        Custom Icon
      </div>
    )
    
    render(<EmptyState title="Custom empty state" icon={customIcon} />)
    
    const customIconElement = screen.getByTestId('custom-icon')
    expect(customIconElement).toBeInTheDocument()
    expect(customIconElement).toHaveTextContent('Custom Icon')
  })

  it('renders action button with default variant', () => {
    const mockAction = vi.fn()
    
    render(
      <EmptyState 
        title="No items" 
        action={{
          label: 'Create Item',
          onClick: mockAction
        }}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Create Item' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-blue-600') // primary variant default
  })

  it('renders action button with custom variant', () => {
    const mockAction = vi.fn()
    
    render(
      <EmptyState 
        title="No items" 
        action={{
          label: 'Create Item',
          onClick: mockAction,
          variant: 'secondary'
        }}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Create Item' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-gray-100') // secondary variant
  })

  it('calls action onClick when button is clicked', () => {
    const mockAction = vi.fn()
    
    render(
      <EmptyState 
        title="Empty state" 
        action={{
          label: 'Take Action',
          onClick: mockAction
        }}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Take Action' })
    fireEvent.click(button)
    
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('shows loading state for action button', () => {
    const mockAction = vi.fn()
    
    render(
      <EmptyState 
        title="Loading state" 
        action={{
          label: 'Submit',
          onClick: mockAction,
          loading: true
        }}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button).toBeDisabled()
    
    // Should show loading spinner
    const loadingSpinner = button.querySelector('.animate-spin')
    expect(loadingSpinner).toBeInTheDocument()
  })

  it('does not render action button when action is not provided', () => {
    render(<EmptyState title="No action state" />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <EmptyState 
        title="Custom styled" 
        className="custom-empty-state"
      />
    )
    
    const container = screen.getByText('Custom styled').closest('div')
    expect(container).toHaveClass('custom-empty-state')
  })

  it('has proper layout structure', () => {
    render(
      <EmptyState 
        title="Layout test"
        description="Testing layout structure"
      />
    )
    
    const container = screen.getByText('Layout test').closest('div')
    expect(container).toHaveClass(
      'flex', 
      'flex-col', 
      'items-center', 
      'justify-center', 
      'py-12', 
      'text-center'
    )
  })

  it('renders complete empty state with all elements', () => {
    const mockAction = vi.fn()
    const customIcon = <div data-testid="complete-icon">📋</div>
    
    render(
      <EmptyState 
        title="Complete Empty State"
        description="This is a complete example with all elements"
        icon={customIcon}
        action={{
          label: 'Get Started',
          onClick: mockAction,
          variant: 'outline'
        }}
        className="complete-state"
      />
    )
    
    const container = screen.getByText('Complete Empty State').closest('div')
    const title = screen.getByText('Complete Empty State')
    const description = screen.getByText('This is a complete example with all elements')
    const icon = screen.getByTestId('complete-icon')
    const button = screen.getByRole('button', { name: 'Get Started' })
    
    expect(container).toHaveClass('complete-state')
    expect(title).toHaveClass('text-lg', 'font-medium', 'text-gray-900')
    expect(description).toHaveClass('text-gray-600', 'max-w-md')
    expect(icon).toBeInTheDocument()
    expect(button).toHaveClass('border', 'border-gray-300') // outline variant
  })

  it('applies correct spacing classes', () => {
    render(
      <EmptyState 
        title="Spacing test"
        description="Testing spacing"
      />
    )
    
    const title = screen.getByText('Spacing test')
    const description = screen.getByText('Testing spacing')
    
    expect(title).toHaveClass('mb-2')
    expect(description).toHaveClass('mb-6')
    
    // Check that icon container has correct margin
    const container = title.closest('div')
    const iconDiv = container?.querySelector('.mb-4')
    expect(iconDiv).toBeInTheDocument()
  })

  it('constrains description width appropriately', () => {
    render(
      <EmptyState 
        title="Width test"
        description="This is a longer description that should be constrained to max-width for better readability and visual appeal"
      />
    )
    
    const description = screen.getByText(/This is a longer description/)
    expect(description).toHaveClass('max-w-md')
  })

  it('handles minimal configuration', () => {
    render(<EmptyState title="Minimal" />)
    
    expect(screen.getByText('Minimal')).toBeInTheDocument()
    expect(screen.queryByText(/description/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    
    // Should still render default icon
    const container = screen.getByText('Minimal').closest('div')
    const svg = container?.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('maintains accessibility for heading structure', () => {
    render(<EmptyState title="Accessible Title" />)
    
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Accessible Title')
    expect(heading.tagName).toBe('H3')
  })

  it('handles various action button variants correctly', () => {
    const mockAction = vi.fn()
    const { rerender } = render(
      <EmptyState 
        title="Variant test"
        action={{
          label: 'Primary',
          onClick: mockAction,
          variant: 'primary'
        }}
      />
    )
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600')
    
    rerender(
      <EmptyState 
        title="Variant test"
        action={{
          label: 'Secondary',
          onClick: mockAction,
          variant: 'secondary'
        }}
      />
    )
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-100')
    
    rerender(
      <EmptyState 
        title="Variant test"
        action={{
          label: 'Outline',
          onClick: mockAction,
          variant: 'outline'
        }}
      />
    )
    button = screen.getByRole('button')
    expect(button).toHaveClass('border-gray-300')
  })

  it('combines custom className with base classes', () => {
    render(
      <EmptyState 
        title="Class combination test"
        className="additional-class another-class"
      />
    )
    
    const container = screen.getByText('Class combination test').closest('div')
    const classes = container?.className
    
    // Should include base classes
    expect(classes).toContain('flex flex-col items-center justify-center py-12 text-center')
    // Should include custom classes
    expect(classes).toContain('additional-class another-class')
  })

  it('handles icon and content spacing correctly', () => {
    render(
      <EmptyState 
        title="Icon spacing test"
        description="Testing icon spacing"
      />
    )
    
    const title = screen.getByText('Icon spacing test')
    const container = title.closest('div')
    const iconDiv = container?.querySelector('.mb-4')
    
    expect(iconDiv).toBeInTheDocument()
    expect(iconDiv).toContainHTML('svg')
  })
})