import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { TestCaseListResponse } from '../types'

// Create a custom render function that includes providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const memoryHistory = createMemoryHistory({
    initialEntries,
  })

  const router = createRouter({
    routeTree,
    history: memoryHistory,
    context: {
      queryClient,
    },
    Wrap: ({ children }) => children,
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}>
          {children}
        </RouterProvider>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    router,
  }
}

// Generate a simple UUID v4 for testing
const generateUUID = (seed?: number): string => {
  const s = seed ?? Math.floor(Math.random() * 1000)
  const baseHex = s.toString(16).padStart(8, '0').slice(0, 8)
  const part1 = baseHex
  const part2 = '1234'
  const part3 = '5678' 
  const part4 = '9012'
  const part5 = s.toString(16).padStart(12, '0').slice(-12)
  return `${part1}-${part2}-${part3}-${part4}-${part5}`
}

// Mock data factories for testing
export const createMockTestCase = (overrides: Partial<TestCaseListResponse> = {}): TestCaseListResponse => ({
  id: generateUUID(1),
  name: 'Test Login Functionality',
  description: 'Test the user login process with valid credentials',
  status: 'active',
  priority: 'high',
  category: 'authentication',
  tags: ['login', 'auth', 'ui'],
  step_count: 3,
  execution_count: 5,
  last_execution_date: '2024-01-15T10:30:00Z',
  created_at: '2024-01-10T08:00:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  created_by: 'user-1',
  updated_by: 'user-1',
  ...overrides,
})

export const createMockTestCases = (count: number): TestCaseListResponse[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockTestCase({
      id: generateUUID(index + 1),
      name: `Test Case ${index + 1}`,
      description: `Description for test case ${index + 1}`,
      priority: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low',
      status: index % 4 === 0 ? 'draft' : index % 4 === 1 ? 'active' : index % 4 === 2 ? 'archived' : 'inactive',
    })
  )
}

// Mock server handlers for MSW (Mock Service Worker)  
export function mockApiResponse<T>(data: T, delay = 0): Promise<T> {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (message: string, status = 400, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message)
      ;(error as any).status = status
      reject(error)
    }, delay)
  })
}

// User event utilities
import { userEvent } from '@testing-library/user-event'

export const user = userEvent.setup()

// Common test assertions
export const expectElementToBeVisible = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

export const expectButtonToBeEnabled = (button: HTMLElement | null) => {
  expect(button).toBeInTheDocument()
  expect(button).toBeEnabled()
}

export const expectButtonToBeDisabled = (button: HTMLElement | null) => {
  expect(button).toBeInTheDocument()
  expect(button).toBeDisabled()
}

// Wait for async operations
export const waitForLoadingToFinish = async () => {
  const { findByText, queryByText } = await import('@testing-library/react')
  
  // Wait for loading text to appear and then disappear
  try {
    const loadingElement = await findByText(/loading/i, {}, { timeout: 1000 })
    if (loadingElement) {
      // Wait for it to disappear
      await import('@testing-library/react').then(({ waitForElementToBeRemoved }) =>
        waitForElementToBeRemoved(loadingElement, { timeout: 5000 })
      )
    }
  } catch {
    // Loading element might not appear or might already be gone
  }
}

// Mock implementations for hooks (without vitest functions for production use)
export const mockUseTestCases = {
  data: createMockTestCases(5),
  isLoading: false,
  error: null,
  refetch: () => Promise.resolve(),
  isRefetching: false,
}

export const mockUseTestCaseFilters = {
  data: createMockTestCases(10),
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 25,
    totalItems: 10,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 25,
  },
  filters: {
    search: '',
    status: '',
    priority: '',
    dateRange: undefined,
  },
  updateSearchFilter: () => {},
  updateStatusFilter: () => {},
  updatePriorityFilter: () => {},
  updateDateRangeFilter: () => {},
  clearAllFilters: () => {},
  hasActiveFilters: false,
  sorting: {
    sortBy: 'created_at',
    sortOrder: 'desc' as const,
    updateSort: () => {},
  },
  updatePagination: () => {},
  selection: {
    selectedItems: [],
    selectAllItems: () => {},
    clearSelection: () => {},
    toggleItemSelection: () => {},
  },
  columns: {
    visibility: {
      name: true,
      status: true,
      priority: true,
      step_count: true,
      execution_count: true,
      created_at: true,
      actions: true,
    },
    toggleVisibility: () => {},
  },
  refresh: () => {},
}

// Export everything from testing library for convenience
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'