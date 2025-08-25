import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { 
  BarChart3, 
  Building, 
  Users, 
  Bot, 
  TrendingUp, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebarOpen, useUIStore } from "@/stores/ui.store"
import { cn } from "@/lib/utils"

const adminNavigationItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    name: "Properties",
    href: "/admin/properties",
    icon: Building,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "AI System",
    href: "/admin/ai",
    icon: Bot,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: TrendingUp,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const sidebarOpen = useSidebarOpen()
  const { setSidebarOpen } = useUIStore()
  const location = useLocation()

  return (
    <aside className={cn(
      "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] bg-card border-r transition-all duration-300 hidden lg:block",
      sidebarOpen ? "w-64" : "w-16"
    )}>
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="flex justify-end p-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {adminNavigationItems.map((item) => {
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  !sidebarOpen && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="ml-3">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}