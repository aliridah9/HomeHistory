import * as React from "react"
import { WifiOff, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

interface OfflineIndicatorProps {
  className?: string
  showOnlineStatus?: boolean
}

export function OfflineIndicator({ 
  className,
  showOnlineStatus = false 
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)
  const [wasOffline, setWasOffline] = React.useState(false)
  const [showReconnected, setShowReconnected] = React.useState(false)

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        setShowReconnected(true)
        setWasOffline(false)
        // Hide reconnected message after 3 seconds
        setTimeout(() => setShowReconnected(false), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  // Don't show anything if online and not configured to show online status
  if (isOnline && !showOnlineStatus && !showReconnected) {
    return null
  }

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-danger text-danger-foreground",
          "border-b shadow-sm",
          className
        )}>
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <WifiOff className="w-4 h-4" />
              <span className="font-medium">No internet connection</span>
              <span className="hidden sm:inline text-danger-foreground/80">
                - Some features may not work properly
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reconnected Banner */}
      {showReconnected && (
        <div className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-success text-success-foreground",
          "border-b shadow-sm animate-slide-in-from-top",
          className
        )}>
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Wifi className="w-4 h-4" />
              <span className="font-medium">Connection restored</span>
              <span className="hidden sm:inline text-success-foreground/80">
                - You're back online
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Online Status (if enabled) */}
      {isOnline && showOnlineStatus && !showReconnected && (
        <div className={cn(
          "fixed top-16 right-4 z-40 bg-success/10 text-success border border-success/20",
          "rounded-md px-3 py-1 shadow-sm",
          className
        )}>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      )}
    </>
  )
}

// Hook to get online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Network status context for app-wide usage
interface NetworkContextType {
  isOnline: boolean
  isSlowConnection: boolean
}

const NetworkContext = React.createContext<NetworkContextType>({
  isOnline: true,
  isSlowConnection: false,
})

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)
  const [isSlowConnection, setIsSlowConnection] = React.useState(false)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Detect slow connection
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    if (connection) {
      const updateConnectionStatus = () => {
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' ||
          (connection.downlink && connection.downlink < 1.5)
        )
      }

      updateConnectionStatus()
      connection.addEventListener('change', updateConnectionStatus)

      return () => {
        connection.removeEventListener('change', updateConnectionStatus)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const value = React.useMemo(() => ({
    isOnline,
    isSlowConnection,
  }), [isOnline, isSlowConnection])

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetworkStatus() {
  const context = React.useContext(NetworkContext)
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkProvider')
  }
  return context
}

export default OfflineIndicator