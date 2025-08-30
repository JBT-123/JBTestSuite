import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export type WebSocketMessage = {
  type: string
  timestamp: string
  [key: string]: any
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export type TestExecutionEvent = {
  type: 'test_execution_started' | 'test_execution_progress' | 'test_execution_completed' | 'test_execution_error' | 'test_execution_queued' | 'test_execution_cancelled'
  execution_id?: string
  test_case_id?: string
  step_number?: number
  total_steps?: number
  step_description?: string
  screenshot_path?: string
  progress_percentage?: number
  success?: boolean
  result_summary?: string
  error_message?: string
  message?: string
  ai_analysis?: {
    screenshot_path: string
    analysis: {
      interactive_elements: string[]
      test_suggestions: string[]
      potential_issues: string[]
    }
    timestamp: string
  }
  final_ai_analysis?: {
    execution_result_analysis: {
      overall_status: string
      key_findings: string[]
      performance_insights: any
      improvement_suggestions: any[]
    }
    timestamp: string
  }
  timestamp: string
}

interface UseWebSocketOptions {
  url?: string
  clientId?: string
  userId?: string
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectInterval?: number
  heartbeatInterval?: number
  onMessage?: (message: WebSocketMessage) => void
  onTestExecutionEvent?: (event: TestExecutionEvent) => void
  onConnectionChange?: (status: WebSocketStatus) => void
  onError?: (error: Event) => void
}

// Helper function to get WebSocket URL
const getWebSocketUrl = () => {
  const hostname = window.location.hostname
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const port = process.env.NODE_ENV === 'production' ? window.location.port : '8000'
  const url = `${protocol}//${hostname}:${port}/api/v1/ws/connect`
  console.log('[WebSocket] Generated URL:', url)
  console.log('[WebSocket] Environment:', { hostname, protocol: window.location.protocol, NODE_ENV: process.env.NODE_ENV, port })
  return url
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = 'ws://localhost:8000/api/v1/ws/connect', // Temporary: back to hardcoded for debugging
    clientId,
    userId,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
    onMessage,
    onTestExecutionEvent,
    onConnectionChange,
    onError
  } = options

  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const queryClient = useQueryClient()

  const buildConnectionUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (clientId) params.append('client_id', clientId)
    if (userId) params.append('user_id', userId)
    
    return `${url}${params.toString() ? '?' + params.toString() : ''}`
  }, [url, clientId, userId])

  const updateStatus = useCallback((newStatus: WebSocketStatus) => {
    setStatus(newStatus)
    setIsConnected(newStatus === 'connected')
    onConnectionChange?.(newStatus)
  }, [onConnectionChange])

  const sendMessage = useCallback((message: Record<string, any>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  const sendHeartbeat = useCallback(() => {
    sendMessage({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    })
  }, [sendMessage])

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval)
  }, [sendHeartbeat, heartbeatInterval])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = undefined
    }
  }, [])

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      setLastMessage(message)
      onMessage?.(message)

      // Handle test execution events
      if (message.type.startsWith('test_execution')) {
        onTestExecutionEvent?.(message as TestExecutionEvent)
        
        // Invalidate related queries on execution completion
        if (message.type === 'test_execution_completed' || message.type === 'test_execution_error') {
          queryClient.invalidateQueries({ queryKey: ['test-executions'] })
          queryClient.invalidateQueries({ queryKey: ['test-cases'] })
        }
      }

      // Handle heartbeat acknowledgment
      if (message.type === 'heartbeat_ack') {
        // Reset reconnect attempts on successful heartbeat
        reconnectAttemptsRef.current = 0
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }, [onMessage, onTestExecutionEvent, queryClient])

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected, skipping')
      return
    }
    
    if (ws.current?.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Already connecting, skipping')
      return
    }

    console.log('[WebSocket] Starting connection process')
    updateStatus('connecting')

    try {
      const connectionUrl = buildConnectionUrl()
      console.log('[WebSocket] Attempting to connect to:', connectionUrl)
      ws.current = new WebSocket(connectionUrl)

      ws.current.onopen = () => {
        updateStatus('connected')
        reconnectAttemptsRef.current = 0
        startHeartbeat()
      }

      ws.current.onmessage = handleMessage

      ws.current.onerror = (error) => {
        updateStatus('error')
        stopHeartbeat()
        onError?.(error)
        console.error('WebSocket error:', error)
      }

      ws.current.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', { code: event.code, reason: event.reason, wasClean: event.wasClean })
        updateStatus('disconnected')
        stopHeartbeat()

        // Only attempt reconnection if it wasn't a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

    } catch (error) {
      updateStatus('error')
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [buildConnectionUrl, updateStatus, handleMessage, onError, startHeartbeat, stopHeartbeat, reconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    reconnectAttemptsRef.current = reconnectAttempts // Prevent reconnection
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    stopHeartbeat()

    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect')
      ws.current = null
    }
    
    updateStatus('disconnected')
  }, [reconnectAttempts, stopHeartbeat, updateStatus])

  // Test execution control methods
  const startTestExecution = useCallback((testCaseId: string) => {
    return sendMessage({
      type: 'test_execution_start',
      test_case_id: testCaseId,
      timestamp: new Date().toISOString()
    })
  }, [sendMessage])

  const stopTestExecution = useCallback((executionId: string) => {
    return sendMessage({
      type: 'test_execution_stop',
      execution_id: executionId,
      timestamp: new Date().toISOString()
    })
  }, [sendMessage])

  const subscribeToExecution = useCallback((executionId: string) => {
    return sendMessage({
      type: 'subscribe_to_execution',
      execution_id: executionId,
      timestamp: new Date().toISOString()
    })
  }, [sendMessage])

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) {
      console.log('[WebSocket] useEffect triggered, attempting connection')
      connect()
    }

    return () => {
      console.log('[WebSocket] useEffect cleanup triggered')
      // Don't disconnect immediately in cleanup to avoid React Strict Mode issues
      // The cleanup effect below will handle proper cleanup on unmount
    }
  }, [autoConnect]) // Don't include connect/disconnect to avoid infinite loops

  // Cleanup on unmount - only runs when component unmounts for real
  useEffect(() => {
    return () => {
      console.log('[WebSocket] Final cleanup on unmount')
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      stopHeartbeat()
      if (ws.current) {
        console.log('[WebSocket] Closing connection on unmount')
        ws.current.close(1000, 'Component unmounting')
        ws.current = null
      }
    }
  }, [stopHeartbeat])

  return {
    // Connection state
    status,
    isConnected,
    lastMessage,
    
    // Connection control
    connect,
    disconnect,
    sendMessage,
    
    // Test execution control
    startTestExecution,
    stopTestExecution,
    subscribeToExecution,
  }
}