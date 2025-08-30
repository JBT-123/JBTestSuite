import { useState, useEffect, useRef, useCallback } from 'react'
import { useDebouncedCallback } from '../../hooks/useDebounce'

export interface SearchSuggestion {
  id: string
  text: string
  type: 'recent' | 'suggestion' | 'saved'
  category?: string
  count?: number
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters?: Record<string, any>
  createdAt: string
}

export interface AdvancedSearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  onSavedSearchSelect?: (savedSearch: SavedSearch) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  showSuggestions?: boolean
  suggestions?: SearchSuggestion[]
  savedSearches?: SavedSearch[]
  onSaveSearch?: (name: string) => void
  onDeleteSavedSearch?: (id: string) => void
  recentSearches?: string[]
  onAddRecentSearch?: (search: string) => void
  maxSuggestions?: number
}

function AdvancedSearchInput({
  value,
  onChange,
  onClear,
  onSavedSearchSelect,
  placeholder = 'Search...',
  className = '',
  autoFocus = false,
  showSuggestions = true,
  suggestions = [],
  savedSearches = [],
  onSaveSearch,
  onDeleteSavedSearch,
  recentSearches = [],
  onAddRecentSearch,
  maxSuggestions = 10,
}: AdvancedSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebouncedCallback((searchValue: string) => {
    if (searchValue.length > 0 && onAddRecentSearch) {
      onAddRecentSearch(searchValue)
    }
  }, 1000)

  useEffect(() => {
    debouncedSearch(value)
  }, [value, debouncedSearch])

  const filteredSuggestions = showSuggestions
    ? [
        ...savedSearches.map((search) => ({
          id: `saved-${search.id}`,
          text: search.name,
          type: 'saved' as const,
          category: 'Saved Searches',
          query: search.query,
        })),
        ...recentSearches
          .filter(
            (search) => search.toLowerCase().includes(value.toLowerCase()) && search !== value
          )
          .slice(0, 5)
          .map((search, index) => ({
            id: `recent-${index}`,
            text: search,
            type: 'recent' as const,
            category: 'Recent Searches',
          })),
        ...suggestions
          .filter(
            (suggestion) =>
              suggestion.text.toLowerCase().includes(value.toLowerCase()) &&
              suggestion.text !== value
          )
          .slice(0, maxSuggestions - savedSearches.length - 5),
      ]
    : []

  const allSuggestions = filteredSuggestions.slice(0, maxSuggestions)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || allSuggestions.length === 0) {
        if (e.key === 'ArrowDown' && showSuggestions) {
          setIsOpen(true)
          return
        }
        if (e.key === 'Enter' && value.trim()) {
          onAddRecentSearch?.(value)
          inputRef.current?.blur()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev < allSuggestions.length - 1 ? prev + 1 : -1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > -1 ? prev - 1 : allSuggestions.length - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0) {
            handleSuggestionSelect(allSuggestions[highlightedIndex])
          } else if (value.trim()) {
            onAddRecentSearch?.(value)
            inputRef.current?.blur()
          }
          break
        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    },
    [isOpen, allSuggestions, highlightedIndex, value, onAddRecentSearch]
  )

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'saved') {
      const savedSearch = savedSearches.find((s) => s.id === suggestion.id.replace('saved-', ''))
      if (savedSearch && onSavedSearchSelect) {
        onSavedSearchSelect(savedSearch)
      }
    } else {
      onChange(suggestion.text)
    }
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.blur()
  }

  const handleSaveSearch = () => {
    if (saveName.trim() && onSaveSearch && value.trim()) {
      onSaveSearch(saveName.trim())
      setSaveName('')
      setShowSaveDialog(false)
    }
  }

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node) &&
      inputRef.current &&
      !inputRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  const groupedSuggestions = allSuggestions.reduce(
    (acc, suggestion, index) => {
      const category = suggestion.category || 'Suggestions'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push({ ...suggestion, originalIndex: index })
      return acc
    },
    {} as Record<string, Array<SearchSuggestion & { originalIndex: number }>>
  )

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => showSuggestions && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-20 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {value && onSaveSearch && (
            <button
              type="button"
              onClick={() => setShowSaveDialog(true)}
              className="text-gray-400 hover:text-blue-600 focus:outline-none focus:text-blue-600"
              title="Save search"
              aria-label="Save current search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          )}
          {value && onClear && (
            <button
              type="button"
              onClick={() => {
                onClear()
                setIsOpen(false)
              }}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {isOpen && showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg z-50"
          role="listbox"
          aria-label="Search suggestions"
        >
          {allSuggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No suggestions available
            </div>
          ) : (
            Object.entries(groupedSuggestions).map(([category, categoryItems]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  {category}
                </div>
                {categoryItems.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between ${
                      highlightedIndex === suggestion.originalIndex
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-900'
                    }`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    role="option"
                    aria-selected={highlightedIndex === suggestion.originalIndex}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        {suggestion.type === 'recent' && (
                          <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                        {suggestion.type === 'saved' && (
                          <svg
                            className="h-4 w-4 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        )}
                        {suggestion.type === 'suggestion' && (
                          <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="truncate">{suggestion.text}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {suggestion.count && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {suggestion.count}
                        </span>
                      )}
                      {suggestion.type === 'saved' && onDeleteSavedSearch && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteSavedSearch(suggestion.id.replace('saved-', ''))
                          }}
                          className="text-gray-400 hover:text-red-600 focus:outline-none"
                          aria-label={`Delete saved search: ${suggestion.text}`}
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {showSaveDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Save Search</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="save-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Name
                </label>
                <input
                  id="save-name"
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter a name for this search"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Query:</p>
                <p className="text-sm font-mono text-gray-900 break-all">{value}</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveDialog(false)
                    setSaveName('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSearch}
                  disabled={!saveName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedSearchInput
