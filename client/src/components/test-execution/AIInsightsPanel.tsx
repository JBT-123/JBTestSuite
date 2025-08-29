import React from 'react'

interface AIAnalysis {
  screenshot_path: string
  analysis: {
    interactive_elements: string[]
    test_suggestions: string[]
    potential_issues: string[]
  }
  timestamp: string
}

interface FinalAIAnalysis {
  execution_result_analysis: {
    overall_status: string
    key_findings: string[]
    performance_insights: any
    improvement_suggestions: any[]
  }
  timestamp: string
}

interface AIInsightsPanelProps {
  aiAnalyses: AIAnalysis[]
  finalAnalysis?: FinalAIAnalysis
}

export default function AIInsightsPanel({ aiAnalyses, finalAnalysis }: AIInsightsPanelProps) {
  if (aiAnalyses.length === 0 && !finalAnalysis) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 013.305-2.033.75.75 0 00-.714-1.319 37 37 0 00-3.446 2.12A2.216 2.216 0 006 9.393v.38a31.293 31.293 0 00-4.28-1.746.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424zM6 11.459a29.848 29.848 0 00-2.455-1.158 41.029 41.029 0 00-.39 3.114.75.75 0 00.419.74c.528.256 1.046.53 1.554.82-.21-.899-.455-1.746-.518-2.516zM21.26 10.306c.023.196.04.393.54.591a29.866 29.866 0 00-.455 1.158.75.75 0 01-.419-.74 41.029 41.029 0 00-.39-3.114z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">AI Insights</h3>
        </div>
        <p className="text-sm text-gray-600">
          AI analysis will appear here during test execution. Screenshots are automatically analyzed using GPT-4 Vision.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 013.305-2.033.75.75 0 00-.714-1.319 37 37 0 00-3.446 2.12A2.216 2.216 0 006 9.393v.38a31.293 31.293 0 00-4.28-1.746.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424zM6 11.459a29.848 29.848 0 00-2.455-1.158 41.029 41.029 0 00-.39 3.114.75.75 0 00.419.74c.528.256 1.046.53 1.554.82-.21-.899-.455-1.746-.518-2.516zM21.26 10.306c.023.196.04.393.54.591a29.866 29.866 0 00-.455 1.158.75.75 0 01-.419-.74 41.029 41.029 0 00-.39-3.114z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900">AI Insights</h3>
        <div className="flex-1"></div>
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          Powered by GPT-4 Vision
        </span>
      </div>

      {/* Screenshot Analyses */}
      {aiAnalyses.map((analysis, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              Screenshot Analysis #{index + 1}
            </h4>
            <span className="text-xs text-gray-500">
              {new Date(analysis.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Interactive Elements */}
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-3 h-3 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Interactive Elements
              </h5>
              <ul className="space-y-1">
                {analysis.analysis.interactive_elements.map((element, idx) => (
                  <li key={idx} className="text-xs text-gray-600">
                    • {element}
                  </li>
                ))}
              </ul>
            </div>

            {/* Test Suggestions */}
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Test Suggestions
              </h5>
              <ul className="space-y-1">
                {analysis.analysis.test_suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-xs text-gray-600">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Potential Issues */}
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-3 h-3 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Issues Found
              </h5>
              <ul className="space-y-1">
                {analysis.analysis.potential_issues.length > 0 ? (
                  analysis.analysis.potential_issues.map((issue, idx) => (
                    <li key={idx} className="text-xs text-gray-600">
                      • {issue}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-gray-500 italic">No issues detected</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ))}

      {/* Final AI Analysis */}
      {finalAnalysis && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <svg className="w-4 h-4 mr-1 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Final AI Analysis
            </h4>
            <span className="text-xs text-gray-500">
              {new Date(finalAnalysis.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="space-y-3">
            {/* Overall Status */}
            <div>
              <span className="text-sm font-medium text-gray-700">Status: </span>
              <span className={`text-sm px-2 py-1 rounded-full ${
                finalAnalysis.execution_result_analysis.overall_status === 'success' ? 'bg-green-100 text-green-800' :
                finalAnalysis.execution_result_analysis.overall_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {finalAnalysis.execution_result_analysis.overall_status}
              </span>
            </div>

            {/* Key Findings */}
            {finalAnalysis.execution_result_analysis.key_findings.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Key Findings:</h5>
                <ul className="space-y-1">
                  {finalAnalysis.execution_result_analysis.key_findings.map((finding, idx) => (
                    <li key={idx} className="text-sm text-gray-600">• {finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvement Suggestions */}
            {finalAnalysis.execution_result_analysis.improvement_suggestions.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">AI Recommendations:</h5>
                <div className="space-y-2">
                  {finalAnalysis.execution_result_analysis.improvement_suggestions.map((suggestion, idx) => (
                    <div key={idx} className="bg-white rounded p-2 border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{suggestion.category}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                          suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{suggestion.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}