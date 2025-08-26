import type { ApiError, FilterParams, PaginationParams, SortParams } from '../types'

// URL parameter utilities
export function buildQueryParams(params: Record<string, any>): URLSearchParams {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, item.toString())
        }
      })
    } else {
      searchParams.set(key, value.toString())
    }
  })

  return searchParams
}

export function buildTestCaseQueryParams(params?: {
  pagination?: Partial<PaginationParams>
  filters?: Partial<FilterParams>
  sort?: Partial<SortParams>
  fields?: string[]
}): string {
  if (!params) return ''

  const queryParams: Record<string, any> = {}

  // Pagination
  if (params.pagination?.page) {
    queryParams.page = params.pagination.page
  }
  if (params.pagination?.limit) {
    queryParams.limit = params.pagination.limit
  }

  // Filters
  if (params.filters?.status) {
    queryParams.status = params.filters.status
  }
  if (params.filters?.category) {
    queryParams.category = params.filters.category
  }
  if (params.filters?.author) {
    queryParams.author = params.filters.author
  }
  if (params.filters?.tags) {
    queryParams.tags = params.filters.tags
  }
  if (params.filters?.created_after) {
    queryParams.created_after = params.filters.created_after
  }
  if (params.filters?.created_before) {
    queryParams.created_before = params.filters.created_before
  }

  // Sorting
  if (params.sort?.sort_by) {
    queryParams.sort_by = params.sort.sort_by
  }
  if (params.sort?.order) {
    queryParams.order = params.sort.order
  }

  // Fields
  if (params.fields && params.fields.length > 0) {
    queryParams.fields = params.fields.join(',')
  }

  const searchParams = buildQueryParams(queryParams)
  return searchParams.toString()
}

// Error handling utilities
export function isApiError(error: any): error is ApiError {
  return error && typeof error === 'object' && 'error' in error && 'message' in error
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unknown error occurred'
}

export function getErrorDetails(error: unknown): Record<string, any> | undefined {
  if (isApiError(error)) {
    return error.details
  }

  return undefined
}

// Status code utilities
export function getHttpStatusMessage(statusCode: number): string {
  const statusMessages: Record<number, string> = {
    400: 'Bad Request - Please check your input',
    401: 'Unauthorized - Please log in',
    403: 'Forbidden - You do not have permission',
    404: 'Not Found - The requested resource was not found',
    409: 'Conflict - This resource already exists',
    422: 'Validation Error - Please check your data',
    429: 'Too Many Requests - Please try again later',
    500: 'Server Error - Something went wrong on our end',
    502: 'Bad Gateway - Service temporarily unavailable',
    503: 'Service Unavailable - Please try again later',
  }

  return statusMessages[statusCode] || `HTTP Error ${statusCode}`
}

// Data transformation utilities
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return 'N/A'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

// Validation utilities
export function validateTestCaseName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Test case name is required'
  }

  if (name.length > 255) {
    return 'Test case name must be 255 characters or less'
  }

  return null
}

export function validateStepName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Step name is required'
  }

  if (name.length > 255) {
    return 'Step name must be 255 characters or less'
  }

  return null
}

export function validateRetryCount(count?: number): string | null {
  if (count === undefined || count === null) {
    return null
  }

  if (count < 0) {
    return 'Retry count cannot be negative'
  }

  if (count > 10) {
    return 'Retry count cannot exceed 10'
  }

  return null
}

export function validateTimeout(timeout?: number): string | null {
  if (timeout === undefined || timeout === null) {
    return null
  }

  if (timeout < 0) {
    return 'Timeout cannot be negative'
  }

  if (timeout > 300) {
    return 'Timeout cannot exceed 300 seconds'
  }

  return null
}

// Cache utilities for TanStack Query
export function getCacheTime(): number {
  return 5 * 60 * 1000 // 5 minutes
}

export function getStaleTime(): number {
  return 2 * 60 * 1000 // 2 minutes
}

// Retry utilities
export function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  // Don't retry on 4xx errors (except 429 Too Many Requests)
  if (isApiError(error)) {
    const statusCode = (error as any).status || 0
    if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
      return false
    }
  }

  // Retry up to 3 times
  return failureCount < 3
}

export function getRetryDelay(attemptIndex: number): number {
  // Exponential backoff: 1s, 2s, 4s
  return Math.min(1000 * Math.pow(2, attemptIndex), 30000)
}

// Local storage utilities
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.warn('Failed to load from localStorage:', error)
    return null
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error)
  }
}

// Export commonly used constants
export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,
  DEFAULT_TIMEOUT: 30,
  MAX_TIMEOUT: 300,
  MAX_RETRY_COUNT: 10,
  CACHE_TIME: getCacheTime(),
  STALE_TIME: getStaleTime(),
} as const

export const TEST_CASE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DISABLED: 'disabled',
} as const

export const TEST_CASE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

export const STEP_TYPES = {
  NAVIGATE: 'navigate',
  CLICK: 'click',
  TYPE: 'type',
  WAIT: 'wait',
  ASSERT: 'assert',
  SCREENSHOT: 'screenshot',
  SCROLL: 'scroll',
  SELECT: 'select',
} as const