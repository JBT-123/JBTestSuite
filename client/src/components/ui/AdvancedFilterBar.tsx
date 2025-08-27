import { useState } from 'react'
import Button from './Button'
import Select, { SelectOption } from './Select'
import AdvancedSearchInput, { SavedSearch } from './AdvancedSearchInput'
import Input from './Input'
import { useAdvancedSearch } from '../../hooks'

export interface AdvancedFilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onSavedSearchSelect?: (savedSearch: SavedSearch) => void
  statusFilter?: string
  onStatusFilterChange?: (status: string | undefined) => void
  priorityFilter?: string
  onPriorityFilterChange?: (priority: string | undefined) => void
  dateRange?: { from: string; to: string }
  onDateRangeChange?: (range: { from: string; to: string } | undefined) => void
  onClearFilters?: () => void
  statusOptions?: SelectOption[]
  priorityOptions?: SelectOption[]
  className?: string
  showQuickFilters?: boolean
  quickFilters?: Array<{
    id: string
    label: string
    query: string
    filters?: Record<string, any>
  }>
  onQuickFilterSelect?: (filterId: string) => void
}

const DEFAULT_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'disabled', label: 'Disabled' },
]

const DEFAULT_PRIORITY_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const DEFAULT_QUICK_FILTERS = [
  {
    id: 'recent',
    label: 'Recently Created',
    query: '',
    filters: {
      dateRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: '',
      },
    },
  },
  {
    id: 'active-high',
    label: 'Active High Priority',
    query: '',
    filters: { status: 'active', priority: 'high' },
  },
  { id: 'draft-tests', label: 'Draft Tests', query: '', filters: { status: 'draft' } },
  { id: 'ui-tests', label: 'UI Tests', query: 'user interface ui login form', filters: {} },
  { id: 'api-tests', label: 'API Tests', query: 'api endpoint request response', filters: {} },
]

function AdvancedFilterBar({
  searchValue,
  onSearchChange,
  onSavedSearchSelect,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  priorityOptions = DEFAULT_PRIORITY_OPTIONS,
  className = '',
  showQuickFilters = true,
  quickFilters = DEFAULT_QUICK_FILTERS,
  onQuickFilterSelect,
}: AdvancedFilterBarProps) {
  const [showDateFilters, setShowDateFilters] = useState(false)
  const [tempDateRange, setTempDateRange] = useState(dateRange || { from: '', to: '' })

  const {
    recentSearches,
    savedSearches,
    addRecentSearch,
    saveSearch,
    deleteSavedSearch,
    generateSearchSuggestions,
  } = useAdvancedSearch({
    generateSuggestions: (query) => {
      const commonTerms = [
        'test case',
        'automation',
        'selenium',
        'login',
        'register',
        'user interface',
        'api test',
        'integration',
        'regression',
        'smoke test',
        'performance',
        'security',
        'mobile',
        'responsive',
        'accessibility',
        'form validation',
        'navigation',
        'search',
        'data entry',
        'error handling',
        'browser compatibility',
        'user experience',
        'functionality',
        'workflow',
      ]

      return commonTerms
        .filter((term) => term.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
        .map((term, index) => ({
          id: `suggestion-${index}`,
          text: term,
          type: 'suggestion' as const,
          category: 'Common Terms',
        }))
    },
  })

  const hasActiveFilters = Boolean(
    searchValue || statusFilter || priorityFilter || (dateRange && (dateRange.from || dateRange.to))
  )

  const handleDateRangeApply = () => {
    if (tempDateRange.from || tempDateRange.to) {
      onDateRangeChange?.(tempDateRange)
    } else {
      onDateRangeChange?.(undefined)
    }
    setShowDateFilters(false)
  }

  const handleDateRangeClear = () => {
    setTempDateRange({ from: '', to: '' })
    onDateRangeChange?.(undefined)
    setShowDateFilters(false)
  }

  const handleSaveSearch = (name: string) => {
    const currentFilters = {
      status: statusFilter,
      priority: priorityFilter,
      dateRange,
    }

    const savedSearch = saveSearch(name, searchValue, currentFilters)
    if (savedSearch) {
      // Optional: Show success notification
      console.log('Search saved:', savedSearch)
    }
  }

  const handleSavedSearchSelect = (savedSearch: SavedSearch) => {
    onSearchChange(savedSearch.query)

    if (savedSearch.filters) {
      if (savedSearch.filters.status && onStatusFilterChange) {
        onStatusFilterChange(savedSearch.filters.status)
      }
      if (savedSearch.filters.priority && onPriorityFilterChange) {
        onPriorityFilterChange(savedSearch.filters.priority)
      }
      if (savedSearch.filters.dateRange && onDateRangeChange) {
        onDateRangeChange(savedSearch.filters.dateRange)
      }
    }

    onSavedSearchSelect?.(savedSearch)
  }

  const handleQuickFilterSelect = (filterId: string) => {
    const quickFilter = quickFilters.find((f) => f.id === filterId)
    if (!quickFilter) return

    if (quickFilter.query) {
      onSearchChange(quickFilter.query)
    }

    if (quickFilter.filters) {
      if (quickFilter.filters.status && onStatusFilterChange) {
        onStatusFilterChange(quickFilter.filters.status)
      }
      if (quickFilter.filters.priority && onPriorityFilterChange) {
        onPriorityFilterChange(quickFilter.filters.priority)
      }
      if (quickFilter.filters.dateRange && onDateRangeChange) {
        onDateRangeChange(quickFilter.filters.dateRange)
      }
    }

    onQuickFilterSelect?.(filterId)
  }

  return (
    <div className={`space-y-4 ${className}`} role="search" aria-label="Advanced filter test cases">
      {/* Quick Filters */}
      {showQuickFilters && quickFilters.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              Quick Filters:
            </span>
            {quickFilters.map((filter) => (
              <Button
                key={filter.id}
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilterSelect(filter.id)}
                className="text-xs bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <AdvancedSearchInput
            value={searchValue}
            onChange={onSearchChange}
            onClear={() => onSearchChange('')}
            onSavedSearchSelect={handleSavedSearchSelect}
            onSaveSearch={handleSaveSearch}
            onDeleteSavedSearch={deleteSavedSearch}
            onAddRecentSearch={addRecentSearch}
            placeholder="Search test cases..."
            className="flex-1 sm:max-w-md"
            showSuggestions={true}
            suggestions={generateSearchSuggestions(searchValue)}
            savedSearches={savedSearches}
            recentSearches={recentSearches}
            maxSuggestions={12}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {onStatusFilterChange && (
              <Select
                value={statusFilter || ''}
                onChange={(e) => onStatusFilterChange(e.target.value || undefined)}
                options={statusOptions}
                placeholder="Filter by status"
                className="w-full sm:w-40"
                aria-label="Filter test cases by status"
              />
            )}

            {onPriorityFilterChange && (
              <Select
                value={priorityFilter || ''}
                onChange={(e) => onPriorityFilterChange(e.target.value || undefined)}
                options={priorityOptions}
                placeholder="Filter by priority"
                className="w-full sm:w-40"
                aria-label="Filter test cases by priority"
              />
            )}

            {onDateRangeChange && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDateFilters(!showDateFilters)}
                  className={`w-full sm:w-auto ${dateRange?.from || dateRange?.to ? 'bg-blue-50 border-blue-300' : ''}`}
                  aria-expanded={showDateFilters}
                  aria-haspopup="true"
                  aria-label={`Date range filter ${dateRange?.from || dateRange?.to ? '(active)' : ''}`}
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Date Range
                  {(dateRange?.from || dateRange?.to) && (
                    <span
                      className="ml-1 text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5"
                      aria-hidden="true"
                    >
                      1
                    </span>
                  )}
                </Button>

                {showDateFilters && (
                  <div
                    className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-4 shadow-lg z-10"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="date-filter-title"
                  >
                    <div className="space-y-4">
                      <h3 id="date-filter-title" className="font-medium text-gray-900 sr-only">
                        Date Range Filter
                      </h3>
                      <div>
                        <label
                          htmlFor="from-date"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          From Date
                        </label>
                        <Input
                          id="from-date"
                          type="date"
                          value={tempDateRange.from}
                          onChange={(e) =>
                            setTempDateRange((prev) => ({ ...prev, from: e.target.value }))
                          }
                          className="w-full"
                          aria-describedby="from-date-help"
                        />
                        <span id="from-date-help" className="sr-only">
                          Start date for filtering test cases
                        </span>
                      </div>
                      <div>
                        <label
                          htmlFor="to-date"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          To Date
                        </label>
                        <Input
                          id="to-date"
                          type="date"
                          value={tempDateRange.to}
                          onChange={(e) =>
                            setTempDateRange((prev) => ({ ...prev, to: e.target.value }))
                          }
                          className="w-full"
                          aria-describedby="to-date-help"
                        />
                        <span id="to-date-help" className="sr-only">
                          End date for filtering test cases
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={handleDateRangeApply}
                          className="flex-1"
                          aria-label="Apply date range filter"
                        >
                          Apply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDateRangeClear}
                          className="flex-1"
                          aria-label="Clear date range filter"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && onClearFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="w-full sm:w-auto"
              aria-label="Clear all active filters"
            >
              <svg
                className="h-4 w-4 mr-2 sm:mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="sm:inline">Clear Filters</span>
            </Button>
          )}

          {(recentSearches.length > 0 || savedSearches.length > 0) && (
            <div className="text-xs text-gray-500 flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              {savedSearches.length} saved
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdvancedFilterBar
