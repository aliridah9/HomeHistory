import * as React from "react"
import { Outlet } from "react-router-dom"
import { AdminHeader } from "./admin-header"
import { AdminSidebar } from "./admin-sidebar"
import { useSidebarOpen } from "@/stores/ui.store"
import { cn } from "@/lib/utils"

export function AdminLayout() {
  const sidebarOpen = useSidebarOpen()

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="flex">
        <AdminSidebar />
        
        <main 
          className={cn(
            "flex-1 transition-all duration-300",
            sidebarOpen ? "lg:ml-64" : "lg:ml-16"
          )}
        >
          <div className="container-wide py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}