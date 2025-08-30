import { useState, useMemo, useCallback } from 'react'
import { usePaginatedTestCases } from './useTestCases'
import type { TestCaseListResponse, FilterParams, PaginationParams, SortParams } from '../types'

export interface TestCaseFilters {
  search: string
  status?: string
  priority?: string
  dateRange?: { from: string; to: string }
}

export interface UseTestCaseFiltersOptions {
  initialFilters?: Partial<TestCaseFilters>
  initialPagination?: Partial<PaginationParams>
  initialSort?: Partial<SortParams>
}

export function useTestCaseFilters(options: UseTestCaseFiltersOptions = {}) {
  const [filters, setFilters] = useState<TestCaseFilters>({
    search: '',
    status: undefined,
    priority: undefined,
    dateRange: undefined,
    ...options.initialFilters,
  })

  const [selectedItems, setSelectedItems] = useState<TestCaseListResponse[]>([])
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    name: true,
    status: true,
    priority: true,
    step_count: true,
    expected_duration_seconds: true,
    created_at: true,
  })

  const apiFilters = useMemo((): FilterParams => {
    const result: FilterParams = {}

    if (filters.status) {
      result.status = filters.status
    }

    if (filters.dateRange?.from) {
      result.created_after = filters.dateRange.from
    }

    if (filters.dateRange?.to) {
      result.created_before = filters.dateRange.to
    }

    return result
  }, [filters])

  const query = usePaginatedTestCases({
    pagination: options.initialPagination,
    sort: options.initialSort,
    filters: apiFilters,
  })

  const filteredData = useMemo(() => {
    if (!query.data?.items) return []

    let items = query.data.items

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      )
    }

    if (filters.priority) {
      items = items.filter((item) => item.priority === filters.priority)
    }

    return items
  }, [query.data?.items, filters.search, filters.priority])

  const updateSearchFilter = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }, [])

  const updateStatusFilter = useCallback((status: string | undefined) => {
    setFilters((prev) => ({ ...prev, status }))
  }, [])

  const updatePriorityFilter = useCallback((priority: string | undefined) => {
    setFilters((prev) => ({ ...prev, priority }))
  }, [])

  const updateDateRangeFilter = useCallback(
    (dateRange: { from: string; to: string } | undefined) => {
      setFilters((prev) => ({ ...prev, dateRange }))
    },
    []
  )

  const clearAllFilters = useCallback(() => {
    setFilters({
      search: '',
      status: undefined,
      priority: undefined,
      dateRange: undefined,
    })
  }, [])

  const updateSort = useCallback(
    (sortBy: string, order: 'asc' | 'desc') => {
      query.updateSort({ sort_by: sortBy, order })
    },
    [query]
  )

  const updatePagination = useCallback(
    (pagination: Partial<PaginationParams>) => {
      query.updatePagination(pagination)
    },
    [query]
  )

  const toggleItemSelection = useCallback((item: TestCaseListResponse, checked: boolean) => {
    setSelectedItems((prev) => {
      if (checked) {
        return [...prev, item]
      } else {
        return prev.filter((selected) => selected.id !== item.id)
      }
    })
  }, [])

  const selectAllItems = useCallback(() => {
    setSelectedItems(filteredData)
  }, [filteredData])

  const clearSelection = useCallback(() => {
    setSelectedItems([])
  }, [])

  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }))
  }, [])

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
        filters.status ||
        filters.priority ||
        (filters.dateRange && (filters.dateRange.from || filters.dateRange.to))
    )
  }, [filters])

  return {
    data: filteredData,
    loading: query.isLoading,
    error: query.error,

    pagination: {
      currentPage: query.params.pagination?.page || 1,
      totalPages: query.data?.pages || 1,
      totalItems: query.data?.total || 0,
      itemsPerPage: query.params.pagination?.limit || 50,
    },

    filters,
    updateSearchFilter,
    updateStatusFilter,
    updatePriorityFilter,
    updateDateRangeFilter,
    clearAllFilters,
    hasActiveFilters,

    sorting: {
      sortBy: query.params.sort?.sort_by || 'created_at',
      sortOrder: query.params.sort?.order || 'desc',
      updateSort,
    },

    updatePagination,

    selection: {
      selectedItems,
      toggleItemSelection,
      selectAllItems,
      clearSelection,
    },

    columns: {
      visibility: columnVisibility,
      toggleVisibility: toggleColumnVisibility,
    },

    refresh: query.refetch,
  }
}
