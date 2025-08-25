import * as React from "react"
import { Navigate, useLocation, Outlet } from "react-router-dom"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuthStore, useIsAuthenticated } from "@/stores/auth.store"

interface ProtectedRouteProps {
  children?: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

export function ProtectedRoute({ 
  children, 
  redirectTo = "/auth/login",
  requireAuth = true
}: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated()
  const { isLoading, checkAuth } = useAuthStore()
  const location = useLocation()

  // Check authentication on mount
  React.useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-text-secondary">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(location.pathname + location.search)}`
    return <Navigate to={redirectUrl} replace />
  }

  // If authentication is not required but user is authenticated, allow access
  // If authentication is required and user is authenticated, allow access
  return children ? <>{children}</> : <Outlet />
}