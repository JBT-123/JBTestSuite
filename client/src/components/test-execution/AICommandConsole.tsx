import React, { useState, useRef, useEffect } from 'react'

interface AIMessage {
  id: string
  type: 'info' | 'analysis' | 'warning' | 'error' | 'success' | 'competition'
  timestamp: Date
  message: string
  data?: any
  stepNumber?: number
  screenshotPath?: string
}

interface AICommandConsoleProps {
  messages: AIMessage[]
  isAIActive?: boolean
  isProcessing?: boolean
  onClearConsole?: () => void
  onToggleAI?: () => void
  competitionMode?: boolean
}

export default function AICommandConsole({ 
  messages, 
  isAIActive = true, 
  isProcessing = false,
  onClearConsole,
  onToggleAI,
  competitionMode = false
}: AICommandConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const consoleRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoScroll])

  // Handle scroll to detect if user scrolled up
  const handleScroll = () => {
    if (consoleRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = consoleRef.current
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5
      setAutoScroll(isAtBottom)
    }
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'info':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'analysis':
        return (
          <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'competition':
        return (
          <svg className="w-4 h-4 text-gradient-to-r from-blue-400 to-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      case 'success':
        return (
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'text-blue-300'
      case 'analysis': return 'text-purple-300'
      case 'competition': return 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400'
      case 'warning': return 'text-yellow-300'
      case 'error': return 'text-red-300'
      case 'success': return 'text-green-300'
      default: return 'text-gray-300'
    }
  }

  const formatMessage = (message: string, data?: any) => {
    // If there's structured data, format it nicely
    if (data && typeof data === 'object') {
      if (data.consistency_score || data.critical_issues !== undefined) {
        return (
          <div>
            <div className="mb-2">{message}</div>
            <div className="text-sm space-y-1 ml-4 border-l-2 border-gray-600 pl-3">
              {data.consistency_score && (
                <div>UI Consistency: <span className="text-blue-400">{data.consistency_score}/100</span></div>
              )}
              {data.critical_issues !== undefined && (
                <div>Critical Issues: <span className="text-red-400">{data.critical_issues}</span></div>
              )}
              {data.tokens_used && (
                <div>Tokens Used: <span className="text-gray-400">{data.tokens_used}</span></div>
              )}
            </div>
          </div>
        )
      }
    }
    
    return message
  }

  if (!isExpanded) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isAIActive ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-300">AI Command Console</span>
            {competitionMode && (
              <span className="px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
                Advanced Mode
              </span>
            )}
            {messages.length > 0 && (
              <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                {messages.length} messages
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg font-mono text-sm">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isAIActive ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className="text-sm font-medium text-gray-300">AI Command Console</span>
          {competitionMode && (
            <span className="px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
              🏆 Advanced Mode
            </span>
          )}
          {isProcessing && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-400">Processing...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!autoScroll && (
            <button
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ↓ New Messages
            </button>
          )}
          
          {onToggleAI && (
            <button
              onClick={onToggleAI}
              className={`px-2 py-1 text-xs rounded ${
                isAIActive 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {isAIActive ? 'AI ON' : 'AI OFF'}
            </button>
          )}
          
          {onClearConsole && (
            <button
              onClick={onClearConsole}
              className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded hover:bg-gray-700"
            >
              Clear
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Console Messages */}
      <div 
        ref={consoleRef}
        onScroll={handleScroll}
        className="h-64 overflow-y-auto p-2 space-y-2 bg-black"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <div className="mb-2">AI Console Ready</div>
            <div className="text-xs">
              {competitionMode ? 
                'Advanced AI analysis will appear here during test execution...' :
                'AI insights and analysis will appear here during test execution...'
              }
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-2 py-1">
              <div className="flex-shrink-0 mt-1">
                {getMessageIcon(message.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.stepNumber && (
                    <span className="text-xs bg-gray-700 text-gray-300 px-1 rounded">
                      Step {message.stepNumber}
                    </span>
                  )}
                  <span className={`text-xs font-medium ${getMessageTypeColor(message.type)}`}>
                    {message.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-gray-200 text-sm leading-relaxed">
                  {formatMessage(message.message, message.data)}
                </div>
                {message.screenshotPath && (
                  <div className="mt-1">
                    <span className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                      📸 Screenshot: {message.screenshotPath.split('/').pop()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Console Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-gray-700 bg-gray-800 text-xs">
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">Messages: {messages.length}</span>
          {messages.length > 0 && (
            <span className="text-gray-400">
              Latest: {messages[messages.length - 1]?.timestamp.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`${isAIActive ? 'text-green-400' : 'text-gray-400'}`}>
            AI {isAIActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
          {competitionMode && (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              ADVANCED
            </span>
          )}
        </div>
      </div>
    </div>
  )
}