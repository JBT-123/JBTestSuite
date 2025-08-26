import { useEffect, useRef, useState } from 'react'
import type { WebSocketMessage } from '../types'

export const useWebSocket = (url: string) => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const websocket = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(url)
    websocket.current = ws

    ws.onopen = () => {
      setConnectionStatus('connected')
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        setMessages((prev) => [...prev, message])
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('disconnected')
    }

    return () => {
      ws.close()
    }
  }, [url])

  const sendMessage = (message: any) => {
    if (websocket.current?.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify(message))
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  return {
    messages,
    connectionStatus,
    sendMessage,
    clearMessages,
  }
}