import * as React from "react"
import { FileText, Camera, MapPin, Star, BarChart3, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export type PropertyTabType = 'overview' | 'report' | 'images' | 'neighborhood' | 'score'

interface PropertyTab {
  id: PropertyTabType
  label: string
  icon: React.ElementType
  description: string
  badge?: string | number
}

interface PropertyTabsProps {
  activeTab: PropertyTabType
  onTabChange: (tab: PropertyTabType) => void
  reportScore?: number
  imageCount?: number
  className?: string
}

const PROPERTY_TABS: PropertyTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FileText,
    description: 'Property details, features, and AI description'
  },
  {
    id: 'report',
    label: 'HomeHistory Report™',
    icon: BarChart3,
    description: 'AI-powered analysis and risk assessment'
  },
  {
    id: 'images',
    label: 'Images',
    icon: Camera,
    description: 'Photo gallery and virtual tours'
  },
  {
    id: 'neighborhood',
    label: 'Neighborhood',
    icon: MapPin,
    description: 'Schools, amenities, and local insights'
  },
  {
    id: 'score',
    label: 'Score Details',
    icon: Star,
    description: 'Detailed HomeHistory Score™ breakdown'
  }
]

export function PropertyTabs({
  activeTab,
  onTabChange,
  reportScore,
  imageCount,
  className
}: PropertyTabsProps) {
  const getTabBadge = (tab: PropertyTab) => {
    switch (tab.id) {
      case 'report':
        return reportScore ? `${reportScore}/100` : undefined
      case 'images':
        return imageCount ? imageCount.toString() : undefined
      case 'score':
        return reportScore ? `${reportScore}` : undefined
      default:
        return undefined
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500 text-white'
    if (score >= 80) return 'bg-green-400 text-white'
    if (score >= 70) return 'bg-yellow-500 text-white'
    if (score >= 60) return 'bg-orange-500 text-white'
    return 'bg-red-500 text-white'
  }

  return (
    <div className={cn("border-b border-gray-200 bg-white sticky top-0 z-10", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {PROPERTY_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const badge = getTabBadge(tab)
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "group relative min-w-0 flex-shrink-0 py-4 px-1 text-sm font-medium text-center border-b-2 transition-colors duration-200",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300"
                )}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary"
                  )} />
                  
                  <span className="whitespace-nowrap">{tab.label}</span>
                  
                  {/* AI Badge for Report and Score tabs */}
                  {(tab.id === 'report' || tab.id === 'score') && (
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-xs text-primary font-medium">AI</span>
                    </div>
                  )}
                  
                  {/* Tab Badge */}
                  {badge && (
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      tab.id === 'report' || tab.id === 'score' 
                        ? reportScore 
                          ? getScoreColor(reportScore)
                          : "bg-gray-100 text-gray-800"
                        : "bg-gray-100 text-gray-800"
                    )}>
                      {badge}
                    </span>
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  {tab.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}