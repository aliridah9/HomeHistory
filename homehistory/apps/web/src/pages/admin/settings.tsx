import * as React from "react"
import { Helmet } from "react-helmet-async"
import { Settings } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <>
      <Helmet>
        <title>Settings - Admin - HomeHistory</title>
        <meta name="description" content="Manage system-wide settings and configuration for HomeHistory." />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Manage system-wide settings and configuration
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">System Settings</h3>
            <p className="text-muted-foreground">
              System settings and configuration interface will be implemented here
            </p>
          </div>
        </div>
      </div>
    </>
  )
}