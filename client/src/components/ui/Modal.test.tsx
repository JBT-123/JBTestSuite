import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Modal from './Modal'

describe('Modal Component', () => {
  const mockOnClose = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>
    )
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>
    )
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('renders with title', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    
    const title = screen.getByText('Test Modal')
    const modal = screen.getByRole('dialog')
    
    expect(title).toBeInTheDocument()
    expect(title).toHaveAttribute('id', 'modal-title')
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title')
  })

  it('renders close button by default', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>
    )
    
    const closeButton = screen.getByLabelText('Close modal')
    expect(closeButton).toBeInTheDocument()
  })

  it('does not render close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} showCloseButton={false}>
        <p>Modal content</p>
      </Modal>
    )
    
    const closeButton = screen.queryByLabelText('Close modal')
    expect(closeButton).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>
    )
    
    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>
    )
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on Escape when closeOnEscape is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={false}>
        <p>Modal content</p>
      </Modal>
    )
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('calls onClose when overlay is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>
    )
    
    const overlay = screen.getByRole('dialog').parentElement
    fireEvent.click(overlay!)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when overlay is clicked and closeOnOverlayClick is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
        <p>Modal content</p>
      </Modal>
    )
    
    const overlay = screen.getByRole('dialog').parentElement
    fireEvent.click(overlay!)
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('does not close when modal content is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>
    )
    
    const modalContent = screen.getByText('Modal content')
    fireEvent.click(modalContent)
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="sm">
        <p>Content</p>
      </Modal>
    )
    
    expect(screen.getByRole('dialog')).toHaveClass('max-w-sm')
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="md">
        <p>Content</p>
      </Modal>
    )
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md')
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="lg">
        <p>Content</p>
      </Modal>
    )
    expect(screen.getByRole('dialog')).toHaveClass('max-w-lg')
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="xl">
        <p>Content</p>
      </Modal>
    )
    expect(screen.getByRole('dialog')).toHaveClass('max-w-xl')
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="full">
        <p>Content</p>
      </Modal>
    )
    expect(screen.getByRole('dialog')).toHaveClass('max-w-full', 'mx-4')
  })

  it('uses medium size as default', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Content</p>
      </Modal>
    )
    
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md')
  })

  it('sets body overflow to hidden when open', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Content</p>
      </Modal>
    )
    
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('resets body overflow when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Content</p>
      </Modal>
    )
    
    expect(document.body.style.overflow).toBe('hidden')
    
    rerender(
      <Modal isOpen={false} onClose={mockOnClose}>
        <p>Content</p>
      </Modal>
    )
    
    expect(document.body.style.overflow).toBe('unset')
  })

  it('has proper accessibility attributes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Accessible Modal">
        <p>Content</p>
      </Modal>
    )
    
    const modal = screen.getByRole('dialog')
    
    expect(modal).toHaveAttribute('aria-modal', 'true')
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title')
    expect(modal).toHaveAttribute('tabIndex', '-1')
  })

  it('does not have aria-labelledby when no title is provided', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Content</p>
      </Modal>
    )
    
    const modal = screen.getByRole('dialog')
    
    expect(modal).toHaveAttribute('aria-modal', 'true')
    expect(modal).not.toHaveAttribute('aria-labelledby')
  })

  it('renders header when title or close button is present', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Title">
        <p>Content</p>
      </Modal>
    )
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} showCloseButton={true}>
        <p>Content</p>
      </Modal>
    )
    
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
  })

  it('does not render header when no title and showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} showCloseButton={false}>
        <p>Content</p>
      </Modal>
    )
    
    const modal = screen.getByRole('dialog')
    const header = modal.querySelector('.border-b')
    
    expect(header).not.toBeInTheDocument()
  })

  it('handles keyboard navigation correctly', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Content</p>
      </Modal>
    )
    
    fireEvent.keyDown(document, { key: 'Tab' })
    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'Space' })
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('prevents event propagation when modal content is clicked', () => {
    const overlayClickHandler = vi.fn()
    
    render(
      <div onClick={overlayClickHandler}>
        <Modal isOpen={true} onClose={mockOnClose}>
          <button>Click me</button>
        </Modal>
      </div>
    )
    
    const button = screen.getByRole('button', { name: 'Click me' })
    fireEvent.click(button)
    
    expect(overlayClickHandler).not.toHaveBeenCalled()
  })

  it('renders children in scrollable content area', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div data-testid="modal-content">
          <p>Line 1</p>
          <p>Line 2</p>
          <p>Line 3</p>
        </div>
      </Modal>
    )
    
    const contentArea = screen.getByTestId('modal-content').parentElement
    expect(contentArea).toHaveClass('overflow-y-auto')
    expect(contentArea).toHaveClass('max-h-[calc(90vh-8rem)]')
  })

  it('creates portal to document body', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Portaled content</p>
      </Modal>
    )
    
    const modal = screen.getByRole('dialog')
    expect(modal.closest('body')).toBeTruthy()
  })
})