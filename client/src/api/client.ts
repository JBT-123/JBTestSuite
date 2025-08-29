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
      timeout: 30000, // Increased timeout to 30 seconds for slow operations
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

        // Handle network errors with enhanced retry logic
        if (!error.response && originalRequest && !(originalRequest as any)._retryCount) {
          ;(originalRequest as any)._retryCount = 0
        }

        // Retry network errors up to 3 times with exponential backoff
        if (
          (!error.response || error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') && 
          originalRequest && 
          (originalRequest as any)._retryCount < 3
        ) {
          ;(originalRequest as any)._retryCount = ((originalRequest as any)._retryCount || 0) + 1
          
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, (originalRequest as any)._retryCount - 1) * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
          
          console.warn(`Retrying request (attempt ${(originalRequest as any)._retryCount}/3) after ${delay}ms:`, originalRequest.url)
          return this.instance(originalRequest)
        }

        // Transform error response to consistent format
        const apiError: ApiError = {
          error: error.response?.data?.error || 'Network error',
          message: error.response?.data?.message || error.message || 'Connection failed. Please check if the server is running.',
          details: {
            ...error.response?.data?.details,
            code: error.code,
            status: error.response?.status,
            retryCount: (originalRequest as any)?._retryCount || 0
          },
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
