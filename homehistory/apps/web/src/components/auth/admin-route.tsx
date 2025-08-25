import * as React from "react"
import { Navigate, useLocation, Outlet } from "react-router-dom"
import { AlertTriangle } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { useIsAuthenticated, useIsAdmin, useAuthStore } from "@/stores/auth.store"
import { Container } from "@/components/layout/Layout"

interface AdminRouteProps {
  children?: React.ReactNode
  redirectTo?: string
}

export function AdminRoute({ 
  children, 
  redirectTo = "/auth/login" 
}: AdminRouteProps) {
  const isAuthenticated = useIsAuthenticated()
  const isAdmin = useIsAdmin()
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
          <p className="text-text-secondary">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return (
      <Navigate 
        to={`${redirectTo}?redirect=${encodeURIComponent(location.pathname)}`}
        replace 
      />
    )
  }

  if (!isAdmin) {
    // Show access denied page
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Container maxWidth="md">
          <div className="text-center space-y-6">
            {/* Access Denied Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-danger" />
              </div>
            </div>

            {/* Error Content */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-text-primary">
                Access Denied
              </h1>
              <p className="text-lg text-text-secondary max-w-md mx-auto">
                You don't have permission to access the admin dashboard. Please contact an administrator if you believe this is an error.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="rounded-full font-semibold"
              >
                Go Back
              </Button>
              
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-primary hover:bg-primary/90 text-white rounded-full font-semibold"
              >
                Go to Dashboard
              </Button>
            </div>

            {/* Additional Info */}
            <div className="pt-8 border-t">
              <p className="text-sm text-text-tertiary">
                If you need admin access, please contact your system administrator.
              </p>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return children ? <>{children}</> : <Outlet />
}