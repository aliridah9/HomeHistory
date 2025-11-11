import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User, UserRole } from '@/types';
import { authApi, handleApiError } from '@/lib/api';
import { storage } from '@/lib/utils';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    userType: 'buyer' | 'agent' | 'investor';
    subscribeNewsletter?: boolean;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await authApi.login(credentials);

          if (response.data.success) {
            const { user, token } = response.data.data;

            set((state) => {
              state.user = user;
              state.token = token;
              state.isAuthenticated = true;
              state.isLoading = false;
            });

            // Store token for axios interceptor
            storage.set('auth_token', token);

            return true;
          } else {
            throw new Error(response.data.message || 'Login failed');
          }
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
          });
          return false;
        }
      },

      register: async (userData) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          // Transform the data to match API expectations
          const apiData = {
            email: userData.email,
            password: userData.password,
            name: `${userData.firstName} ${userData.lastName}`,
            phone: userData.phone,
          };

          const response = await authApi.register(apiData);

          if (response.data.success) {
            const { user, token } = response.data.data;

            set((state) => {
              state.user = user;
              state.token = token;
              state.isAuthenticated = true;
              state.isLoading = false;
            });

            storage.set('auth_token', token);

            return true;
          } else {
            throw new Error(response.data.message || 'Registration failed');
          }
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
          });
          return false;
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint
          await authApi.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API call failed:', error);
        } finally {
          // Clear state and storage
          set((state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
          });

          storage.remove('auth_token');
          storage.remove('user');
        }
      },

      refreshToken: async () => {
        try {
          const response = await authApi.refreshToken();

          if (response.data.success) {
            const { token } = response.data.data;

            set((state) => {
              state.token = token;
            });

            storage.set('auth_token', token);

            return true;
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error: any) {
          // Clear auth on refresh failure
          get().clearAuth();
          return false;
        }
      },

      forgotPassword: async (email) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await authApi.forgotPassword(email);

          set((state) => {
            state.isLoading = false;
          });

          return response.data.success;
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
          });
          return false;
        }
      },

      resetPassword: async (token, password) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await authApi.resetPassword(token, password);

          set((state) => {
            state.isLoading = false;
          });

          return response.data.success;
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
          });
          return false;
        }
      },

      updateProfile: async (data) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await authApi.updateProfile(data);

          if (response.data.success) {
            set((state) => {
              state.user = response.data.data;
              state.isLoading = false;
            });
            return true;
          } else {
            throw new Error(response.data.message || 'Profile update failed');
          }
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
          });
          return false;
        }
      },

      setUser: (user) => {
        set((state) => {
          state.user = user;
        });
      },

      setToken: (token) => {
        set((state) => {
          state.token = token;
        });
        storage.set('auth_token', token);
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      clearAuth: () => {
        set((state) => {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.error = null;
        });
        storage.remove('auth_token');
        storage.remove('user');
      },

      checkAuth: async () => {
        const token = storage.get('auth_token', null);

        if (!token) {
          get().clearAuth();
          return false;
        }

        try {
          set((state) => {
            state.isLoading = true;
          });

          const response = await authApi.getProfile();

          if (response.data.success) {
            set((state) => {
              state.user = response.data.data;
              state.token = token;
              state.isAuthenticated = true;
              state.isLoading = false;
            });
            return true;
          } else {
            throw new Error('Authentication check failed');
          }
        } catch (error: any) {
          get().clearAuth();
          set((state) => {
            state.isLoading = false;
          });
          return false;
        }
      },
    })),
    {
      name: 'homehistory-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Check auth status after rehydration
        if (state?.token) {
          state.checkAuth();
        }
      },
    }
  )
);

// Selectors
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () =>
  useAuthStore(
    (state) => state.user?.role === UserRole.ADMIN || state.user?.role === UserRole.SUPER_ADMIN
  );
export const useIsAgent = () =>
  useAuthStore(
    (state) =>
      state.user?.role === UserRole.AGENT ||
      state.user?.role === UserRole.ADMIN ||
      state.user?.role === UserRole.SUPER_ADMIN
  );
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
