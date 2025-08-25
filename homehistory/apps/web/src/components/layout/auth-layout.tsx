import * as React from "react"
import { Outlet, Link } from "react-router-dom"
import { Home, ArrowLeft } from "lucide-react"

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-homehistory-50 to-homehistory-100 dark:from-gray-900 dark:to-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-homehistory-600 hover:text-homehistory-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          
          <Link 
            to="/" 
            className="flex items-center space-x-2"
          >
            <Home className="h-8 w-8 text-homehistory-600" />
            <span className="text-2xl font-bold text-foreground">
              Home<span className="text-homehistory-600">History</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-soft border p-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2024 HomeHistory. All rights reserved.
        </p>
      </footer>
    </div>
  )
}