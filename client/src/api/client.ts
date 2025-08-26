import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

export interface ApiError {
  error: string
  message: string
  details?: Record<string, any>
}

export interface ApiResponse<T> {
  data: T
}

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        const token = localStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config

        // Handle 401 errors (authentication)
        if (error.response?.status === 401 && originalRequest) {
          // Clear token and redirect to login
          localStorage.removeItem('authToken')
          window.location.href = '/login'
          return Promise.reject(error)
        }

        // Handle network errors with retry logic
        if (!error.response && originalRequest && !(originalRequest as any)._retry) {
          (originalRequest as any)._retry = true
          
          // Retry after 1 second
          await new Promise(resolve => setTimeout(resolve, 1000))
          return this.instance(originalRequest)
        }

        // Transform error response to consistent format
        const apiError: ApiError = {
          error: error.response?.data?.error || 'Unknown error',
          message: error.response?.data?.message || error.message,
          details: error.response?.data?.details,
        }

        return Promise.reject(apiError)
      }
    )
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.instance.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.instance.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.instance.put<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.instance.delete<T>(url, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config)
    return response.data
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types for use in other modules
export type { AxiosRequestConfig } from 'axios'

declare global {
  interface Window {
    API_BASE_URL?: string
  }
}