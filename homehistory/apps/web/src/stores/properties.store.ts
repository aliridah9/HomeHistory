import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { 
  Property, 
  PropertyAIScore, 
  SimilarProperty,
  SearchQuery,
  SearchResult,
  SearchFilters,
  PaginationState,
  ViewState
} from '@/types'
import { propertiesApi, searchApi, handleApiError } from '@/lib/api'

interface PropertiesState {
  // Properties
  properties: Property[]
  currentProperty: Property | null
  propertyScores: Record<string, PropertyAIScore>
  recommendations: Record<string, SimilarProperty[]>
  
  // Search
  searchQuery: SearchQuery
  searchResults: SearchResult | null
  savedSearches: any[]
  
  // UI State
  listView: ViewState
  detailView: ViewState
  searchView: ViewState
  pagination: PaginationState
  
  // Actions
  getProperties: (params?: any) => Promise<void>
  getProperty: (id: string) => Promise<Property | null>
  createProperty: (data: any) => Promise<Property | null>
  updateProperty: (id: string, data: Partial<Property>) => Promise<Property | null>
  deleteProperty: (id: string) => Promise<boolean>
  
  // Search Actions
  searchProperties: (query: SearchQuery) => Promise<void>
  naturalLanguageSearch: (query: string) => Promise<void>
  clearSearch: () => void
  updateSearchFilters: (filters: Partial<SearchFilters>) => void
  
  // AI Actions
  getPropertyScore: (id: string) => Promise<PropertyAIScore | null>
  recalculateScore: (id: string) => Promise<PropertyAIScore | null>
  getSimilarProperties: (id: string, limit?: number) => Promise<SimilarProperty[]>
  
  // Saved Searches
  saveSearch: (name: string, query: SearchQuery) => Promise<boolean>
  getSavedSearches: () => Promise<void>
  deleteSavedSearch: (id: string) => Promise<boolean>
  
  // UI Actions
  setCurrentProperty: (property: Property | null) => void
  setPagination: (pagination: Partial<PaginationState>) => void
  setLoading: (view: keyof Pick<PropertiesState, 'listView' | 'detailView' | 'searchView'>, loading: boolean) => void
  setError: (view: keyof Pick<PropertiesState, 'listView' | 'detailView' | 'searchView'>, error: string | null) => void
  clearErrors: () => void
}

const initialSearchQuery: SearchQuery = {
  filters: {},
  sort: { field: 'createdAt', direction: 'desc' },
  page: 1,
  limit: 20,
}

const initialViewState: ViewState = {
  loading: false,
  error: null,
  data: null,
  lastUpdated: new Date().toISOString(),
}

const initialPagination: PaginationState = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
}

export const usePropertiesStore = create<PropertiesState>()(
  immer((set, get) => ({
    // Initial state
    properties: [],
    currentProperty: null,
    propertyScores: {},
    recommendations: {},
    searchQuery: initialSearchQuery,
    searchResults: null,
    savedSearches: [],
    
    listView: initialViewState,
    detailView: initialViewState,
    searchView: initialViewState,
    pagination: initialPagination,

    // Properties Actions
    getProperties: async (params = {}) => {
      try {
        set((state) => {
          state.listView.loading = true
          state.listView.error = null
        })

        const response = await propertiesApi.getProperties({
          page: get().pagination.page,
          limit: get().pagination.limit,
          ...params,
        })

        if (response.data.success) {
          const { data, total, page, limit, totalPages } = response.data.data

          set((state) => {
            state.properties = data
            state.pagination = { page, limit, total, totalPages }
            state.listView.loading = false
            state.listView.data = data
            state.listView.lastUpdated = new Date().toISOString()
          })
        } else {
          throw new Error(response.data.message || 'Failed to fetch properties')
        }
      } catch (error: any) {
        const errorMessage = handleApiError(error)
        set((state) => {
          state.listView.error = errorMessage
          state.listView.loading = false
        })
      }
    },

    getProperty: async (id) => {
      try {
        set((state) => {
          state.detailView.loading = true
          state.detailView.error = null
        })

        const response = await propertiesApi.getProperty(id)

        if (response.data.success) {
          const property = response.data.data

          set((state) => {
            state.currentProperty = property
            state.detailView.loading = false
            state.detailView.data = property
            state.detailView.lastUpdated = new Date().toISOString()

            // Update in properties list if exists
            const index = state.properties.findIndex(p => p.id === id)
            if (index !== -1) {
              state.properties[index] = property
            }
          })

          return property
        } else {
          throw new Error(response.data.message || 'Failed to fetch property')
        }
      } catch (error: any) {
        const errorMessage = handleApiError(error)
        set((state) => {
          state.detailView.error = errorMessage
          state.detailView.loading = false
        })
        return null
      }
    },

    createProperty: async (data) => {
      try {
        set((state) => {
          state.listView.loading = true
          state.listView.error = null
        })

        const response = await propertiesApi.createProperty(data)

        if (response.data.success) {
          const property = response.data.data

          set((state) => {
            state.properties.unshift(property)
            state.listView.loading = false
          })

          return property
        } else {
          throw new Error(response.data.message || 'Failed to create property')
        }
      } catch (error: any) {
        const errorMessage = handleApiError(error)
        set((state) => {
          state.listView.error = errorMessage
          state.listView.loading = false
        })
        return null
      }
    },

    updateProperty: async (id, data) => {
      try {
        const response = await propertiesApi.updateProperty(id, data)

        if (response.data.success) {
          const property = response.data.data

          set((state) => {
            // Update in properties list
            const index = state.properties.findIndex(p => p.id === id)
            if (index !== -1) {
              state.properties[index] = property
            }

            // Update current property if it's the same
            if (state.currentProperty?.id === id) {
              state.currentProperty = property
            }
          })

          return property
        } else {
          throw new Error(response.data.message || 'Failed to update property')
        }
      } catch (error: any) {
        const errorMessage = handleApiError(error)
        set((state) => {
          state.detailView.error = errorMessage
        })
        return null
      }
    },

    deleteProperty: async (id) => {
      try {
        const response = await propertiesApi.deleteProperty(id)

        if (response.data.success) {
          set((state) => {
            state.properties = state.properties.filter(p => p.id !== id)
            
            if (state.currentProperty?.id === id) {
              state.currentProperty = null
            }

            // Remove related data
            delete state.propertyScores[id]
            delete state.recommendations[id]
          })

          return true
        } else {
          throw new Error(response.data.message || 'Failed to delete property')
        }
      } catch (error: any) {
        const errorMessage = handleApiError(error)
        set((state) => {
          state.listView.error = errorMessage
        })
        return false
      }
    },

    // Search Actions
    searchProperties: async (query) => {
      try {
        set((state) => {
          state.searchView.loading = true
          state.searchView.error = null
          state.searchQuery = query
        })

        const response = await searchApi.searchProperties({
          q: query.q,
          filters: query.filters,
          sort: query.sort.field,
          page: query.page,
          limit: query.limit,
        })

        if (response.data.success) {
          const searchResults = response.data.data

          set((state) => {
            state.searchResults = searchResults
            state.properties = searchResults.properties
            state.pagination = {
              page: searchResults.page,
              limit: searchResults.limit,
              total: searchResults.total,
              totalPages: searchResults.totalPages,
            }
            state.searchView.loading = false
            state.searchView.data = searchResults
            state.searchView.lastUpdated = new Date().toISOString()
          })
        } else {
          throw new Error(response.data.message || 'Search failed')
        }
      } catch (error: any) {
        const errorMessage = handleApiError(error)
        set((state) => {
          state.searchView.error = errorMessage
          state.searchView.loading = false
        })
      }
    },

    naturalLanguageSearch: async (query) => {
      try {
        set((state) => {
          state.searchView.loading = true
          state.searchView.error = null
        })

        const response = await searchApi.naturalLanguageSearch(query)

        if (response.data.success) {
          const searchResults = response.data.data

          set((state) => {
            state.searchResults = searchResults
            state.properties = searchResults.properties
            state.pagination = {
              page: searchResults.page,
              limit: searchResults.limit,
              total: searchResults.total,
              totalPages: searchResults.totalPages,
            }
            state.searchQuery = {
              ...state.searchQuery,
              q: query,
            }
            state.searchView.loading = false
            state.searchView.data = searchResults
            state.searchView.lastUpdated = new Date().toISOString()
          })
        } else {
          throw new Error(response.data.message || 'Natural language search failed')
        }
      } catch (error: any) {
        const errorMessage = handleApiError(error)
        set((state) => {
          state.searchView.error = errorMessage
          state.searchView.loading = false
        })
      }
    },

    clearSearch: () => {
      set((state) => {
        state.searchQuery = initialSearchQuery
        state.searchResults = null
        state.searchView = initialViewState
        state.pagination = initialPagination
      })
    },

    updateSearchFilters: (filters) => {
      set((state) => {
        state.searchQuery.filters = { ...state.searchQuery.filters, ...filters }
      })
    },

    // AI Actions
    getPropertyScore: async (id) => {
      try {
        const response = await propertiesApi.getPropertyScore(id)

        if (response.data.success) {
          const score = response.data.data

          set((state) => {
            state.propertyScores[id] = score
          })

          return score
        } else {
          throw new Error(response.data.message || 'Failed to get property score')
        }
      } catch (error: any) {
        console.error('Failed to get property score:', handleApiError(error))
        return null
      }
    },

    recalculateScore: async (id) => {
      try {
        const response = await propertiesApi.recalculateScore(id)

        if (response.data.success) {
          const score = response.data.data

          set((state) => {
            state.propertyScores[id] = score
            
            // Update property with new score
            const propertyIndex = state.properties.findIndex(p => p.id === id)
            if (propertyIndex !== -1) {
              state.properties[propertyIndex].aiScore = score
            }
            
            if (state.currentProperty?.id === id) {
              state.currentProperty.aiScore = score
            }
          })

          return score
        } else {
          throw new Error(response.data.message || 'Failed to recalculate score')
        }
      } catch (error: any) {
        console.error('Failed to recalculate score:', handleApiError(error))
        return null
      }
    },

    getSimilarProperties: async (id, limit = 10) => {
      try {
        const response = await propertiesApi.getSimilarProperties(id, limit)

        if (response.data.success) {
          const recommendations = response.data.data

          set((state) => {
            state.recommendations[id] = recommendations
          })

          return recommendations
        } else {
          throw new Error(response.data.message || 'Failed to get similar properties')
        }
      } catch (error: any) {
        console.error('Failed to get similar properties:', handleApiError(error))
        return []
      }
    },

    // Saved Searches
    saveSearch: async (name, query) => {
      try {
        const response = await searchApi.saveSearch({
          name,
          query: query.q || '',
          filters: query.filters,
        })

        if (response.data.success) {
          const savedSearch = response.data.data

          set((state) => {
            state.savedSearches.push(savedSearch)
          })

          return true
        } else {
          throw new Error(response.data.message || 'Failed to save search')
        }
      } catch (error: any) {
        console.error('Failed to save search:', handleApiError(error))
        return false
      }
    },

    getSavedSearches: async () => {
      try {
        const response = await searchApi.getSavedSearches()

        if (response.data.success) {
          set((state) => {
            state.savedSearches = response.data.data
          })
        }
      } catch (error: any) {
        console.error('Failed to get saved searches:', handleApiError(error))
      }
    },

    deleteSavedSearch: async (id) => {
      try {
        const response = await searchApi.deleteSavedSearch(id)

        if (response.data.success) {
          set((state) => {
            state.savedSearches = state.savedSearches.filter(s => s.id !== id)
          })

          return true
        } else {
          throw new Error(response.data.message || 'Failed to delete saved search')
        }
      } catch (error: any) {
        console.error('Failed to delete saved search:', handleApiError(error))
        return false
      }
    },

    // UI Actions
    setCurrentProperty: (property) => {
      set((state) => {
        state.currentProperty = property
      })
    },

    setPagination: (pagination) => {
      set((state) => {
        state.pagination = { ...state.pagination, ...pagination }
      })
    },

    setLoading: (view, loading) => {
      set((state) => {
        state[view].loading = loading
      })
    },

    setError: (view, error) => {
      set((state) => {
        state[view].error = error
      })
    },

    clearErrors: () => {
      set((state) => {
        state.listView.error = null
        state.detailView.error = null
        state.searchView.error = null
      })
    },
  }))
)

// Selectors
export const useProperties = () => usePropertiesStore((state) => state.properties)
export const useCurrentProperty = () => usePropertiesStore((state) => state.currentProperty)
export const usePropertyScore = (id?: string) => usePropertiesStore((state) => 
  id ? state.propertyScores[id] : null
)
export const usePropertyRecommendations = (id?: string) => usePropertiesStore((state) => 
  id ? state.recommendations[id] : []
)
export const useSearchResults = () => usePropertiesStore((state) => state.searchResults)
export const useSearchQuery = () => usePropertiesStore((state) => state.searchQuery)
export const useSavedSearches = () => usePropertiesStore((state) => state.savedSearches)
export const usePagination = () => usePropertiesStore((state) => state.pagination)
export const usePropertiesLoading = () => usePropertiesStore((state) => state.listView.loading)
export const usePropertyDetailLoading = () => usePropertiesStore((state) => state.detailView.loading)
export const useSearchLoading = () => usePropertiesStore((state) => state.searchView.loading)