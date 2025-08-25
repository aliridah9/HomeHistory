import * as React from "react"
import { Helmet } from "react-helmet-async"
import { 
  Home, 
  Search, 
  Star, 
  TrendingUp, 
  Bell, 
  Plus,
  Eye,
  Heart,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/stores/auth.store"

export default function DashboardPage() {
  const user = useUser()

  const stats = [
    {
      title: "Saved Properties",
      value: "12",
      icon: Heart,
      change: "+2 this week",
      changeType: "positive" as const,
    },
    {
      title: "Property Views",
      value: "47",
      icon: Eye,
      change: "+8 this week",
      changeType: "positive" as const,
    },
    {
      title: "Generated Reports",
      value: "5",
      icon: FileText,
      change: "+1 this week",
      changeType: "positive" as const,
    },
    {
      title: "Avg. Score",
      value: "78",
      icon: Star,
      change: "+3 points",
      changeType: "positive" as const,
    },
  ]

  return (
    <>
      <Helmet>
        <title>Dashboard - HomeHistory</title>
        <meta name="description" content="Your personal HomeHistory dashboard with saved properties, insights, and recommendations." />
      </Helmet>

      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-homehistory-600 to-homehistory-700 text-white rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-homehistory-100">
            Here's what's happening with your properties and searches
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-xs ${
                    stat.changeType === 'positive' 
                      ? 'text-success-600' 
                      : 'text-destructive'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className="w-12 h-12 bg-homehistory-100 dark:bg-homehistory-900 rounded-full flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-homehistory-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 bg-homehistory-100 dark:bg-homehistory-900 rounded-full flex items-center justify-center">
                    <Home className="h-5 w-5 text-homehistory-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Viewed property at 123 Main St
                    </p>
                    <p className="text-xs text-muted-foreground">
                      2 hours ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Searches */}
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Saved Searches</h2>
              <Button variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                New Search
              </Button>
            </div>
            
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        3BR houses in Austin
                      </p>
                      <p className="text-xs text-muted-foreground">
                        5 new matches
                      </p>
                    </div>
                  </div>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recommended for You</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="aspect-video bg-muted rounded-lg mb-3" />
                <h3 className="font-medium mb-1">123 Example St</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Austin, TX • $450,000
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-homehistory-600" />
                    <span className="text-sm font-medium">85</span>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}