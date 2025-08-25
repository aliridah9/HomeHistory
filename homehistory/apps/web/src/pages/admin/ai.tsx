import * as React from "react"
import { Helmet } from "react-helmet-async"
import { 
  Brain, DollarSign, Clock, TrendingUp, BarChart3, PieChart, 
  Sparkles, AlertTriangle, CheckCircle, Activity, Zap, Search
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/Layout"
import { cn } from "@/lib/utils"

interface AIMetric {
  title: string
  value: string
  change: number
  trend: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  color: string
}

interface SearchQuery {
  id: string
  query: string
  count: number
  conversionRate: number
  avgResponseTime: number
}

interface AIService {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  usage: number
  cost: number
  avgResponseTime: number
  errorRate: number
}

const AI_METRICS: AIMetric[] = [
  {
    title: "Total AI Requests",
    value: "847K",
    change: 15.7,
    trend: "up",
    icon: Brain,
    color: "text-purple-600"
  },
  {
    title: "Monthly AI Cost",
    value: "$12.4K",
    change: 8.3,
    trend: "up",
    icon: DollarSign,
    color: "text-green-600"
  },
  {
    title: "Avg Response Time",
    value: "1.2s",
    change: -5.2,
    trend: "down",
    icon: Clock,
    color: "text-blue-600"
  },
  {
    title: "Score Accuracy",
    value: "94.2%",
    change: 2.1,
    trend: "up",
    icon: TrendingUp,
    color: "text-yellow-600"
  }
]

const POPULAR_SEARCHES: SearchQuery[] = [
  {
    id: '1',
    query: 'Modern family home with pool under $500k',
    count: 1247,
    conversionRate: 12.5,
    avgResponseTime: 1100
  },
  {
    id: '2',
    query: 'Cozy 2-bedroom condo near downtown',
    count: 892,
    conversionRate: 15.3,
    avgResponseTime: 950
  },
  {
    id: '3',
    query: 'Investment property with high rental yield',
    count: 743,
    conversionRate: 8.7,
    avgResponseTime: 1300
  },
  {
    id: '4',
    query: 'Luxury home with mountain views',
    count: 634,
    conversionRate: 18.2,
    avgResponseTime: 1200
  },
  {
    id: '5',
    query: 'Fixer-upper with good bones',
    count: 521,
    conversionRate: 9.4,
    avgResponseTime: 1400
  }
]

const AI_SERVICES: AIService[] = [
  {
    name: 'OpenAI GPT-4',
    status: 'healthy',
    usage: 75,
    cost: 8500,
    avgResponseTime: 1200,
    errorRate: 0.2
  },
  {
    name: 'Text Embeddings',
    status: 'healthy',
    usage: 85,
    cost: 2400,
    avgResponseTime: 300,
    errorRate: 0.1
  },
  {
    name: 'Score Calculation',
    status: 'degraded',
    usage: 92,
    cost: 1200,
    avgResponseTime: 2500,
    errorRate: 1.8
  },
  {
    name: 'Natural Language Processing',
    status: 'healthy',
    usage: 68,
    cost: 400,
    avgResponseTime: 800,
    errorRate: 0.3
  }
]

function AIMetricCard({ metric }: { metric: AIMetric }) {
  const Icon = metric.icon
  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingUp : Activity

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center",
          metric.color === 'text-purple-600' ? 'bg-purple-100' :
          metric.color === 'text-green-600' ? 'bg-green-100' :
          metric.color === 'text-blue-600' ? 'bg-blue-100' : 'bg-yellow-100'
        )}>
          <Icon className={cn("w-6 h-6", metric.color)} />
        </div>
        <Badge variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'secondary' : 'secondary'}>
          <TrendIcon className={cn("w-3 h-3 mr-1", metric.trend === 'down' && "rotate-180")} />
          {Math.abs(metric.change)}%
        </Badge>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-text-primary">{metric.value}</h3>
        <p className="text-sm text-text-secondary">{metric.title}</p>
        <p className="text-xs text-text-tertiary">vs last month</p>
      </div>
    </div>
  )
}

export default function AdminAI() {
  return (
    <>
      <Helmet>
        <title>AI Analytics | HomeHistory Admin</title>
        <meta name="description" content="AI usage metrics, costs, and performance monitoring" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Container className="py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">AI Analytics</h1>
              <p className="text-text-secondary mt-1">
                Monitor AI usage, costs, and performance metrics
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered Platform
              </Badge>
              <Button variant="outline" className="rounded-full">
                Generate Report
              </Button>
            </div>
          </div>

          {/* AI Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {AI_METRICS.map((metric, index) => (
              <AIMetricCard key={index} metric={metric} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Usage Over Time */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">AI Usage Over Time</h2>
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-text-secondary">
                  <Brain className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>AI usage chart visualization</p>
                  <p className="text-xs">Daily/Weekly/Monthly trends</p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Cost Breakdown</h2>
                <PieChart className="w-5 h-5 text-primary" />
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-text-secondary">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Cost distribution by service</p>
                  <p className="text-xs">OpenAI, Embeddings, Processing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Search Queries */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-text-primary">Popular Search Queries</h2>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Query</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Count</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Conversion</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Response Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {POPULAR_SEARCHES.map((search) => (
                    <tr key={search.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">{search.query}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-primary">{search.count.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="font-semibold text-text-primary">{search.conversionRate}%</div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.min(search.conversionRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-text-primary">{search.avgResponseTime}ms</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Services Health */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-text-primary">AI Services Health</h2>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {AI_SERVICES.map((service, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-text-primary">{service.name}</h3>
                    <Badge 
                      className={cn(
                        service.status === 'healthy' ? 'bg-green-100 text-green-800' :
                        service.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      )}
                    >
                      {service.status === 'healthy' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {service.status !== 'healthy' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {service.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-tertiary">Usage</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={cn("h-2 rounded-full",
                              service.usage < 70 ? "bg-green-500" :
                              service.usage < 90 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${service.usage}%` }}
                          />
                        </div>
                        <span className="font-medium">{service.usage}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-text-tertiary">Cost</p>
                      <p className="font-medium text-text-primary">${service.cost.toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <p className="text-text-tertiary">Response Time</p>
                      <p className="font-medium text-text-primary">{service.avgResponseTime}ms</p>
                    </div>
                    
                    <div>
                      <p className="text-text-tertiary">Error Rate</p>
                      <p className={cn("font-medium",
                        service.errorRate < 1 ? "text-green-600" :
                        service.errorRate < 2 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {service.errorRate}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score Distribution */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-text-primary">HomeHistory Score™ Distribution</h2>
              </div>
            </div>
            
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-text-secondary">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Score distribution histogram</p>
                <p className="text-xs">Properties by score ranges (0-100)</p>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  )
}