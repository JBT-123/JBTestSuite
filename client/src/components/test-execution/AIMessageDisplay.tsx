import React from 'react'

interface AIAnalysisResult {
  success: boolean
  competition_analysis?: {
    consistency_verification: {
      ui_pattern_compliance: {
        score: number
        assessment: string
        deviations_found: string[]
      }
    }
    exception_detection: {
      anomaly_severity: {
        critical: string[]
        major: string[]
        minor: string[]
      }
      recommended_actions: string[]
    }
    regression_testing_insights: {
      critical_test_points: {
        primary_user_actions: string[]
      }
      automation_selectors: {
        robust_selectors: Array<{
          element_description: string
          recommended_selector: string
        }>
      }
    }
  }
  analysis?: {
    interactive_elements: string[]
    test_suggestions: string[]
    potential_issues: string[]
  }
  usage?: {
    total_tokens: number
  }
  error?: string
  timestamp: string
}

interface AIMessageDisplayProps {
  analysisResult: AIAnalysisResult | null
  isAnalyzing?: boolean
  competitionMode?: boolean
}

export default function AIMessageDisplay({ 
  analysisResult, 
  isAnalyzing = false,
  competitionMode = false 
}: AIMessageDisplayProps) {
  
  if (isAnalyzing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-800 font-medium">
            {competitionMode ? 'Advanced AI analyzing screenshot...' : 'AI analyzing screenshot...'}
          </span>
        </div>
      </div>
    )
  }

  if (!analysisResult) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <p className="text-sm">
            {competitionMode 
              ? 'Advanced AI will analyze screenshots during test execution' 
              : 'AI analysis will appear here during test execution'
            }
          </p>
        </div>
      </div>
    )
  }

  if (!analysisResult.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 className="text-red-800 font-medium">AI Analysis Failed</h3>
        </div>
        <p className="text-red-700 text-sm">{analysisResult.error}</p>
        <p className="text-red-600 text-xs mt-1">Timestamp: {new Date(analysisResult.timestamp).toLocaleString()}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h3 className="text-green-800 font-medium">
            {competitionMode ? 'Advanced AI Analysis Complete' : 'AI Analysis Complete'}
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {analysisResult.usage && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {analysisResult.usage.total_tokens} tokens
            </span>
          )}
          <span>{new Date(analysisResult.timestamp).toLocaleString()}</span>
        </div>
      </div>

      {/* Advanced Mode Analysis */}
      {competitionMode && analysisResult.competition_analysis && (
        <div className="space-y-4">
          {/* UI Consistency Score */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-blue-800 font-medium mb-2">🎯 UI Consistency Verification</h4>
            <div className="flex items-center space-x-3 mb-2">
              <div className="text-2xl font-bold text-blue-600">
                {analysisResult.competition_analysis.consistency_verification.ui_pattern_compliance.score}/100
              </div>
              <div className="flex-1">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${analysisResult.competition_analysis.consistency_verification.ui_pattern_compliance.score}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-blue-700 text-sm">
              {analysisResult.competition_analysis.consistency_verification.ui_pattern_compliance.assessment}
            </p>
          </div>

          {/* Exception Detection */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-yellow-800 font-medium mb-2">⚠️ Exception Detection</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-red-600">
                  {analysisResult.competition_analysis.exception_detection.anomaly_severity.critical.length}
                </div>
                <div className="text-xs text-gray-600">Critical</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {analysisResult.competition_analysis.exception_detection.anomaly_severity.major.length}
                </div>
                <div className="text-xs text-gray-600">Major</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {analysisResult.competition_analysis.exception_detection.anomaly_severity.minor.length}
                </div>
                <div className="text-xs text-gray-600">Minor</div>
              </div>
            </div>
            {analysisResult.competition_analysis.exception_detection.recommended_actions.length > 0 && (
              <div className="mt-3">
                <p className="text-yellow-800 text-sm font-medium">Recommended Actions:</p>
                <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                  {analysisResult.competition_analysis.exception_detection.recommended_actions.map((action, idx) => (
                    <li key={idx}>• {action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Regression Testing Insights */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-green-800 font-medium mb-2">⚡ Regression Testing Insights</h4>
            
            {analysisResult.competition_analysis.regression_testing_insights.critical_test_points.primary_user_actions.length > 0 && (
              <div className="mb-3">
                <p className="text-green-800 text-sm font-medium">Key User Actions Found:</p>
                <ul className="text-green-700 text-sm mt-1 space-y-1">
                  {analysisResult.competition_analysis.regression_testing_insights.critical_test_points.primary_user_actions.map((action, idx) => (
                    <li key={idx}>• {action}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.competition_analysis.regression_testing_insights.automation_selectors.robust_selectors.length > 0 && (
              <div>
                <p className="text-green-800 text-sm font-medium">Automation Selectors:</p>
                <div className="space-y-2 mt-1">
                  {analysisResult.competition_analysis.regression_testing_insights.automation_selectors.robust_selectors.map((selector, idx) => (
                    <div key={idx} className="bg-white rounded p-2 border border-green-200">
                      <div className="text-green-800 text-sm font-medium">{selector.element_description}</div>
                      <div className="text-green-700 text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                        {selector.recommended_selector}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standard AI Analysis */}
      {!competitionMode && analysisResult.analysis && (
        <div className="space-y-4">
          {/* Interactive Elements */}
          {analysisResult.analysis.interactive_elements.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-800 font-medium mb-2">🎯 Interactive Elements Found</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                {analysisResult.analysis.interactive_elements.map((element, idx) => (
                  <li key={idx}>• {element}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Test Suggestions */}
          {analysisResult.analysis.test_suggestions.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-green-800 font-medium mb-2">💡 Test Suggestions</h4>
              <ul className="text-green-700 text-sm space-y-1">
                {analysisResult.analysis.test_suggestions.map((suggestion, idx) => (
                  <li key={idx}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Potential Issues */}
          {analysisResult.analysis.potential_issues.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-yellow-800 font-medium mb-2">⚠️ Potential Issues</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                {analysisResult.analysis.potential_issues.map((issue, idx) => (
                  <li key={idx}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}