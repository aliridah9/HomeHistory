import React, { Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

// Layout Components
import { AppLayout } from '@/components/layout/app-layout'
import { AdminLayout } from '@/components/layout/admin-layout'
import { GlobalErrorBoundary } from '@/components/layout/GlobalErrorBoundary'
import { OfflineIndicator, NetworkProvider } from '@/components/layout/OfflineIndicator'

// Page Components (Lazy Loaded)
const HomePage = React.lazy(() => import('@/pages/home'))
const LandingPage = React.lazy(() => import('./pages/LandingPage'))
const SearchPage = React.lazy(() => import('@/pages/search'))
const PropertyDetailPage = React.lazy(() => import('@/pages/property/[id]'))
const PropertyListPage = React.lazy(() => import('@/pages/properties'))
const DashboardPage = React.lazy(() => import('@/pages/dashboard'))
const ProfilePage = React.lazy(() => import('@/pages/profile'))
const SettingsPage = React.lazy(() => import('@/pages/settings'))

// Auth Pages
const LoginPage = React.lazy(() => import('@/pages/auth/login'))
const RegisterPage = React.lazy(() => import('@/pages/auth/register'))
const EmailEntryPage = React.lazy(() => import('@/pages/auth/EmailEntry'))
const ProfessionalSignupPage = React.lazy(() => import('@/pages/auth/ProfessionalSignup'))
const SSOCompletePage = React.lazy(() => import('@/pages/auth/SSOComplete'))
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/forgot-password'))
const ResetPasswordPage = React.lazy(() => import('@/pages/auth/reset-password'))

// Admin Pages
const AdminDashboardPage = React.lazy(() => import('@/pages/admin/dashboard'))
const AdminPropertiesPage = React.lazy(() => import('@/pages/admin/properties'))
const AdminUsersPage = React.lazy(() => import('@/pages/admin/users'))
const AdminAIPage = React.lazy(() => import('@/pages/admin/ai'))
const AdminAnalyticsPage = React.lazy(() => import('@/pages/admin/analytics'))
const AdminSettingsPage = React.lazy(() => import('@/pages/admin/settings'))

// Compare Page
const ComparePage = React.lazy(() => import('@/pages/compare'))

// Landing Navigation Pages
const BuyPage = React.lazy(() => import('./pages/buy'))
const RentPage = React.lazy(() => import('./pages/rent'))
const SellPage = React.lazy(() => import('./pages/sell'))
const AuctionPage = React.lazy(() => import('./pages/auction'))

// Error Pages
const NotFoundPage = React.lazy(() => import('@/pages/404'))
const ErrorPage = React.lazy(() => import('@/pages/error'))

// Components
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AdminRoute } from '@/components/auth/admin-route'
import { CommandPalette } from '@/components/ui/command-palette'
import { NotificationPanel } from '@/components/layout/notification-panel'
import { Toaster } from '@/components/ui/toaster'

// Hooks
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
)

// App component
function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()
  const { commandPaletteOpen, notificationsPanelOpen } = useUIStore()

  // Check authentication on app load
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <GlobalErrorBoundary>
      <NetworkProvider>
        <Helmet>
          <title>HomeHistory - Real Estate Intelligence Platform</title>
          <meta 
            name="description" 
            content="Discover property insights with AI-powered scoring, comprehensive history reports, and intelligent recommendations. The Carfax for homes." 
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#007AFF" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="HomeHistory - Real Estate Intelligence Platform" />
        <meta property="og:description" content="Discover property insights with AI-powered scoring, comprehensive history reports, and intelligent recommendations." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://homehistory.com" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="HomeHistory - Real Estate Intelligence Platform" />
        <meta name="twitter:description" content="Discover property insights with AI-powered scoring, comprehensive history reports, and intelligent recommendations." />
        <meta name="twitter:image" content="/twitter-image.jpg" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.mapbox.com" />
      </Helmet>

      <OfflineIndicator />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/buy" element={<BuyPage />} />
          <Route path="/rent" element={<RentPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/auction" element={<AuctionPage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="properties" element={<PropertyListPage />} />
            <Route path="properties/:id" element={<PropertyDetailPage />} />
            <Route path="property/:id" element={<PropertyDetailPage />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/auth" element={<EmailEntryPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/signup/professional" element={<ProfessionalSignupPage />} />
          <Route path="/auth/sso-complete" element={<SSOCompletePage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="properties" element={<AdminPropertiesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="ai" element={<AdminAIPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/register" element={<Navigate to="/auth/register" replace />} />
          
          {/* Error Routes */}
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Global UI Components */}
      <Toaster />
      {commandPaletteOpen && <CommandPalette />}
      {notificationsPanelOpen && <NotificationPanel />}
      </NetworkProvider>
    </GlobalErrorBoundary>
  )
}

export default App