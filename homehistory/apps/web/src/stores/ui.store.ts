import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { UITheme, ModalState, ToastState } from '@/types'
import { storage } from '@/lib/utils'

interface UIState {
  // Theme
  theme: UITheme
  
  // Layout
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  
  // Modals
  modals: Record<string, ModalState>
  
  // Toasts
  toasts: ToastState[]
  
  // Loading states
  globalLoading: boolean
  loadingStates: Record<string, boolean>
  
  // Notifications
  notificationsPanelOpen: boolean
  unreadNotifications: number
  
  // Search
  searchPanelOpen: boolean
  commandPaletteOpen: boolean
  
  // Map
  mapView: 'list' | 'map' | 'split'
  mapCenter: [number, number]
  mapZoom: number
  
  // Preferences
  listViewType: 'grid' | 'list'
  itemsPerPage: number
  autoRefresh: boolean
  
  // Actions
  setTheme: (theme: Partial<UITheme>) => void
  toggleThemeMode: () => void
  setSidebarOpen: (open: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  openModal: (id: string, data?: any) => void
  closeModal: (id: string) => void
  closeAllModals: () => void
  addToast: (toast: Omit<ToastState, 'id'>) => string
  removeToast: (id: string) => void
  clearAllToasts: () => void
  setGlobalLoading: (loading: boolean) => void
  setLoading: (key: string, loading: boolean) => void
  setNotificationsPanelOpen: (open: boolean) => void
  setUnreadNotifications: (count: number) => void
  setSearchPanelOpen: (open: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setMapView: (view: 'list' | 'map' | 'split') => void
  setMapCenter: (center: [number, number]) => void
  setMapZoom: (zoom: number) => void
  setListViewType: (type: 'grid' | 'list') => void
  setItemsPerPage: (count: number) => void
  setAutoRefresh: (enabled: boolean) => void
  resetUI: () => void
  
  // Convenience method for notifications
  addNotification: (notification: {
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
    duration?: number
  }) => void
}

const defaultTheme: UITheme = {
  mode: 'system',
  primaryColor: 'hsl(200, 80%, 56%)',
  accentColor: 'hsl(200, 80%, 56%)',
  borderRadius: '0.5rem',
  fontSize: 'md',
}

const defaultMapCenter: [number, number] = [-97.7431, 30.2672] // Austin, TX

export const useUIStore = create<UIState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      theme: defaultTheme,
      sidebarOpen: true,
      mobileMenuOpen: false,
      modals: {},
      toasts: [],
      globalLoading: false,
      loadingStates: {},
      notificationsPanelOpen: false,
      unreadNotifications: 0,
      searchPanelOpen: false,
      commandPaletteOpen: false,
      mapView: 'list',
      mapCenter: defaultMapCenter,
      mapZoom: 10,
      listViewType: 'grid',
      itemsPerPage: 20,
      autoRefresh: false,

      // Actions
      setTheme: (themeUpdate) => {
        set((state) => {
          state.theme = { ...state.theme, ...themeUpdate }
        })
        
        // Apply theme to document
        const { theme } = get()
        document.documentElement.style.setProperty('--primary', theme.primaryColor)
        document.documentElement.style.setProperty('--accent', theme.accentColor)
        document.documentElement.style.setProperty('--radius', theme.borderRadius)
        
        // Handle theme mode
        if (theme.mode === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (theme.mode === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },

      toggleThemeMode: () => {
        set((state) => {
          const currentMode = state.theme.mode
          if (currentMode === 'light') {
            state.theme.mode = 'dark'
          } else if (currentMode === 'dark') {
            state.theme.mode = 'system'
          } else {
            state.theme.mode = 'light'
          }
        })
        
        // Re-apply theme
        get().setTheme({})
      },

      setSidebarOpen: (open) => {
        set((state) => {
          state.sidebarOpen = open
        })
      },

      setMobileMenuOpen: (open) => {
        set((state) => {
          state.mobileMenuOpen = open
        })
      },

      openModal: (id, data) => {
        set((state) => {
          state.modals[id] = {
            isOpen: true,
            data: data || null,
          }
        })
      },

      closeModal: (id) => {
        set((state) => {
          if (state.modals[id]) {
            state.modals[id].isOpen = false
          }
        })
      },

      closeAllModals: () => {
        set((state) => {
          Object.keys(state.modals).forEach((id) => {
            state.modals[id].isOpen = false
          })
        })
      },

      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        set((state) => {
          state.toasts.push({
            id,
            ...toast,
          })
        })

        // Auto-remove toast after duration
        const duration = toast.duration || 5000
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, duration)
        }

        return id
      },

      removeToast: (id) => {
        set((state) => {
          state.toasts = state.toasts.filter((toast) => toast.id !== id)
        })
      },

      clearAllToasts: () => {
        set((state) => {
          state.toasts = []
        })
      },

      setGlobalLoading: (loading) => {
        set((state) => {
          state.globalLoading = loading
        })
      },

      setLoading: (key, loading) => {
        set((state) => {
          if (loading) {
            state.loadingStates[key] = true
          } else {
            delete state.loadingStates[key]
          }
        })
      },

      setNotificationsPanelOpen: (open) => {
        set((state) => {
          state.notificationsPanelOpen = open
        })
      },

      setUnreadNotifications: (count) => {
        set((state) => {
          state.unreadNotifications = count
        })
      },

      setSearchPanelOpen: (open) => {
        set((state) => {
          state.searchPanelOpen = open
        })
      },

      setCommandPaletteOpen: (open) => {
        set((state) => {
          state.commandPaletteOpen = open
        })
      },

      setMapView: (view) => {
        set((state) => {
          state.mapView = view
        })
      },

      setMapCenter: (center) => {
        set((state) => {
          state.mapCenter = center
        })
      },

      setMapZoom: (zoom) => {
        set((state) => {
          state.mapZoom = zoom
        })
      },

      setListViewType: (type) => {
        set((state) => {
          state.listViewType = type
        })
      },

      setItemsPerPage: (count) => {
        set((state) => {
          state.itemsPerPage = count
        })
      },

      setAutoRefresh: (enabled) => {
        set((state) => {
          state.autoRefresh = enabled
        })
      },

      resetUI: () => {
        set((state) => {
          state.sidebarOpen = true
          state.mobileMenuOpen = false
          state.modals = {}
          state.toasts = []
          state.globalLoading = false
          state.loadingStates = {}
          state.notificationsPanelOpen = false
          state.searchPanelOpen = false
          state.commandPaletteOpen = false
          state.mapView = 'list'
          state.mapCenter = defaultMapCenter
          state.mapZoom = 10
        })
      },

      // Convenience method for notifications
      addNotification: (notification) => {
        get().addToast({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          duration: notification.duration || 5000
        })
      },
    })),
    {
      name: 'homehistory-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        mapView: state.mapView,
        listViewType: state.listViewType,
        itemsPerPage: state.itemsPerPage,
        autoRefresh: state.autoRefresh,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state?.setTheme) {
          state.setTheme({})
        }
      },
    }
  )
)

// Selectors
export const useTheme = () => useUIStore((state) => state.theme)
export const useThemeMode = () => useUIStore((state) => state.theme.mode)
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen)
export const useMobileMenuOpen = () => useUIStore((state) => state.mobileMenuOpen)
export const useModal = (id: string) => useUIStore((state) => state.modals[id])
export const useToasts = () => useUIStore((state) => state.toasts)
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading)
export const useLoading = (key: string) => useUIStore((state) => state.loadingStates[key] || false)
export const useNotificationsPanelOpen = () => useUIStore((state) => state.notificationsPanelOpen)
export const useUnreadNotifications = () => useUIStore((state) => state.unreadNotifications)
export const useSearchPanelOpen = () => useUIStore((state) => state.searchPanelOpen)
export const useCommandPaletteOpen = () => useUIStore((state) => state.commandPaletteOpen)
export const useMapView = () => useUIStore((state) => state.mapView)
export const useMapCenter = () => useUIStore((state) => state.mapCenter)
export const useMapZoom = () => useUIStore((state) => state.mapZoom)
export const useListViewType = () => useUIStore((state) => state.listViewType)
export const useItemsPerPage = () => useUIStore((state) => state.itemsPerPage)
export const useAutoRefresh = () => useUIStore((state) => state.autoRefresh)

// Theme utilities
export const useIsDarkMode = () => {
  const theme = useTheme()
  
  if (theme.mode === 'dark') return true
  if (theme.mode === 'light') return false
  
  // System theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Toast utilities
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast)
  const removeToast = useUIStore((state) => state.removeToast)

  const toast = {
    success: (title: string, message: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    
    error: (title: string, message: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration }),
    
    warning: (title: string, message: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration }),
    
    info: (title: string, message: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),
    
    custom: (toast: Omit<ToastState, 'id'>) => addToast(toast),
    
    dismiss: (id: string) => removeToast(id),
  }

  return toast
}

// Modal utilities
export const useModalState = (id: string) => {
  const modal = useModal(id)
  const openModal = useUIStore((state) => state.openModal)
  const closeModal = useUIStore((state) => state.closeModal)

  return {
    isOpen: modal?.isOpen || false,
    data: modal?.data || null,
    open: (data?: any) => openModal(id, data),
    close: () => closeModal(id),
  }
}