import * as React from "react"
import { useUIStore } from "@/stores/ui.store"

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme } = useUIStore()

  React.useEffect(() => {
    // Apply theme on mount and when theme changes
    setTheme({})

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme.mode === 'system') {
        setTheme({})
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme.mode, setTheme])

  return <>{children}</>
}