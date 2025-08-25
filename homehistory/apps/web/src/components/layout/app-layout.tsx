import * as React from "react"
import { Outlet } from "react-router-dom"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Footer } from "./footer"
import { useSidebarOpen } from "@/stores/ui.store"
import { cn } from "@/lib/utils"

export function AppLayout() {
  const sidebarOpen = useSidebarOpen()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
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
      
      <Footer />
    </div>
  )
}