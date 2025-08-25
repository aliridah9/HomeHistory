import * as React from "react"
import { useAuthStore } from "@/stores/auth.store"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isLoading } = useAuthStore()
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        await checkAuth()
      } catch (error) {
        console.error('Auth initialization failed:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [checkAuth])

  // Show loading spinner while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="xl" text="Initializing..." />
      </div>
    )
  }

  return <>{children}</>
}