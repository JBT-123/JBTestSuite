import { useState, useEffect, useCallback, useMemo } from 'react'
import type { SavedSearch, SearchSuggestion } from '../components/ui/AdvancedSearchInput'

const STORAGE_KEYS = {
  RECENT_SEARCHES: 'jb-recent-searches',
  SAVED_SEARCHES: 'jb-saved-searches',
} as const

interface UseAdvancedSearchOptions {
  maxRecentSearches?: number
  storageEnabled?: boolean
  generateSuggestions?: (query: string) => SearchSuggestion[]
}

export function useAdvancedSearch(options: UseAdvancedSearchOptions = {}) {
  const { maxRecentSearches = 10, storageEnabled = true, generateSuggestions } = options

  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])

  useEffect(() => {
    if (!storageEnabled) return

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error)
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES)
      if (stored) {
        setSavedSearches(JSON.parse(stored))
      }
    } catch (error) {
      console.warn('Failed to load saved searches:', error)
    }
  }, [storageEnabled])

  const saveToStorage = useCallback(
    (key: string, data: any) => {
      if (!storageEnabled) return

      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch (error) {
        console.warn(`Failed to save ${key}:`, error)
      }
    },
    [storageEnabled]
  )

  const addRecentSearch = useCallback(
    (search: string) => {
      if (!search.trim()) return

      const normalizedSearch = search.trim()

      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item !== normalizedSearch)
        const updated = [normalizedSearch, ...filtered].slice(0, maxRecentSearches)
        saveToStorage(STORAGE_KEYS.RECENT_SEARCHES, updated)
        return updated
      })
    },
    [maxRecentSearches, saveToStorage]
  )

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    if (storageEnabled) {
      localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES)
    }
  }, [storageEnabled])

  const saveSearch = useCallback(
    (name: string, query: string, filters?: Record<string, any>) => {
      if (!name.trim() || !query.trim()) return

      const newSavedSearch: SavedSearch = {
        id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        query: query.trim(),
        filters,
        createdAt: new Date().toISOString(),
      }

      setSavedSearches((prev) => {
        const updated = [newSavedSearch, ...prev]
        saveToStorage(STORAGE_KEYS.SAVED_SEARCHES, updated)
        return updated
      })

      return newSavedSearch
    },
    [saveToStorage]
  )

  const deleteSavedSearch = useCallback(
    (id: string) => {
      setSavedSearches((prev) => {
        const updated = prev.filter((search) => search.id !== id)
        saveToStorage(STORAGE_KEYS.SAVED_SEARCHES, updated)
        return updated
      })
    },
    [saveToStorage]
  )

  const updateSavedSearch = useCallback(
    (id: string, updates: Partial<SavedSearch>) => {
      setSavedSearches((prev) => {
        const updated = prev.map((search) =>
          search.id === id ? { ...search, ...updates } : search
        )
        saveToStorage(STORAGE_KEYS.SAVED_SEARCHES, updated)
        return updated
      })
    },
    [saveToStorage]
  )

  const findSavedSearch = useCallback(
    (id: string) => {
      return savedSearches.find((search) => search.id === id)
    },
    [savedSearches]
  )

  const generateSearchSuggestions = useCallback(
    (query: string): SearchSuggestion[] => {
      if (!query.trim()) return []

      const suggestions: SearchSuggestion[] = []

      if (generateSuggestions) {
        suggestions.push(...generateSuggestions(query))
      } else {
        const commonSearchTerms = [
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
          'search functionality',
          'data entry',
          'error handling',
        ]

        const matchingTerms = commonSearchTerms
          .filter((term) => term.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5)

        suggestions.push(
          ...matchingTerms.map((term, index) => ({
            id: `suggestion-${index}`,
            text: term,
            type: 'suggestion' as const,
            category: 'Common Terms',
          }))
        )
      }

      return suggestions
    },
    [generateSuggestions]
  )

  const searchStats = useMemo(
    () => ({
      totalRecentSearches: recentSearches.length,
      totalSavedSearches: savedSearches.length,
      oldestRecentSearch: recentSearches[recentSearches.length - 1] || null,
      newestSavedSearch: savedSearches[0] || null,
    }),
    [recentSearches, savedSearches]
  )

  return {
    recentSearches,
    savedSearches,
    addRecentSearch,
    clearRecentSearches,
    saveSearch,
    deleteSavedSearch,
    updateSavedSearch,
    findSavedSearch,
    generateSearchSuggestions,
    searchStats,
  }
}
