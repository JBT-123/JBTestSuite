import { vi } from 'vitest'
import { createMockTestCases } from './utils'

// Mock implementations for hooks using vitest functions (for actual test files)
export const createMockUseTestCases = () => ({
  data: createMockTestCases(5),
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  isRefetching: false,
})

export const createMockUseTestCaseFilters = () => ({
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
  updateSearchFilter: vi.fn(),
  updateStatusFilter: vi.fn(),
  updatePriorityFilter: vi.fn(),
  updateDateRangeFilter: vi.fn(),
  clearAllFilters: vi.fn(),
  hasActiveFilters: false,
  sorting: {
    sortBy: 'created_at',
    sortOrder: 'desc' as const,
    updateSort: vi.fn(),
  },
  updatePagination: vi.fn(),
  selection: {
    selectedItems: [],
    selectAllItems: vi.fn(),
    clearSelection: vi.fn(),
    toggleItemSelection: vi.fn(),
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
    toggleVisibility: vi.fn(),
  },
  refresh: vi.fn(),
})