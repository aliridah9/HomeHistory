import * as React from "react"
import { Link } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorPage() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <>
      <Helmet>
        <title>Something went wrong - HomeHistory</title>
        <meta name="description" content="An unexpected error occurred." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              We're sorry, but something unexpected happened. Please try refreshing the page or go back to the homepage.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Link to="/">
                <Button variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}