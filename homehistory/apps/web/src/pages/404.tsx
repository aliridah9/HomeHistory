import * as React from "react"
import { Link } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { Home, ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Page Not Found - HomeHistory</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl font-bold text-homehistory-600 mb-4">404</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Page Not Found
            </h1>
            <p className="text-muted-foreground">
              Sorry, we couldn't find the page you're looking for.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button className="w-full sm:w-auto">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
              
              <Link to="/search">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  Search Properties
                </Button>
              </Link>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}