import axios, { AxiosResponse, AxiosError } from 'axios'
import { storage } from './utils'
import { API_BASE_URL } from '@/config';

// API Configuration

// Create axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = storage.get('auth_token', null)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      storage.remove('auth_token')
      storage.remove('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
  details?: any
}

// Auth API
export const authApi = {
  lookup: (payload: { email?: string; phone?: string }) =>
    api.post<ApiResponse<{ exists: boolean; userId?: string; providers: Array<'password'|'google'|'facebook'> }>>('/auth/lookup', payload),
  
  login: (credentials: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: any; token: string }>>('/auth/login', credentials),
    
  register: (userData: { 
    name: string
    email: string
    password: string
    role?: string
  }) =>
    api.post<ApiResponse<{ user: any; token: string }>>('/auth/register', userData),
    
  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),
    
  refreshToken: () =>
    api.post<ApiResponse<{ token: string }>>('/auth/refresh'),
    
  forgotPassword: (email: string) =>
    api.post<ApiResponse<null>>('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<null>>('/auth/reset-password', { token, password }),
    
  getProfile: () =>
    api.get<ApiResponse<any>>('/auth/profile'),
  me: () => api.get<ApiResponse<any>>('/auth/me'),
    
  updateProfile: (data: Partial<any>) =>
    api.put<ApiResponse<any>>('/auth/profile', data),
}

// Landing data helpers (fetch with credentials, graceful fallbacks)
export const API_BASE_URL_LANDING = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const fetchOpts: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } }

export async function getPopularProperties() {
  try {
    const r = await fetch(`${API_BASE_URL_LANDING.replace(/\/$/, '')}/properties?limit=6&location=NY`, fetchOpts)
    if (!r.ok) throw new Error('bad')
    return await r.json()
  } catch {
    return [
      { id:'p1', title:'Villa · For Sale', price:1199000, beds:4, baths:3, areaSqft:2450, city:'NYC', image:'popular-properties-1.jpg' },
      { id:'p2', title:'Condo · For Sale', price:543000, beds:2, baths:2, areaSqft:1200, city:'NYC', image:'popular-properties-2.jpg' },
      { id:'p3', title:'Coffee shop · For Rent', price:2450, beds:0, baths:1, areaSqft:950, city:'NYC', image:'popular-properties-3.jpg' },
    ]
  }
}

export async function getDirectory(kind:'lenders'|'agents'|'contractors') {
  try {
    const r = await fetch(`${API_BASE_URL_LANDING.replace(/\/$/, '')}/directory/${kind}`, fetchOpts)
    if (!r.ok) throw new Error('bad')
    return await r.json()
  } catch {
    return [
      { id:'1', name:'Lauren Drew', role:'Lender', rating:4.9, months:32, clients:278, success:0.91, projects:9 },
      { id:'2', name:'Jasper Nguyen', role:'Agent', rating:4.7, months:28, clients:198, success:0.88, projects:7 },
    ]
  }
}

export async function getContractors() {
  try {
    const r = await fetch(`${API_BASE_URL_LANDING.replace(/\/$/, '')}/contractors?limit=3`, fetchOpts)
    if (!r.ok) throw new Error('bad')
    return await r.json()
  } catch {
    return [
      { id:'c1', name:'Sarah Johnson', image:'trusted-contractors-1.jpg', rating:4.9, clients:127 },
      { id:'c2', name:'Mike Chen', image:'trusted-contractors-2.jpg', rating:4.8, clients:89 },
      { id:'c3', name:'David Rodriguez', image:'trusted-contractors-3.jpg', rating:4.7, clients:156 },
    ]
  }
}

export async function getFaqs() {
  try {
    const r = await fetch(`${API_BASE_URL_LANDING.replace(/\/$/, '')}/faqs`, fetchOpts)
    if (!r.ok) throw new Error('bad')
    return await r.json()
  } catch {
    return [
      { id:'faq1', q:'What types of properties can I find on this platform?', a:'Residential, land, commercial, and more across buy/rent/sell/auction.' },
      { id:'faq2', q:'How do reports work?', a:'Enter an address to generate ownership, permits, liens, and comps.' },
      { id:'faq3', q:'Can I connect with verified professionals?', a:'Yes, our platform features verified real estate agents, lenders, and contractors with ratings, reviews, and success metrics.' },
      { id:'faq4', q:'Is there a fee to use the platform?', a:'Basic property search and browsing is free. Premium features like detailed reports and professional consultations may have associated fees.' },
      { id:'faq5', q:'How accurate is the property data?', a:'We aggregate data from multiple authoritative sources including MLS, public records, and verified user submissions to ensure accuracy.' },
    ]
  }
}

// Properties API
export const propertiesApi = {
  getProperties: (params?: {
    page?: number
    limit?: number
    city?: string
    state?: string
    propertyType?: string
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
    bathrooms?: number
  }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/properties', { params }),
    
  getProperty: (id: string) =>
    api.get<ApiResponse<any>>(`/properties/${id}`),
    
  createProperty: (data: any) =>
    api.post<ApiResponse<any>>('/properties', data),
    
  updateProperty: (id: string, data: Partial<any>) =>
    api.put<ApiResponse<any>>(`/properties/${id}`, data),
    
  deleteProperty: (id: string) =>
    api.delete<ApiResponse<null>>(`/properties/${id}`),
    
  getPropertyScore: (id: string) =>
    api.get<ApiResponse<any>>(`/properties/${id}/score`),
    
  recalculateScore: (id: string) =>
    api.post<ApiResponse<any>>(`/properties/${id}/recalculate-score`),
    
  getSimilarProperties: (id: string, limit?: number) =>
    api.get<ApiResponse<any[]>>(`/properties/${id}/similar`, { 
      params: { limit } 
    }),
}

// Search API
export const searchApi = {
  searchProperties: (params: {
    q?: string
    filters?: any
    sort?: string
    page?: number
    limit?: number
  }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/search', { params }),
    
  naturalLanguageSearch: (query: string) =>
    api.post<ApiResponse<PaginatedResponse<any>>>('/search/nl', { query }),
    
  getSearchSuggestions: (query: string) =>
    api.get<ApiResponse<string[]>>('/search/suggestions', { 
      params: { q: query } 
    }),
    
  saveSearch: (searchData: {
    query: string
    filters: any
    name?: string
  }) =>
    api.post<ApiResponse<any>>('/search/saved', searchData),
    
  getSavedSearches: () =>
    api.get<ApiResponse<any[]>>('/search/saved'),
    
  deleteSavedSearch: (id: string) =>
    api.delete<ApiResponse<null>>(`/search/saved/${id}`),
}

// AI API
export const aiApi = {
  analyzeProperty: (propertyId: string) =>
    api.post<ApiResponse<any>>('/ai/analyze/property', { propertyId }),
    
  analyzeDocument: (documentId: string) =>
    api.post<ApiResponse<any>>('/ai/analyze/document', { documentId }),
    
  generateEmbedding: (text: string) =>
    api.post<ApiResponse<{ embedding: number[] }>>('/ai/embedding', { text }),
    
  getUsageMetrics: () =>
    api.get<ApiResponse<any>>('/ai/usage'),
}

// Admin AI API
export const adminAiApi = {
  getDashboard: () =>
    api.get<ApiResponse<any>>('/admin/ai/dashboard'),
    
  getMetrics: (params?: {
    timeframe?: string
    service?: string
  }) =>
    api.get<ApiResponse<any>>('/admin/ai/metrics', { params }),
    
  getAlerts: (params?: {
    resolved?: boolean
    severity?: string
    limit?: number
  }) =>
    api.get<ApiResponse<any>>('/admin/ai/alerts', { params }),
    
  resolveAlert: (alertId: string) =>
    api.put<ApiResponse<any>>(`/admin/ai/alerts/${alertId}/resolve`),
    
  getCacheAnalytics: () =>
    api.get<ApiResponse<any>>('/admin/ai/cache/analytics'),
    
  startCacheWarming: (data: {
    propertyIds?: string[]
    services: string[]
    priority?: string
  }) =>
    api.post<ApiResponse<any>>('/admin/ai/cache/warm', data),
    
  getCacheWarmingJob: (jobId: string) =>
    api.get<ApiResponse<any>>(`/admin/ai/cache/jobs/${jobId}`),
    
  startBulkScoreRecalculation: (data: {
    propertyIds?: string[]
    filters?: any
    forceRecalculation?: boolean
    batchSize?: number
  }) =>
    api.post<ApiResponse<any>>('/admin/ai/operations/bulk-score-recalculation', data),
    
  startBulkEmbeddingUpdate: (data: {
    propertyIds?: string[]
    filters?: any
    batchSize?: number
  }) =>
    api.post<ApiResponse<any>>('/admin/ai/operations/bulk-embedding-update', data),
    
  getCostAnalysis: (timeframe?: string) =>
    api.get<ApiResponse<any>>('/admin/ai/cost-analysis', { 
      params: { timeframe } 
    }),
    
  getServiceHealth: () =>
    api.get<ApiResponse<any>>('/admin/ai/service-health'),
    
  resetMetrics: () =>
    api.post<ApiResponse<any>>('/admin/ai/maintenance/reset-metrics'),
    
  getConfiguration: () =>
    api.get<ApiResponse<any>>('/admin/ai/configuration'),
}

// Users API
export const usersApi = {
  getUsers: (params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
  }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/users', { params }),
    
  getUser: (id: string) =>
    api.get<ApiResponse<any>>(`/users/${id}`),
    
  createUser: (data: any) =>
    api.post<ApiResponse<any>>('/users', data),
    
  updateUser: (id: string, data: Partial<any>) =>
    api.put<ApiResponse<any>>(`/users/${id}`, data),
    
  deleteUser: (id: string) =>
    api.delete<ApiResponse<null>>(`/users/${id}`),
    
  getUserActivity: (id: string) =>
    api.get<ApiResponse<any[]>>(`/users/${id}/activity`),
    
  getUserRecommendations: (id: string) =>
    api.get<ApiResponse<any[]>>(`/users/${id}/recommendations`),
}

// Documents API
export const documentsApi = {
  uploadDocument: (file: File, propertyId?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (propertyId) formData.append('propertyId', propertyId)
    
    return api.post<ApiResponse<any>>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  getDocument: (id: string) =>
    api.get<ApiResponse<any>>(`/documents/${id}`),
    
  downloadDocument: (id: string) =>
    api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    }),
    
  deleteDocument: (id: string) =>
    api.delete<ApiResponse<null>>(`/documents/${id}`),
    
  getDocuments: (params?: {
    propertyId?: string
    type?: string
    page?: number
    limit?: number
  }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/documents', { params }),
}

// Maintenance API
export const maintenanceApi = {
  getMaintenanceRecords: (propertyId: string) =>
    api.get<ApiResponse<any[]>>(`/maintenance/property/${propertyId}`),
    
  createMaintenanceRecord: (data: any) =>
    api.post<ApiResponse<any>>('/maintenance', data),
    
  updateMaintenanceRecord: (id: string, data: Partial<any>) =>
    api.put<ApiResponse<any>>(`/maintenance/${id}`, data),
    
  deleteMaintenanceRecord: (id: string) =>
    api.delete<ApiResponse<null>>(`/maintenance/${id}`),
    
  getMaintenanceSchedule: (propertyId: string) =>
    api.get<ApiResponse<any[]>>(`/maintenance/property/${propertyId}/schedule`),
}

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: {
    page?: number
    limit?: number
    unread?: boolean
  }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/notifications', { params }),
    
  markAsRead: (id: string) =>
    api.put<ApiResponse<any>>(`/notifications/${id}/read`),
    
  markAllAsRead: () =>
    api.put<ApiResponse<any>>('/notifications/read-all'),
    
  deleteNotification: (id: string) =>
    api.delete<ApiResponse<null>>(`/notifications/${id}`),
    
  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
}

// Health API
export const healthApi = {
  getHealth: () =>
    api.get<ApiResponse<any>>('/health'),
    
  getAIHealth: () =>
    api.get<ApiResponse<any>>('/health/ai'),
    
  getDetailedAIHealth: () =>
    api.get<ApiResponse<any>>('/health/ai/detailed'),
    
  getAIHealthMetrics: () =>
    api.get<ApiResponse<any>>('/health/ai/metrics'),
}

// Helper function to handle API errors
export function handleApiError(error: AxiosError): string {
  if (error.response?.data) {
    const errorData = error.response.data as ApiError
    return errorData.message || 'An error occurred'
  }
  
  if (error.request) {
    return 'Network error. Please check your connection.'
  }
  
  return error.message || 'An unexpected error occurred'
}

// Helper function to check if request was successful
export function isApiSuccess<T>(response: AxiosResponse<ApiResponse<T>>): boolean {
  return response.status >= 200 && response.status < 300 && response.data.success
}

// Export all APIs as a single object
export const apiClient = {
  auth: authApi,
  properties: propertiesApi,
  search: searchApi,
  ai: aiApi,
  adminAi: adminAiApi,
  users: usersApi,
  documents: documentsApi,
  maintenance: maintenanceApi,
  notifications: notificationsApi,
  health: healthApi,
}