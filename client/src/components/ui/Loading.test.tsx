import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Loading from './Loading'

describe('Loading', () => {
  describe('Basic Rendering', () => {
    it('renders loading spinner', () => {
      const { container } = render(<Loading />)
      const spinner = container.querySelector('svg')
      
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin', 'text-blue-600')
    })

    it('renders with text', () => {
      render(<Loading text="Loading data..." />)
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument()
    })

    it('renders without text by default', () => {
      render(<Loading />)
      
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      const { container } = render(<Loading size="sm" />)
      const spinner = container.querySelector('svg')
      
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('renders medium size correctly (default)', () => {
      const { container } = render(<Loading size="md" />)
      const spinner = container.querySelector('svg')
      
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('renders large size correctly', () => {
      const { container } = render(<Loading size="lg" />)
      const spinner = container.querySelector('svg')
      
      expect(spinner).toHaveClass('h-12', 'w-12')
    })

    it('uses medium size by default', () => {
      const { container } = render(<Loading />)
      const spinner = container.querySelector('svg')
      
      expect(spinner).toHaveClass('h-8', 'w-8')
    })
  })

  describe('Text Sizes', () => {
    it('applies correct text size for small loading', () => {
      render(<Loading size="sm" text="Loading..." />)
      const text = screen.getByText('Loading...')
      
      expect(text).toHaveClass('text-sm')
    })

    it('applies correct text size for medium loading', () => {
      render(<Loading size="md" text="Loading..." />)
      const text = screen.getByText('Loading...')
      
      expect(text).toHaveClass('text-base')
    })

    it('applies correct text size for large loading', () => {
      render(<Loading size="lg" text="Loading..." />)
      const text = screen.getByText('Loading...')
      
      expect(text).toHaveClass('text-lg')
    })
  })

  describe('Full Screen Mode', () => {
    it('renders full screen overlay when fullScreen is true', () => {
      const { container } = render(<Loading fullScreen />)
      const overlay = container.firstChild
      
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-white', 'bg-opacity-75', 'backdrop-blur-sm')
    })

    it('renders full screen with text', () => {
      render(<Loading fullScreen text="Please wait..." />)
      
      expect(screen.getByText('Please wait...')).toBeInTheDocument()
    })

    it('centers content in full screen mode', () => {
      const { container } = render(<Loading fullScreen />)
      const overlay = container.firstChild
      const contentContainer = overlay?.firstChild
      
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center')
      expect(contentContainer).toHaveClass('text-center')
    })

    it('does not render full screen by default', () => {
      const { container } = render(<Loading />)
      const firstChild = container.firstChild
      
      expect(firstChild).not.toHaveClass('fixed', 'inset-0')
    })
  })

  describe('Layout', () => {
    it('applies default container classes', () => {
      const { container } = render(<Loading />)
      const wrapper = container.firstChild
      
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('adds spacing when text is present', () => {
      const { container } = render(<Loading text="Loading..." />)
      const wrapper = container.firstChild
      
      expect(wrapper).toHaveClass('space-x-2')
    })

    it('does not add spacing when no text', () => {
      const { container } = render(<Loading />)
      const wrapper = container.firstChild
      
      expect(wrapper).not.toHaveClass('space-x-2')
    })

    it('applies custom className', () => {
      const { container } = render(<Loading className="custom-loading" />)
      const wrapper = container.firstChild
      
      expect(wrapper).toHaveClass('custom-loading')
    })
  })

  describe('Accessibility', () => {
    it('has proper SVG structure for screen readers', () => {
      const { container } = render(<Loading />)
      const svg = container.querySelector('svg')
      
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
      expect(svg).toHaveAttribute('fill', 'none')
    })

    it('includes circle and path elements for spinner animation', () => {
      const { container } = render(<Loading />)
      const circle = container.querySelector('circle')
      const path = container.querySelector('path')
      
      expect(circle).toBeInTheDocument()
      expect(path).toBeInTheDocument()
      expect(circle).toHaveClass('opacity-25')
      expect(path).toHaveClass('opacity-75')
    })
  })

  describe('Animation', () => {
    it('applies spin animation to SVG', () => {
      const { container } = render(<Loading />)
      const svg = container.querySelector('svg')
      
      expect(svg).toHaveClass('animate-spin')
    })

    it('maintains spin animation in full screen mode', () => {
      const { container } = render(<Loading fullScreen />)
      const svg = container.querySelector('svg')
      
      expect(svg).toHaveClass('animate-spin')
    })
  })

  describe('Color and Styling', () => {
    it('applies blue color to spinner', () => {
      const { container } = render(<Loading />)
      const svg = container.querySelector('svg')
      
      expect(svg).toHaveClass('text-blue-600')
    })

    it('applies gray color to text', () => {
      render(<Loading text="Loading..." />)
      const text = screen.getByText('Loading...')
      
      expect(text).toHaveClass('text-gray-600')
    })

    it('maintains styling in full screen mode', () => {
      render(<Loading fullScreen text="Loading..." />)
      const text = screen.getByText('Loading...')
      
      expect(text).toHaveClass('text-gray-600')
    })
  })
})