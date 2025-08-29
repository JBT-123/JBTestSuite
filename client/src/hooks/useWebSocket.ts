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

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = `ws://localhost:8000/api/v1/ws/connect`,
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
      return
    }

    updateStatus('connecting')

    try {
      const connectionUrl = buildConnectionUrl()
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
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect]) // Don't include connect/disconnect to avoid infinite loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      stopHeartbeat()
      if (ws.current) {
        ws.current.close(1000)
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