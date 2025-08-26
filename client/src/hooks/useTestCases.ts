import { useState } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { testCaseService } from '../api/testCases'
import type {
  TestCaseCreate,
  TestCaseUpdate,
  TestCaseResponse,
  TestCaseListResponse,
  TestStepCreate,
  TestStepUpdate,
  TestStepResponse,
  PaginatedResponse,
  BulkOperationResponse,
  FilterParams,
  PaginationParams,
  SortParams,
  SearchParams,
  ApiError,
} from '../types'

// Test Cases hooks
export function useTestCases(params?: {
  pagination?: Partial<PaginationParams>
  filters?: Partial<FilterParams>
  sort?: Partial<SortParams>
  fields?: string[]
}) {
  return useQuery<PaginatedResponse<TestCaseListResponse>, ApiError>({
    queryKey: testCaseService.getQueryKeys().list(params),
    queryFn: () => testCaseService.getTestCases(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export function useTestCase(testId: string, includeSteps: boolean = true) {
  return useQuery<TestCaseResponse, ApiError>({
    queryKey: testCaseService.getQueryKeys().detail(testId),
    queryFn: () => testCaseService.getTestCase(testId, includeSteps),
    enabled: !!testId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useTestSteps(testId: string) {
  return useQuery<TestStepResponse[], ApiError>({
    queryKey: testCaseService.getQueryKeys().steps(testId),
    queryFn: () => testCaseService.getTestSteps(testId),
    enabled: !!testId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useSearchTestCases(params: SearchParams) {
  return useQuery<PaginatedResponse<TestCaseListResponse>, ApiError>({
    queryKey: testCaseService.getQueryKeys().search(params.q),
    queryFn: () => testCaseService.searchTestCases(params),
    enabled: !!params.q && params.q.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// Mutation hooks
export function useCreateTestCase() {
  const queryClient = useQueryClient()

  return useMutation<TestCaseResponse, ApiError, TestCaseCreate>({
    mutationFn: (data: TestCaseCreate) => testCaseService.createTestCase(data),
    onSuccess: () => {
      // Invalidate and refetch test cases list
      queryClient.invalidateQueries({ queryKey: testCaseService.getQueryKeys().lists() })
    },
    onError: (error) => {
      console.error('Failed to create test case:', error)
    },
  })
}

export function useUpdateTestCase() {
  const queryClient = useQueryClient()

  return useMutation<TestCaseResponse, ApiError, { testId: string; data: TestCaseUpdate }>({
    mutationFn: ({ testId, data }) => testCaseService.updateTestCase(testId, data),
    onSuccess: (updatedTestCase) => {
      // Update the specific test case in cache
      queryClient.setQueryData(
        testCaseService.getQueryKeys().detail(updatedTestCase.id),
        updatedTestCase
      )
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: testCaseService.getQueryKeys().lists() })
    },
    onError: (error) => {
      console.error('Failed to update test case:', error)
    },
  })
}

export function useDeleteTestCase() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: (testId: string) => testCaseService.deleteTestCase(testId),
    onSuccess: (_, testId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: testCaseService.getQueryKeys().detail(testId) })
      queryClient.removeQueries({ queryKey: testCaseService.getQueryKeys().steps(testId) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: testCaseService.getQueryKeys().lists() })
    },
    onError: (error) => {
      console.error('Failed to delete test case:', error)
    },
  })
}

export function useBulkCreateTestCases() {
  const queryClient = useQueryClient()

  return useMutation<BulkOperationResponse, ApiError, TestCaseCreate[]>({
    mutationFn: (testsData: TestCaseCreate[]) => testCaseService.bulkCreateTestCases(testsData),
    onSuccess: () => {
      // Invalidate lists to show new test cases
      queryClient.invalidateQueries({ queryKey: testCaseService.getQueryKeys().lists() })
    },
    onError: (error) => {
      console.error('Failed to bulk create test cases:', error)
    },
  })
}

// Test Step mutation hooks
export function useCreateTestStep() {
  const queryClient = useQueryClient()

  return useMutation<TestStepResponse, ApiError, { testId: string; stepData: TestStepCreate }>({
    mutationFn: ({ testId, stepData }) => testCaseService.createTestStep(testId, stepData),
    onSuccess: (_, { testId }) => {
      // Invalidate steps and test case details
      queryClient.invalidateQueries({ queryKey: testCaseService.getQueryKeys().steps(testId) })
      queryClient.invalidateQueries({ queryKey: testCaseService.getQueryKeys().detail(testId) })
    },
    onError: (error) => {
      console.error('Failed to create test step:', error)
    },
  })
}

export function useUpdateTestStep() {
  const queryClient = useQueryClient()

  return useMutation<
    TestStepResponse,
    ApiError,
    { testId: string; stepId: string; stepData: TestStepUpdate }
  >({
    mutationFn: ({ testId, stepId, stepData }) =>
      testCaseService.updateTestStep(testId, stepId, stepData),
    onSuccess: (_, { testId }) => {
      queryClient.invalidateQueries({ queryKey: testCaseService.getQueryKeys().steps(testId) })
      queryClient.invalidateQueries({ queryKey: testCaseService.getQueryKeys().detail(testId) })
    },
    onError: (error) => {
      console.error('Failed to update test step:', error)
    },
  })
}

export function useDeleteTestStep() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, { testId: string; stepId: string }>({
    mutationFn: ({ testId, stepId }) => testCaseService.deleteTestStep(testId, stepId),
    onSuccess: (_, { testId }) => {
      queryClient.invalidateQueries({ queryKey: testCaseService.getQueryKeys().steps(testId) })
      queryClient.invalidateQueries({ queryKey: testCaseService.getQueryKeys().detail(testId) })
    },
    onError: (error) => {
      console.error('Failed to delete test step:', error)
    },
  })
}

// Utility hooks for optimistic updates
export function useOptimisticTestCaseUpdate() {
  const queryClient = useQueryClient()

  const updateOptimistic = (testId: string, updates: Partial<TestCaseResponse>) => {
    queryClient.setQueryData<TestCaseResponse>(
      testCaseService.getQueryKeys().detail(testId),
      (old) => (old ? { ...old, ...updates } : undefined)
    )
  }

  const revertOptimistic = (testId: string, previousData: TestCaseResponse) => {
    queryClient.setQueryData(testCaseService.getQueryKeys().detail(testId), previousData)
  }

  return { updateOptimistic, revertOptimistic }
}

// Custom hook for managing local test case form state
export function useTestCaseForm(initialData?: TestCaseResponse) {
  const createMutation = useCreateTestCase()
  const updateMutation = useUpdateTestCase()

  const isLoading = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error || updateMutation.error

  const submitForm = async (data: TestCaseCreate | TestCaseUpdate, testId?: string) => {
    if (testId) {
      return updateMutation.mutateAsync({ testId, data: data as TestCaseUpdate })
    } else {
      return createMutation.mutateAsync(data as TestCaseCreate)
    }
  }

  return {
    submitForm,
    isLoading,
    error,
    isEdit: !!initialData,
  }
}

// Hook for managing pagination state
export function usePaginatedTestCases(initialParams?: {
  pagination?: Partial<PaginationParams>
  filters?: Partial<FilterParams>
  sort?: Partial<SortParams>
}) {
  const [params, setParams] = useState({
    pagination: { page: 1, limit: 50 },
    filters: {},
    sort: { sort_by: 'created_at', order: 'desc' as const },
    ...initialParams,
  })

  const query = useTestCases(params)

  const updateFilters = (filters: Partial<FilterParams>) => {
    setParams(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      pagination: { ...prev.pagination, page: 1 }, // Reset to first page
    }))
  }

  const updatePagination = (pagination: Partial<PaginationParams>) => {
    setParams(prev => ({
      ...prev,
      pagination: { ...prev.pagination, ...pagination },
    }))
  }

  const updateSort = (sort: Partial<SortParams>) => {
    setParams(prev => ({
      ...prev,
      sort: { ...prev.sort, ...sort },
    }))
  }

  return {
    ...query,
    params,
    updateFilters,
    updatePagination,
    updateSort,
  }
}

export default {
  useTestCases,
  useTestCase,
  useTestSteps,
  useSearchTestCases,
  useCreateTestCase,
  useUpdateTestCase,
  useDeleteTestCase,
  useBulkCreateTestCases,
  useCreateTestStep,
  useUpdateTestStep,
  useDeleteTestStep,
  useOptimisticTestCaseUpdate,
  useTestCaseForm,
  usePaginatedTestCases,
}