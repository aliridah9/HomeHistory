import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/stores/ui.store'

// Create query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay function (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (only if data is stale)
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Network mode
      networkMode: 'online',
    },
  },
})

// Global error handler
queryClient.setMutationDefaults(['auth'], {
  onError: (error: any) => {
    // Handle auth errors globally
    if (error?.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
  },
})

// Query keys factory
export const queryKeys = {
  // Auth
  auth: {
    profile: () => ['auth', 'profile'] as const,
    permissions: () => ['auth', 'permissions'] as const,
  },
  
  // Properties
  properties: {
    all: () => ['properties'] as const,
    lists: () => [...queryKeys.properties.all(), 'list'] as const,
    list: (params: any) => [...queryKeys.properties.lists(), params] as const,
    details: () => [...queryKeys.properties.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.properties.details(), id] as const,
    score: (id: string) => [...queryKeys.properties.detail(id), 'score'] as const,
    recommendations: (id: string) => [...queryKeys.properties.detail(id), 'recommendations'] as const,
  },
  
  // Search
  search: {
    all: () => ['search'] as const,
    results: (query: any) => [...queryKeys.search.all(), 'results', query] as const,
    suggestions: (query: string) => [...queryKeys.search.all(), 'suggestions', query] as const,
    saved: () => [...queryKeys.search.all(), 'saved'] as const,
  },
  
  // AI
  ai: {
    all: () => ['ai'] as const,
    metrics: () => [...queryKeys.ai.all(), 'metrics'] as const,
    analytics: (params?: any) => [...queryKeys.ai.all(), 'analytics', params] as const,
    health: () => [...queryKeys.ai.all(), 'health'] as const,
  },
  
  // Admin
  admin: {
    all: () => ['admin'] as const,
    dashboard: () => [...queryKeys.admin.all(), 'dashboard'] as const,
    users: (params?: any) => [...queryKeys.admin.all(), 'users', params] as const,
    ai: {
      all: () => [...queryKeys.admin.all(), 'ai'] as const,
      dashboard: () => [...queryKeys.admin.ai.all(), 'dashboard'] as const,
      metrics: (params?: any) => [...queryKeys.admin.ai.all(), 'metrics', params] as const,
      alerts: (params?: any) => [...queryKeys.admin.ai.all(), 'alerts', params] as const,
      cache: () => [...queryKeys.admin.ai.all(), 'cache'] as const,
      health: () => [...queryKeys.admin.ai.all(), 'health'] as const,
      costs: (timeframe?: string) => [...queryKeys.admin.ai.all(), 'costs', timeframe] as const,
    },
  },
  
  // Users
  users: {
    all: () => ['users'] as const,
    lists: () => [...queryKeys.users.all(), 'list'] as const,
    list: (params?: any) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    activity: (id: string) => [...queryKeys.users.detail(id), 'activity'] as const,
  },
  
  // Documents
  documents: {
    all: () => ['documents'] as const,
    lists: () => [...queryKeys.documents.all(), 'list'] as const,
    list: (params?: any) => [...queryKeys.documents.lists(), params] as const,
    details: () => [...queryKeys.documents.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
  },
  
  // Maintenance
  maintenance: {
    all: () => ['maintenance'] as const,
    property: (propertyId: string) => [...queryKeys.maintenance.all(), 'property', propertyId] as const,
    schedule: (propertyId: string) => [...queryKeys.maintenance.property(propertyId), 'schedule'] as const,
  },
  
  // Notifications
  notifications: {
    all: () => ['notifications'] as const,
    list: (params?: any) => [...queryKeys.notifications.all(), 'list', params] as const,
    unreadCount: () => [...queryKeys.notifications.all(), 'unread-count'] as const,
  },
  
  // Health
  health: {
    all: () => ['health'] as const,
    system: () => [...queryKeys.health.all(), 'system'] as const,
    ai: () => [...queryKeys.health.all(), 'ai'] as const,
  },
}

// Custom hooks for common operations
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient()
  
  return {
    invalidateProperties: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all() })
    },
    invalidateProperty: (id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.detail(id) })
    },
    invalidateSearch: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.search.all() })
    },
    invalidateAuth: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() })
    },
    invalidateNotifications: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() })
    },
    invalidateAll: () => {
      queryClient.invalidateQueries()
    },
  }
}

// Prefetch utilities
export const usePrefetchQueries = () => {
  const queryClient = useQueryClient()
  
  return {
    prefetchProperty: async (id: string) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.properties.detail(id),
        queryFn: () => propertiesApi.getProperty(id),
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    },
    
    prefetchPropertyScore: async (id: string) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.properties.score(id),
        queryFn: () => propertiesApi.getPropertyScore(id),
        staleTime: 10 * 60 * 1000, // 10 minutes
      })
    },
    
    prefetchRecommendations: async (id: string) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.properties.recommendations(id),
        queryFn: () => propertiesApi.getSimilarProperties(id),
        staleTime: 30 * 60 * 1000, // 30 minutes
      })
    },
  }
}

// Query client helpers
export const useQueryClient = () => queryClient

// Optimistic update helpers
export const useOptimisticUpdates = () => {
  const queryClient = useQueryClient()
  
  return {
    updateProperty: (id: string, updatedData: any) => {
      queryClient.setQueryData(
        queryKeys.properties.detail(id),
        (oldData: any) => ({
          ...oldData,
          data: { ...oldData?.data, ...updatedData },
        })
      )
    },
    
    updatePropertyInList: (id: string, updatedData: any) => {
      // Update all property lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.properties.lists() },
        (oldData: any) => {
          if (!oldData?.data?.data) return oldData
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: oldData.data.data.map((property: any) =>
                property.id === id ? { ...property, ...updatedData } : property
              ),
            },
          }
        }
      )
    },
    
    addPropertyToList: (newProperty: any) => {
      queryClient.setQueriesData(
        { queryKey: queryKeys.properties.lists() },
        (oldData: any) => {
          if (!oldData?.data?.data) return oldData
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: [newProperty, ...oldData.data.data],
              total: oldData.data.total + 1,
            },
          }
        }
      )
    },
    
    removePropertyFromList: (id: string) => {
      queryClient.setQueriesData(
        { queryKey: queryKeys.properties.lists() },
        (oldData: any) => {
          if (!oldData?.data?.data) return oldData
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: oldData.data.data.filter((property: any) => property.id !== id),
              total: oldData.data.total - 1,
            },
          }
        }
      )
    },
  }
}

// Error handler hook
export const useQueryErrorHandler = () => {
  const toast = useToast()
  const { clearAuth } = useAuthStore()
  
  return (error: any) => {
    console.error('Query error:', error)
    
    if (error?.response?.status === 401) {
      toast.error('Authentication Error', 'Please log in again')
      clearAuth()
      window.location.href = '/login'
    } else if (error?.response?.status === 403) {
      toast.error('Access Denied', 'You do not have permission to perform this action')
    } else if (error?.response?.status === 404) {
      toast.error('Not Found', 'The requested resource was not found')
    } else if (error?.response?.status >= 500) {
      toast.error('Server Error', 'An internal server error occurred. Please try again later.')
    } else {
      toast.error('Error', error?.message || 'An unexpected error occurred')
    }
  }
}

// Performance monitoring
export const useQueryPerformance = () => {
  const queryClient = useQueryClient()
  
  return {
    getQueryCache: () => queryClient.getQueryCache(),
    getMutationCache: () => queryClient.getMutationCache(),
    getQueryStats: () => {
      const cache = queryClient.getQueryCache()
      const queries = cache.getAll()
      
      return {
        total: queries.length,
        stale: queries.filter(q => q.isStale()).length,
        loading: queries.filter(q => q.isFetching()).length,
        error: queries.filter(q => q.state.status === 'error').length,
        success: queries.filter(q => q.state.status === 'success').length,
      }
    },
    clearCache: () => queryClient.clear(),
  }
}

// Import required API functions
import { propertiesApi } from '@/lib/api'