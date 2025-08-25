import * as React from "react"
import { Helmet } from "react-helmet-async"
import { Moon, Sun, Monitor, Bell, Lock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore, useThemeMode } from "@/stores/ui.store"

export default function SettingsPage() {
  const { toggleThemeMode } = useUIStore()
  const themeMode = useThemeMode()

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light': return Sun
      case 'dark': return Moon
      default: return Monitor
    }
  }

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light': return 'Light'
      case 'dark': return 'Dark'
      default: return 'System'
    }
  }

  const ThemeIcon = getThemeIcon()

  return (
    <>
      <Helmet>
        <title>Settings - HomeHistory</title>
        <meta name="description" content="Manage your HomeHistory account settings and preferences." />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </p>
              </div>
              <Button variant="outline" onClick={toggleThemeMode}>
                <ThemeIcon className="mr-2 h-4 w-4" />
                {getThemeLabel()}
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Weekly Digest</h3>
                <p className="text-sm text-muted-foreground">
                  Get a weekly summary of your activity
                </p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Privacy & Security</h2>
          
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Bell className="mr-2 h-4 w-4" />
              Privacy Settings
            </Button>
            
            <div className="pt-4 border-t">
              <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
              <Button variant="destructive" className="w-full justify-start">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}