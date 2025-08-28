import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAdvancedSearch } from './useAdvancedSearch'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = localStorageMock as any

describe('useAdvancedSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('initializes with empty arrays when no stored data', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      expect(result.current.recentSearches).toEqual([])
      expect(result.current.savedSearches).toEqual([])
      expect(result.current.searchStats.totalRecentSearches).toBe(0)
      expect(result.current.searchStats.totalSavedSearches).toBe(0)
    })

    it('loads stored recent searches on initialization', () => {
      const storedRecentSearches = ['search 1', 'search 2', 'search 3']
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'jb-recent-searches') {
          return JSON.stringify(storedRecentSearches)
        }
        return null
      })
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      expect(result.current.recentSearches).toEqual(storedRecentSearches)
      expect(result.current.searchStats.totalRecentSearches).toBe(3)
    })

    it('loads stored saved searches on initialization', () => {
      const storedSavedSearches = [
        {
          id: 'saved-1',
          name: 'My Search',
          query: 'test query',
          filters: { status: 'active' },
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'jb-saved-searches') {
          return JSON.stringify(storedSavedSearches)
        }
        return null
      })
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      expect(result.current.savedSearches).toEqual(storedSavedSearches)
      expect(result.current.searchStats.totalSavedSearches).toBe(1)
    })

    it('handles localStorage parse errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      expect(result.current.recentSearches).toEqual([])
      expect(result.current.savedSearches).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load recent searches:', expect.any(Error))
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load saved searches:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Recent Searches Management', () => {
    it('adds a new recent search', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      act(() => {
        result.current.addRecentSearch('new search')
      })
      
      expect(result.current.recentSearches).toEqual(['new search'])
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jb-recent-searches',
        JSON.stringify(['new search'])
      )
    })

    it('moves existing search to front when added again', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['search 1', 'search 2', 'search 3']))
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      act(() => {
        result.current.addRecentSearch('search 2')
      })
      
      expect(result.current.recentSearches).toEqual(['search 2', 'search 1', 'search 3'])
    })

    it('limits recent searches to maxRecentSearches', () => {
      const { result } = renderHook(() => useAdvancedSearch({ maxRecentSearches: 3 }))
      
      // Add more searches than the limit
      act(() => {
        result.current.addRecentSearch('search 1')
        result.current.addRecentSearch('search 2')
        result.current.addRecentSearch('search 3')
        result.current.addRecentSearch('search 4')
      })
      
      expect(result.current.recentSearches).toEqual(['search 4', 'search 3', 'search 2'])
      expect(result.current.recentSearches).toHaveLength(3)
    })

    it('ignores empty or whitespace-only searches', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      act(() => {
        result.current.addRecentSearch('')
        result.current.addRecentSearch('   ')
        result.current.addRecentSearch('\t\n')
      })
      
      expect(result.current.recentSearches).toEqual([])
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('trims whitespace from searches', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      act(() => {
        result.current.addRecentSearch('  trimmed search  ')
      })
      
      expect(result.current.recentSearches).toEqual(['trimmed search'])
    })

    it('clears all recent searches', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['search 1', 'search 2']))
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      act(() => {
        result.current.clearRecentSearches()
      })
      
      expect(result.current.recentSearches).toEqual([])
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jb-recent-searches')
    })
  })

  describe('Saved Searches Management', () => {
    it('saves a new search', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      let savedSearch: any
      act(() => {
        savedSearch = result.current.saveSearch('My Search', 'test query', { status: 'active' })
      })
      
      expect(savedSearch).toMatchObject({
        id: expect.stringMatching(/^search-\d+-[a-z0-9]+$/),
        name: 'My Search',
        query: 'test query',
        filters: { status: 'active' },
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      })
      
      expect(result.current.savedSearches).toHaveLength(1)
      expect(result.current.savedSearches[0]).toEqual(savedSearch)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jb-saved-searches',
        JSON.stringify([savedSearch])
      )
    })

    it('returns nothing for invalid save parameters', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      let savedSearch: any
      act(() => {
        savedSearch = result.current.saveSearch('', 'test query')
      })
      
      expect(savedSearch).toBeUndefined()
      expect(result.current.savedSearches).toHaveLength(0)
      
      act(() => {
        savedSearch = result.current.saveSearch('Name', '')
      })
      
      expect(savedSearch).toBeUndefined()
      expect(result.current.savedSearches).toHaveLength(0)
    })

    it('deletes a saved search', () => {
      const existingSavedSearches = [
        {
          id: 'search-1',
          name: 'Search 1',
          query: 'query 1',
          filters: {},
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'search-2',
          name: 'Search 2',
          query: 'query 2',
          filters: {},
          createdAt: '2024-01-02T00:00:00Z',
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingSavedSearches))
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      act(() => {
        result.current.deleteSavedSearch('search-1')
      })
      
      expect(result.current.savedSearches).toHaveLength(1)
      expect(result.current.savedSearches[0].id).toBe('search-2')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jb-saved-searches',
        JSON.stringify([existingSavedSearches[1]])
      )
    })

    it('updates a saved search', () => {
      const existingSavedSearches = [
        {
          id: 'search-1',
          name: 'Search 1',
          query: 'query 1',
          filters: {},
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingSavedSearches))
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      act(() => {
        result.current.updateSavedSearch('search-1', {
          name: 'Updated Search',
          query: 'updated query',
        })
      })
      
      expect(result.current.savedSearches[0]).toMatchObject({
        id: 'search-1',
        name: 'Updated Search',
        query: 'updated query',
        filters: {},
        createdAt: '2024-01-01T00:00:00Z',
      })
    })

    it('finds a saved search by id', () => {
      const existingSavedSearches = [
        {
          id: 'search-1',
          name: 'Search 1',
          query: 'query 1',
          filters: {},
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingSavedSearches))
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      const foundSearch = result.current.findSavedSearch('search-1')
      expect(foundSearch).toEqual(existingSavedSearches[0])
      
      const notFoundSearch = result.current.findSavedSearch('nonexistent')
      expect(notFoundSearch).toBeUndefined()
    })
  })

  describe('Search Suggestions', () => {
    it('generates default suggestions for query', () => {
      const { result } = renderHook(() => useAdvancedSearch())
      
      const suggestions = result.current.generateSearchSuggestions('test')
      
      // Check that we get suggestions for 'test'
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            text: 'test case',
            type: 'suggestion',
            category: 'Common Terms',
          }),
          expect.objectContaining({
            text: 'smoke test',
            type: 'suggestion',
            category: 'Common Terms',
          }),
        ])
      )
    })

    it('returns empty array for empty query', () => {
      const { result } = renderHook(() => useAdvancedSearch())
      
      const suggestions = result.current.generateSearchSuggestions('')
      expect(suggestions).toEqual([])
    })

    it('uses custom suggestion generator when provided', () => {
      const customGenerator = vi.fn().mockReturnValue([
        {
          id: 'custom-1',
          text: 'custom suggestion',
          type: 'suggestion',
          category: 'Custom',
        },
      ])
      
      const { result } = renderHook(() =>
        useAdvancedSearch({ generateSuggestions: customGenerator })
      )
      
      const suggestions = result.current.generateSearchSuggestions('test')
      
      expect(customGenerator).toHaveBeenCalledWith('test')
      expect(suggestions).toEqual([
        {
          id: 'custom-1',
          text: 'custom suggestion',
          type: 'suggestion',
          category: 'Custom',
        },
      ])
    })

    it('limits suggestions to 5 by default', () => {
      const { result } = renderHook(() => useAdvancedSearch())
      
      const suggestions = result.current.generateSearchSuggestions('a') // Should match many terms
      
      expect(suggestions).toHaveLength(5)
    })
  })

  describe('Configuration Options', () => {
    it('respects maxRecentSearches option', () => {
      const { result } = renderHook(() => useAdvancedSearch({ maxRecentSearches: 2 }))
      
      act(() => {
        result.current.addRecentSearch('search 1')
        result.current.addRecentSearch('search 2')
        result.current.addRecentSearch('search 3')
      })
      
      expect(result.current.recentSearches).toHaveLength(2)
      expect(result.current.recentSearches).toEqual(['search 3', 'search 2'])
    })

    it('respects storageEnabled: false option', () => {
      const { result } = renderHook(() => useAdvancedSearch({ storageEnabled: false }))
      
      act(() => {
        result.current.addRecentSearch('search 1')
      })
      
      expect(result.current.recentSearches).toEqual(['search 1'])
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('Search Stats', () => {
    it('provides correct search statistics', () => {
      const recentSearches = ['recent 1', 'recent 2', 'recent 3']
      const savedSearches = [
        {
          id: 'saved-1',
          name: 'Saved 1',
          query: 'query 1',
          filters: {},
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'saved-2',
          name: 'Saved 2',
          query: 'query 2',
          filters: {},
          createdAt: '2024-01-02T00:00:00Z',
        },
      ]

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'jb-recent-searches') return JSON.stringify(recentSearches)
        if (key === 'jb-saved-searches') return JSON.stringify(savedSearches)
        return null
      })
      
      const { result } = renderHook(() => useAdvancedSearch())
      
      expect(result.current.searchStats).toEqual({
        totalRecentSearches: 3,
        totalSavedSearches: 2,
        oldestRecentSearch: 'recent 3',
        newestSavedSearch: savedSearches[0],
      })
    })
  })
})