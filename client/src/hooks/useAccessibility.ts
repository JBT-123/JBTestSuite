import React, { useEffect, useRef, useCallback, useState } from 'react'

export function useKeyboardNavigation(handlers: {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
  onShiftTab?: () => void
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          handlers.onEscape?.()
          break
        case 'Enter':
          e.preventDefault()
          handlers.onEnter?.()
          break
        case 'ArrowUp':
          e.preventDefault()
          handlers.onArrowUp?.()
          break
        case 'ArrowDown':
          e.preventDefault()
          handlers.onArrowDown?.()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlers.onArrowLeft?.()
          break
        case 'ArrowRight':
          e.preventDefault()
          handlers.onArrowRight?.()
          break
        case 'Tab':
          if (e.shiftKey) {
            handlers.onShiftTab?.()
          } else {
            handlers.onTab?.()
          }
          break
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [handlers])

  return ref
}

export function useFocusManagement(initialFocus?: boolean) {
  const ref = useRef<HTMLElement>(null)

  const focus = useCallback(() => {
    ref.current?.focus()
  }, [])

  const blur = useCallback(() => {
    ref.current?.blur()
  }, [])

  useEffect(() => {
    if (initialFocus) {
      focus()
    }
  }, [initialFocus, focus])

  return { ref, focus, blur }
}

export function useFocusTrap() {
  const containerRef = useRef<HTMLElement>(null)
  const [isActive, setIsActive] = useState(false)
  const firstFocusableRef = useRef<HTMLElement | null>(null)
  const lastFocusableRef = useRef<HTMLElement | null>(null)

  const activate = useCallback(() => {
    setIsActive(true)
  }, [])

  const deactivate = useCallback(() => {
    setIsActive(false)
  }, [])

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    firstFocusableRef.current = focusableElements[0]
    lastFocusableRef.current = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault()
          lastFocusableRef.current?.focus()
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault()
          firstFocusableRef.current?.focus()
        }
      }
    }

    firstFocusableRef.current?.focus()
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive])

  return { containerRef, activate, deactivate, isActive }
}

export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>()

  const announce = useCallback((message: string, delay = 100) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setAnnouncement(message)
      
      // Clear the announcement after it's been read
      setTimeout(() => {
        setAnnouncement('')
      }, 1000)
    }, delay)
  }, [])

  const clear = useCallback(() => {
    setAnnouncement('')
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { announcement, announce, clear }
}

export function useAriaDescribedBy(description: string) {
  const id = `aria-description-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    'aria-describedby': id,
    description,
  }
}

export function useAriaLabelledBy(label: string) {
  const id = `aria-label-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    'aria-labelledby': id,
    label,
  }
}

export function useRovingTabIndex<T extends HTMLElement>(
  items: T[],
  initialIndex = 0
) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const setFocus = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setActiveIndex(index)
      items[index]?.focus()
    }
  }, [items])

  const next = useCallback(() => {
    const nextIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0
    setFocus(nextIndex)
  }, [activeIndex, items.length, setFocus])

  const previous = useCallback(() => {
    const prevIndex = activeIndex > 0 ? activeIndex - 1 : items.length - 1
    setFocus(prevIndex)
  }, [activeIndex, items.length, setFocus])

  const first = useCallback(() => {
    setFocus(0)
  }, [setFocus])

  const last = useCallback(() => {
    setFocus(items.length - 1)
  }, [items.length, setFocus])

  useEffect(() => {
    items.forEach((item, index) => {
      if (item) {
        item.setAttribute('tabindex', index === activeIndex ? '0' : '-1')
      }
    })
  }, [items, activeIndex])

  return {
    activeIndex,
    next,
    previous,
    first,
    last,
    setFocus,
  }
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)

    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function usePrefersHighContrast() {
  return useMediaQuery('(prefers-contrast: high)')
}

export function usePrefersDarkMode() {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

export function useScreenReader() {
  const [isScreenReader, setIsScreenReader] = useState(false)

  useEffect(() => {
    // Detect screen reader by checking for assistive technology indicators
    const hasScreenReader = 
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('ORCA') ||
      navigator.userAgent.includes('VoiceOver') ||
      window.speechSynthesis?.getVoices().length > 0

    setIsScreenReader(hasScreenReader)
  }, [])

  return isScreenReader
}

export function useElementSize(ref: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current) return

    const element = ref.current
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [ref])

  return size
}