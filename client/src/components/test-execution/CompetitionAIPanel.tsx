import React, { useState } from 'react'

interface ConsistencyVerification {
  ui_pattern_compliance: {
    score: number
    assessment: string
    deviations_found: string[]
  }
  visual_hierarchy: {
    header_elements: string[]
    main_content: string[]
    navigation_elements: string[]
    footer_elements: string[]
  }
  accessibility_compliance: {
    contrast_check: string
    text_readability: string
    interactive_element_sizing: string
    focus_indicators: string[]
  }
  cross_browser_indicators: {
    rendering_quality: string
    layout_stability: string
    potential_compatibility_issues: string[]
  }
}

interface ExceptionDetection {
  expected_anomalies: {
    loading_indicators: string[]
    modal_overlays: string[]
    notification_banners: string[]
    form_validation_messages: string[]
  }
  unexpected_anomalies: {
    error_states: string[]
    layout_breaks: string[]
    missing_content: string[]
    performance_indicators: string[]
  }
  anomaly_severity: {
    critical: string[]
    major: string[]
    minor: string[]
    informational: string[]
  }
  recommended_actions: string[]
}

interface RegressionTestingInsights {
  critical_test_points: {
    primary_user_actions: string[]
    data_entry_points: string[]
    navigation_paths: string[]
    state_change_triggers: string[]
  }
  automation_selectors: {
    robust_selectors: Array<{
      element_description: string
      recommended_selector: string
      selector_stability: string
      fallback_selectors: string[]
    }>
    dynamic_elements: string[]
    wait_conditions: string[]
  }
  test_prioritization: {
    high_impact_areas: string[]
    change_prone_elements: string[]
    performance_bottlenecks: string[]
    visual_regression_zones: string[]
  }
  historical_context_recommendations: {
    baseline_establishment: string[]
    change_detection_focus: string[]
    test_case_generation: string[]
  }
}

interface TechnicalAnalysis {
  page_performance: {
    load_completion_indicators: string[]
    async_content_areas: string[]
    interactive_readiness: string
  }
  responsive_design_analysis: {
    breakpoint_indicators: string[]
    mobile_compatibility: string[]
    tablet_considerations: string[]
  }
  security_observations: {
    authentication_state: string
    sensitive_data_visibility: string[]
    security_headers_evidence: string[]
  }
}

interface CompetitionAnalysis {
  consistency_verification: ConsistencyVerification
  exception_detection: ExceptionDetection
  regression_testing_insights: RegressionTestingInsights
  technical_analysis: TechnicalAnalysis
  screenshot_path: string
  timestamp: string
  usage_tokens?: number
}

interface CompetitionAIPanelProps {
  competitionAnalyses: CompetitionAnalysis[]
  isAnalyzing?: boolean
}

export default function CompetitionAIPanel({ competitionAnalyses, isAnalyzing }: CompetitionAIPanelProps) {
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'consistency' | 'exceptions' | 'regression' | 'technical'>('consistency')

  if (competitionAnalyses.length === 0 && !isAnalyzing) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Advanced AI Analysis</h3>
            <p className="text-sm text-gray-600">Next-Generation UI Automation Testing</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Consistency Verification</h4>
            </div>
            <p className="text-xs text-gray-600">UI pattern compliance, visual hierarchy, and accessibility analysis</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 rounded bg-yellow-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Exception Detection</h4>
            </div>
            <p className="text-xs text-gray-600">Automated anomaly identification with severity classification</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Regression Testing</h4>
            </div>
            <p className="text-xs text-gray-600">Accelerated testing insights with intelligent prioritization</p>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            {isAnalyzing ? "🤖 AI analysis in progress..." : "AI analysis will appear here during test execution"}
          </p>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 rounded-full">
              Powered by GPT-4o Vision
            </span>
          </div>
        </div>
      </div>
    )
  }

  const totalTokensUsed = competitionAnalyses.reduce((sum, analysis) => sum + (analysis.usage_tokens || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Advanced AI Analysis</h3>
            <p className="text-sm text-gray-600">{competitionAnalyses.length} screenshot(s) analyzed</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
            ✅ All 3 Challenges
          </span>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            {totalTokensUsed} tokens
          </span>
        </div>
      </div>

      {/* Analysis Cards */}
      {competitionAnalyses.map((analysis, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Analysis Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Screenshot Analysis #{index + 1}
                </h4>
                <p className="text-sm text-gray-600">
                  {new Date(analysis.timestamp).toLocaleString()}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Consistency Score */}
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    analysis.consistency_verification.ui_pattern_compliance.score >= 90 ? 'text-green-600' :
                    analysis.consistency_verification.ui_pattern_compliance.score >= 70 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {analysis.consistency_verification.ui_pattern_compliance.score}
                  </div>
                  <div className="text-xs text-gray-500">UI Score</div>
                </div>
                
                {/* Critical Issues Count */}
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    analysis.exception_detection.anomaly_severity.critical.length === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analysis.exception_detection.anomaly_severity.critical.length}
                  </div>
                  <div className="text-xs text-gray-500">Critical Issues</div>
                </div>
                
                {/* Toggle Button */}
                <button
                  onClick={() => setExpandedAnalysis(expandedAnalysis === index ? null : index)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {expandedAnalysis === index ? 'Collapse' : 'Expand'}
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Analysis */}
          {expandedAnalysis === index && (
            <div className="p-6">
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'consistency', label: 'Consistency', icon: '✓' },
                  { key: 'exceptions', label: 'Exceptions', icon: '⚠' },
                  { key: 'regression', label: 'Regression', icon: '⚡' },
                  { key: 'technical', label: 'Technical', icon: '🔧' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'consistency' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">UI Pattern Compliance</h5>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-blue-600">
                            {analysis.consistency_verification.ui_pattern_compliance.score}/100
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${analysis.consistency_verification.ui_pattern_compliance.score}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">
                          {analysis.consistency_verification.ui_pattern_compliance.assessment}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Accessibility Compliance</h5>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Contrast Check:</span>
                          <span className={`text-sm font-medium ${
                            analysis.consistency_verification.accessibility_compliance.contrast_check === 'pass' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {analysis.consistency_verification.accessibility_compliance.contrast_check}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {analysis.consistency_verification.accessibility_compliance.text_readability}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Visual Hierarchy</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {Object.entries(analysis.consistency_verification.visual_hierarchy).map(([section, elements]) => (
                        <div key={section} className="bg-gray-50 rounded-lg p-3">
                          <h6 className="text-xs font-medium text-gray-700 mb-2 capitalize">
                            {section.replace('_', ' ')}
                          </h6>
                          <ul className="space-y-1">
                            {elements.map((element, idx) => (
                              <li key={idx} className="text-xs text-gray-600">• {element}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'exceptions' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Anomaly Severity</h5>
                      {Object.entries(analysis.exception_detection.anomaly_severity).map(([severity, issues]) => (
                        <div key={severity} className="mb-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`w-3 h-3 rounded-full ${
                              severity === 'critical' ? 'bg-red-500' :
                              severity === 'major' ? 'bg-orange-500' :
                              severity === 'minor' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`} />
                            <span className="text-sm font-medium text-gray-700 capitalize">{severity}</span>
                            <span className="text-sm text-gray-500">({issues.length})</span>
                          </div>
                          {issues.length > 0 && (
                            <ul className="ml-5 space-y-1">
                              {issues.map((issue, idx) => (
                                <li key={idx} className="text-sm text-gray-600">• {issue}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Recommended Actions</h5>
                      <div className="bg-blue-50 rounded-lg p-4">
                        {analysis.exception_detection.recommended_actions.length > 0 ? (
                          <ul className="space-y-2">
                            {analysis.exception_detection.recommended_actions.map((action, idx) => (
                              <li key={idx} className="text-sm text-blue-700">✓ {action}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-blue-600">No specific actions required.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'regression' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Critical Test Points</h5>
                      {Object.entries(analysis.regression_testing_insights.critical_test_points).map(([category, points]) => (
                        <div key={category} className="mb-3">
                          <h6 className="text-xs font-medium text-gray-700 mb-1 capitalize">
                            {category.replace('_', ' ')}
                          </h6>
                          <ul className="space-y-1">
                            {points.map((point, idx) => (
                              <li key={idx} className="text-sm text-gray-600">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Automation Selectors</h5>
                      <div className="space-y-3">
                        {analysis.regression_testing_insights.automation_selectors.robust_selectors.map((selector, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {selector.element_description}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                selector.selector_stability === 'high' ? 'bg-green-100 text-green-800' :
                                selector.selector_stability === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {selector.selector_stability}
                              </span>
                            </div>
                            <code className="text-xs bg-white px-2 py-1 rounded border">
                              {selector.recommended_selector}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'technical' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Page Performance</h5>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 mb-2">
                          {analysis.technical_analysis.page_performance.interactive_readiness}
                        </p>
                        {analysis.technical_analysis.page_performance.load_completion_indicators.length > 0 && (
                          <ul className="space-y-1">
                            {analysis.technical_analysis.page_performance.load_completion_indicators.map((indicator, idx) => (
                              <li key={idx} className="text-xs text-gray-600">• {indicator}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Responsive Design</h5>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div>
                          <h6 className="text-xs font-medium text-gray-700">Mobile Compatibility</h6>
                          <ul className="space-y-1">
                            {analysis.technical_analysis.responsive_design_analysis.mobile_compatibility.map((item, idx) => (
                              <li key={idx} className="text-xs text-gray-600">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Security</h5>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-700">Auth State: </span>
                          <span className="text-xs text-gray-600">
                            {analysis.technical_analysis.security_observations.authentication_state}
                          </span>
                        </div>
                        {analysis.technical_analysis.security_observations.sensitive_data_visibility.length > 0 && (
                          <div>
                            <h6 className="text-xs font-medium text-gray-700 mb-1">Sensitive Data</h6>
                            <ul className="space-y-1">
                              {analysis.technical_analysis.security_observations.sensitive_data_visibility.map((item, idx) => (
                                <li key={idx} className="text-xs text-red-600">⚠ {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}