import * as React from "react"
import { Link } from "react-router-dom"
import { Shield, Bell, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/ui.store"
import { useUser } from "@/stores/auth.store"

export function AdminHeader() {
  const { setMobileMenuOpen, setNotificationsPanelOpen } = useUIStore()
  const user = useUser()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-wide flex h-16 items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link to="/admin" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-homehistory-600" />
            <span className="text-xl font-bold">
              Admin <span className="text-homehistory-600">Dashboard</span>
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsPanelOpen(true)}
          >
            <Bell className="h-5 w-5" />
          </Button>
          
          <Link to="/dashboard/profile">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Welcome back,</span>
            <span className="font-medium text-foreground">{user?.name}</span>
          </div>
        </div>
      </div>
    </header>
  )
}