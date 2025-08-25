import * as React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "./Layout"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class GlobalErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to monitoring service (Sentry, etc.)
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo)
    
    // Report to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent 
            error={this.state.error!} 
            resetError={this.resetError} 
          />
        )
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Container maxWidth="md">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-danger" />
                </div>
              </div>

              {/* Error Content */}
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-text-primary">
                  Oops! Something went wrong
                </h1>
                <p className="text-lg text-text-secondary max-w-md mx-auto">
                  We're sorry, but something unexpected happened. Our team has been notified.
                </p>
              </div>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-muted/50 rounded-lg p-4 max-w-2xl mx-auto">
                  <summary className="cursor-pointer font-medium text-text-primary mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs bg-background rounded p-2 overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs bg-background rounded p-2 overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={this.resetError}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="flex items-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Go Home</span>
                </Button>
              </div>

              {/* Support Info */}
              <div className="pt-8 border-t">
                <p className="text-sm text-text-tertiary">
                  If this problem persists, please{" "}
                  <a 
                    href="/contact" 
                    className="text-primary hover:underline"
                  >
                    contact our support team
                  </a>
                  {" "}with the error details.
                </p>
              </div>
            </div>
          </Container>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: errorInfo ? {
          react: {
            componentStack: errorInfo.componentStack,
          },
        } : undefined,
      })
    }
  }, [])
}

// Simple error fallback component
export function SimpleErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error
  resetError: () => void 
}) {
  return (
    <div className="min-h-64 flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto" />
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Something went wrong
          </h3>
          <p className="text-text-secondary">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <Button onClick={resetError} size="sm">
          Try Again
        </Button>
      </div>
    </div>
  )
}

export default GlobalErrorBoundary