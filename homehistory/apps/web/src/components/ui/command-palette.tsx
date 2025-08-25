import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Command } from "cmdk"
import { Search, Home, Building, Users, Settings, Calculator } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useUIStore } from "@/stores/ui.store"
import { useIsAuthenticated, useIsAdmin } from "@/stores/auth.store"
import { cn } from "@/lib/utils"

const commands = [
  {
    id: "search",
    title: "Search Properties",
    description: "Find properties by location, type, or features",
    icon: Search,
    action: "/search",
    public: true,
  },
  {
    id: "properties",
    title: "Browse Properties",
    description: "View all available properties",
    icon: Building,
    action: "/properties",
    public: true,
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "View your personal dashboard",
    icon: Home,
    action: "/dashboard",
    public: false,
  },
  {
    id: "profile",
    title: "Profile Settings",
    description: "Manage your account settings",
    icon: Settings,
    action: "/dashboard/profile",
    public: false,
  },
  {
    id: "admin-dashboard",
    title: "Admin Dashboard",
    description: "Access administrative controls",
    icon: Users,
    action: "/admin",
    public: false,
    adminOnly: true,
  },
  {
    id: "admin-ai",
    title: "AI System Management",
    description: "Monitor and manage AI services",
    icon: Calculator,
    action: "/admin/ai",
    public: false,
    adminOnly: true,
  },
]

export function CommandPalette() {
  const navigate = useNavigate()
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const isAuthenticated = useIsAuthenticated()
  const isAdmin = useIsAdmin()
  const [search, setSearch] = React.useState("")

  // Filter commands based on authentication and admin status
  const filteredCommands = commands.filter(command => {
    if (command.public) return true
    if (!isAuthenticated) return false
    if (command.adminOnly && !isAdmin) return false
    return true
  })

  const handleSelect = (action: string) => {
    navigate(action)
    setCommandPaletteOpen(false)
    setSearch("")
  }

  // Close on escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  if (!commandPaletteOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Command className="rounded-lg border shadow-md bg-background">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                placeholder="Type a command or search..."
                value={search}
                onValueChange={setSearch}
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>
              
              <Command.Group heading="Navigation">
                {filteredCommands.map((command) => (
                  <Command.Item
                    key={command.id}
                    value={command.title}
                    onSelect={() => handleSelect(command.action)}
                    className={cn(
                      "relative flex cursor-default select-none items-center rounded-sm px-2 py-3 text-sm outline-none",
                      "data-[selected]:bg-accent data-[selected]:text-accent-foreground",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <command.icon className="mr-3 h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{command.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {command.description}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
            
            <div className="border-t px-3 py-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Press ESC to close</span>
                <div className="flex items-center space-x-1">
                  <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                  <span>to open</span>
                </div>
              </div>
            </div>
          </Command>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}