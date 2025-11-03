/**
 * API Client Configuration
 * Centralized API methods for the frontend
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== Properties API =====
export const propertiesApi = {
  getProperty: (id: string) => 
    apiClient.get(`/api/properties/${id}`),
  
  searchProperties: (params: any) => 
    apiClient.get('/api/properties/search', { params }),
  
  getPropertyScore: (id: string) => 
    apiClient.get(`/api/ai/scoring/${id}`),
  
  getSimilarProperties: (id: string, limit: number = 5) => 
    apiClient.get(`/api/ai/recommendations/${id}/similar`, { params: { limit } }),
  
  getPropertyHistory: (id: string) => 
    apiClient.get(`/api/properties/${id}/history`),
};

// ===== AI Search API =====
export const searchApi = {
  naturalLanguageSearch: (query: string, filters?: any) =>
    apiClient.post('/api/ai/search/natural', { query, filters }),
  
  semanticSearch: (query: string, limit?: number) =>
    apiClient.post('/api/ai/search/semantic', { query, limit }),
  
  getSavedSearches: () =>
    apiClient.get('/api/saved-searches'),
  
  createSavedSearch: (data: { name: string; query: string; filters?: any; alertsEnabled?: boolean }) =>
    apiClient.post('/api/saved-searches', data),
  
  updateSavedSearch: (id: string, data: any) =>
    apiClient.put(`/api/saved-searches/${id}`, data),
  
  deleteSavedSearch: (id: string) =>
    apiClient.delete(`/api/saved-searches/${id}`),
  
  toggleSearchAlerts: (id: string, enabled: boolean) =>
    apiClient.put(`/api/saved-searches/${id}/alerts`, { enabled }),
};

// ===== Favorites API =====
export const favoritesApi = {
  getFavorites: (tags?: string) =>
    apiClient.get('/api/favorites', { params: tags ? { tags } : {} }),
  
  getFavorite: (id: string) =>
    apiClient.get(`/api/favorites/${id}`),
  
  addFavorite: (data: { propertyId: string; notes?: string; tags?: string[] }) =>
    apiClient.post('/api/favorites', data),
  
  updateFavorite: (id: string, data: { notes?: string; tags?: string[] }) =>
    apiClient.put(`/api/favorites/${id}`, data),
  
  removeFavorite: (id: string) =>
    apiClient.delete(`/api/favorites/${id}`),
  
  checkFavorite: (propertyId: string) =>
    apiClient.get(`/api/favorites/check/${propertyId}`),
  
  getFavoriteTags: () =>
    apiClient.get('/api/favorites/tags/list'),
  
  exportFavorites: () =>
    apiClient.get('/api/favorites/export/csv'),
};

// ===== User Preferences API =====
export const userPreferencesApi = {
  getAIPreferences: () =>
    apiClient.get('/api/user/preferences/ai'),
  
  updateAIPreferences: (preferences: any) =>
    apiClient.put('/api/user/preferences/ai', preferences),
  
  resetAIPreferences: () =>
    apiClient.put('/api/user/preferences/ai/reset'),
  
  getNotificationPreferences: () =>
    apiClient.get('/api/user/preferences/notifications'),
  
  updateNotificationPreferences: (notifications: any) =>
    apiClient.put('/api/user/preferences/notifications', notifications),
  
  getSearchHistory: () =>
    apiClient.get('/api/user/preferences/search-history'),
  
  clearSearchHistory: () =>
    apiClient.put('/api/user/preferences/search-history/clear'),
};

// ===== Analytics API =====
export const analyticsApi = {
  trackSearch: (data: {
    query: string;
    searchType: string;
    filters?: any;
    extractedCriteria?: any;
    resultsCount: number;
    responseTimeMs: number;
    clickedPropertyIds?: string[];
    favoritedPropertyIds?: string[];
    conversion?: boolean;
  }) =>
    apiClient.post('/api/ai/analytics/search', data),
  
  trackPropertyView: (data: {
    propertyId: string;
    referrer?: string;
    referrerQuery?: string;
    timeSpentSeconds?: number;
    actionsTaken?: string[];
    scoreAtView?: number;
    leftVia?: string;
  }) =>
    apiClient.post('/api/ai/analytics/property-view', data),
  
  submitRecommendationFeedback: (data: {
    sourcePropertyId: string;
    recommendedPropertyId: string;
    rating: number;
    helpful: boolean;
    comments?: string;
    issues?: string[];
    similarityScore?: number;
  }) =>
    apiClient.post('/api/ai/analytics/recommendation-feedback', data),
  
  getPersonalAnalytics: () =>
    apiClient.get('/api/ai/analytics/personal'),
};

// ===== Admin AI API =====
export const adminAiApi = {
  getDashboard: () =>
    apiClient.get('/api/ai/admin/dashboard'),
  
  getMetrics: (startDate?: string, endDate?: string) =>
    apiClient.get('/api/ai/admin/metrics', { 
      params: { startDate, endDate } 
    }),
  
  getUsageSummary: (startDate?: string, endDate?: string, serviceType?: string) =>
    apiClient.get('/api/ai/analytics/usage-summary', {
      params: { startDate, endDate, serviceType }
    }),
  
  getTopSearches: (limit?: number, days?: number) =>
    apiClient.get('/api/ai/analytics/top-searches', {
      params: { limit, days }
    }),
  
  getRecommendationAccuracy: () =>
    apiClient.get('/api/ai/analytics/recommendation-accuracy'),
  
  getConversionFunnel: (days?: number) =>
    apiClient.get('/api/ai/analytics/conversion-funnel', {
      params: { days }
    }),
  
  generateEmbeddings: (propertyIds: string[]) =>
    apiClient.post('/api/ai/admin/generate-embeddings', { propertyIds }),
  
  invalidateCache: (tags?: string[]) =>
    apiClient.post('/api/ai/admin/cache/invalidate', { tags }),
  
  rebuildIndex: () =>
    apiClient.post('/api/ai/admin/rebuild-index'),
};

// ===== Recommendations API =====
export const recommendationsApi = {
  getRecommendations: (userId?: string, limit?: number) =>
    apiClient.get('/api/ai/recommendations', { 
      params: { userId, limit } 
    }),
  
  getPropertyRecommendations: (propertyId: string, limit?: number) =>
    apiClient.get(`/api/ai/recommendations/${propertyId}`, { 
      params: { limit } 
    }),
  
  getSimilarProperties: (propertyId: string, limit?: number) =>
    apiClient.get(`/api/ai/recommendations/${propertyId}/similar`, { 
      params: { limit } 
    }),
};

// ===== Auth API =====
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/api/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post('/api/auth/register', data),
  
  logout: () =>
    apiClient.post('/api/auth/logout'),
  
  getCurrentUser: () =>
    apiClient.get('/api/auth/me'),
  
  refreshToken: () =>
    apiClient.post('/api/auth/refresh'),
};

export default apiClient;

