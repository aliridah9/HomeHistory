import * as React from "react"
import { Helmet } from "react-helmet-async"
import { 
  Home, Users, Brain, DollarSign, TrendingUp, TrendingDown, 
  Activity, AlertTriangle, CheckCircle, Clock, Sparkles,
  BarChart3, PieChart, LineChart, Database
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Container } from "@/components/layout/Layout"
import { cn } from "@/lib/utils"

interface KPICard {
  title: string
  value: string | number
  change: number
  changeLabel: string
  icon: React.ElementType
  color: string
  trend: 'up' | 'down' | 'neutral'
}

interface ActivityItem {
  id: string
  type: 'property' | 'user' | 'ai' | 'system'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

interface SystemHealth {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  uptime: number
  lastCheck: string
}

const KPI_DATA: KPICard[] = [
  {
    title: "Total Properties",
    value: "2,347",
    change: 12.5,
    changeLabel: "vs last month",
    icon: Home,
    color: "text-blue-600",
    trend: "up"
  },
  {
    title: "Active Users",
    value: "25,432",
    change: 8.2,
    changeLabel: "vs last month",
    icon: Users,
    color: "text-green-600",
    trend: "up"
  },
  {
    title: "AI Requests",
    value: "847K",
    change: 15.7,
    changeLabel: "vs last month",
    icon: Brain,
    color: "text-purple-600",
    trend: "up"
  },
  {
    title: "Revenue",
    value: "$127K",
    change: -2.1,
    changeLabel: "vs last month",
    icon: DollarSign,
    color: "text-yellow-600",
    trend: "down"
  }
]

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    type: 'property',
    title: 'New Property Added',
    description: '1234 Oak Street, Austin TX - Score: 92/100',
    timestamp: '2 minutes ago',
    status: 'success'
  },
  {
    id: '2',
    type: 'user',
    title: 'New User Registration',
    description: 'sarah.johnson@email.com joined as Agent',
    timestamp: '5 minutes ago',
    status: 'info'
  },
  {
    id: '3',
    type: 'ai',
    title: 'AI Score Recalculation',
    description: 'Bulk recalculation completed for 245 properties',
    timestamp: '12 minutes ago',
    status: 'success'
  },
  {
    id: '4',
    type: 'system',
    title: 'High API Usage',
    description: 'OpenAI API usage at 85% of monthly limit',
    timestamp: '18 minutes ago',
    status: 'warning'
  },
  {
    id: '5',
    type: 'property',
    title: 'Property Update',
    description: 'Price reduced: 567 Main Ave - $325K → $310K',
    timestamp: '23 minutes ago',
    status: 'info'
  }
]

const SYSTEM_HEALTH: SystemHealth[] = [
  {
    service: 'API Server',
    status: 'healthy',
    responseTime: 120,
    uptime: 99.9,
    lastCheck: '30s ago'
  },
  {
    service: 'Database',
    status: 'healthy',
    responseTime: 45,
    uptime: 99.8,
    lastCheck: '1m ago'
  },
  {
    service: 'OpenAI Service',
    status: 'degraded',
    responseTime: 2500,
    uptime: 98.2,
    lastCheck: '2m ago'
  },
  {
    service: 'Search Engine',
    status: 'healthy',
    responseTime: 180,
    uptime: 99.5,
    lastCheck: '45s ago'
  }
]

interface KPICardComponentProps {
  kpi: KPICard
}

function KPICardComponent({ kpi }: KPICardComponentProps) {
  const Icon = kpi.icon
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Activity

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", 
          kpi.color === 'text-blue-600' ? 'bg-blue-100' :
          kpi.color === 'text-green-600' ? 'bg-green-100' :
          kpi.color === 'text-purple-600' ? 'bg-purple-100' : 'bg-yellow-100'
        )}>
          <Icon className={cn("w-6 h-6", kpi.color)} />
        </div>
        <Badge variant={kpi.trend === 'up' ? 'default' : kpi.trend === 'down' ? 'destructive' : 'secondary'}>
          <TrendIcon className="w-3 h-3 mr-1" />
          {kpi.change > 0 ? '+' : ''}{kpi.change}%
        </Badge>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-text-primary">{kpi.value}</h3>
        <p className="text-sm text-text-secondary">{kpi.title}</p>
        <p className="text-xs text-text-tertiary">{kpi.changeLabel}</p>
      </div>
    </div>
  )
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'property': return Home
      case 'user': return Users
      case 'ai': return Brain
      case 'system': return Activity
      default: return Activity
    }
  }

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'info': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-text-primary">Recent Activity</h2>
      </div>
      
      <div className="divide-y divide-gray-100">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type)
          return (
            <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-start space-x-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", getStatusColor(activity.status))}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary">{activity.title}</h3>
                  <p className="text-sm text-text-secondary mt-1">{activity.description}</p>
                  <p className="text-xs text-text-tertiary mt-2">{activity.timestamp}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="p-6 border-t border-gray-200">
        <Button variant="outline" className="w-full rounded-full">
          View All Activity
        </Button>
      </div>
    </div>
  )
}

interface SystemHealthProps {
  services: SystemHealth[]
}

function SystemHealthComponent({ services }: SystemHealthProps) {
  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'down': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return CheckCircle
      case 'degraded': return AlertTriangle
      case 'down': return AlertTriangle
      default: return Clock
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-text-primary">System Health</h2>
      </div>
      
      <div className="divide-y divide-gray-100">
        {services.map((service, index) => {
          const StatusIcon = getStatusIcon(service.status)
          return (
            <div key={index} className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getStatusColor(service.status))}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-text-primary">{service.service}</h3>
                </div>
                <Badge 
                  variant={service.status === 'healthy' ? 'default' : service.status === 'degraded' ? 'secondary' : 'destructive'}
                  className="capitalize"
                >
                  {service.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-text-tertiary">Response Time</p>
                  <p className="font-medium text-text-primary">{service.responseTime}ms</p>
                </div>
                <div>
                  <p className="text-text-tertiary">Uptime</p>
                  <p className="font-medium text-text-primary">{service.uptime}%</p>
                </div>
                <div>
                  <p className="text-text-tertiary">Last Check</p>
                  <p className="font-medium text-text-primary">{service.lastCheck}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-text-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | HomeHistory</title>
        <meta name="description" content="HomeHistory admin dashboard with KPIs, analytics, and system monitoring" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Container className="py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
              <p className="text-text-secondary mt-1">
                Monitor platform performance and manage HomeHistory operations
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <Button variant="outline" className="rounded-full">
                <Database className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {KPI_DATA.map((kpi, index) => (
              <KPICardComponent key={index} kpi={kpi} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Property Views Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Property Views</h2>
                <LineChart className="w-5 h-5 text-primary" />
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-text-secondary">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Chart visualization would go here</p>
                  <p className="text-xs">Using Recharts library</p>
                </div>
              </div>
            </div>

            {/* Search Trends Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Search Trends</h2>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-text-secondary">
                  <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Search analytics chart</p>
                  <p className="text-xs">Real-time search data</p>
                </div>
              </div>
            </div>

            {/* AI Usage Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">AI Usage</h2>
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-text-secondary">
                  <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>AI service usage breakdown</p>
                  <p className="text-xs">OpenAI API metrics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <ActivityFeed activities={RECENT_ACTIVITY} />

            {/* System Health */}
            <SystemHealthComponent services={SYSTEM_HEALTH} />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Home className="w-6 h-6 text-primary" />
                <span>Add Property</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Brain className="w-6 h-6 text-primary" />
                <span>Recalculate Scores</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Users className="w-6 h-6 text-primary" />
                <span>Manage Users</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Database className="w-6 h-6 text-primary" />
                <span>Sync Data</span>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  )
}