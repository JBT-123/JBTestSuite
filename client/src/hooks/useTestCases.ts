import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../utils/api'
import type { TestCase, CreateTestCase, UpdateTestCase } from '../types'

export const useTestCases = () => {
  return useQuery({
    queryKey: ['testCases'],
    queryFn: () => apiClient.get<TestCase[]>('/test-cases'),
  })
}

export const useTestCase = (id: number) => {
  return useQuery({
    queryKey: ['testCase', id],
    queryFn: () => apiClient.get<TestCase>(`/test-cases/${id}`),
    enabled: !!id,
  })
}

export const useCreateTestCase = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateTestCase) => 
      apiClient.post<TestCase>('/test-cases', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCases'] })
    },
  })
}

export const useUpdateTestCase = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & UpdateTestCase) =>
      apiClient.put<TestCase>(`/test-cases/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['testCases'] })
      queryClient.invalidateQueries({ queryKey: ['testCase', id] })
    },
  })
}

export const useDeleteTestCase = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/test-cases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCases'] })
    },
  })
}

export const useExecuteTestCase = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => 
      apiClient.post(`/test-cases/${id}/execute`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['testCases'] })
      queryClient.invalidateQueries({ queryKey: ['testCase', id] })
    },
  })
}