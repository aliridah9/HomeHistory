import * as React from "react"
import { Home, Calendar, Ruler, MapPin, Wrench, Sparkles, TrendingUp, FileText, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Property {
  id: string
  title: string
  description: string
  aiDescription: string
  bedrooms: number
  bathrooms: number
  squareFeet: number
  lotSize: number
  yearBuilt: number
  propertyType: string
  parkingSpaces: number
  stories: number
  features: {
    pool?: boolean
    garage?: boolean
    fireplace?: boolean
    yard?: boolean
    deck?: boolean
    basement?: boolean
    ac?: boolean
    hardwood?: boolean
    updated?: boolean
    newConstruction?: boolean
  }
  recentUpdates: Array<{
    year: number
    description: string
    type: 'renovation' | 'repair' | 'addition'
  }>
  permits: Array<{
    year: number
    type: string
    description: string
    status: 'approved' | 'pending' | 'expired'
  }>
  priceHistory: Array<{
    date: string
    price: number
    event: 'listed' | 'price_change' | 'sold' | 'withdrawn'
  }>
}

interface OverviewTabProps {
  property: Property
  className?: string
}

interface PriceHistoryChartProps {
  data: Property['priceHistory']
  currentPrice: number
}

function PriceHistoryChart({ data, currentPrice }: PriceHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-text-secondary">No price history available</p>
      </div>
    )
  }

  const maxPrice = Math.max(...data.map(d => d.price), currentPrice)
  const minPrice = Math.min(...data.map(d => d.price), currentPrice)
  const priceRange = maxPrice - minPrice

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative h-64 bg-gray-50 rounded-lg p-4">
        <div className="relative h-full">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-text-tertiary">
            <span>${(maxPrice / 1000).toFixed(0)}K</span>
            <span>${(minPrice / 1000).toFixed(0)}K</span>
          </div>
          
          {/* Chart area */}
          <div className="ml-12 h-full relative">
            <svg className="w-full h-full">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Price line */}
              <polyline
                fill="none"
                stroke="#007AFF"
                strokeWidth="3"
                points={data.map((point, index) => {
                  const x = (index / (data.length - 1)) * 100
                  const y = 100 - ((point.price - minPrice) / priceRange) * 100
                  return `${x}%,${y}%`
                }).join(' ')}
              />
              
              {/* Data points */}
              {data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100
                const y = 100 - ((point.price - minPrice) / priceRange) * 100
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="#007AFF"
                    className="hover:r-6 transition-all duration-200"
                  >
                    <title>
                      {new Date(point.date).toLocaleDateString()}: ${point.price.toLocaleString()}
                    </title>
                  </circle>
                )
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {data.map((event, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                event.event === 'listed' ? "bg-blue-500" :
                event.event === 'price_change' ? "bg-orange-500" :
                event.event === 'sold' ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="text-text-secondary">
                {new Date(event.date).toLocaleDateString()}
              </span>
              <Badge variant="outline" className="text-xs">
                {event.event.replace('_', ' ')}
              </Badge>
            </div>
            <span className="font-medium text-text-primary">
              ${event.price.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const FEATURE_ICONS = {
  pool: { icon: '🏊', label: 'Pool' },
  garage: { icon: '🚗', label: 'Garage' },
  fireplace: { icon: '🔥', label: 'Fireplace' },
  yard: { icon: '🌳', label: 'Yard' },
  deck: { icon: '🪴', label: 'Deck/Patio' },
  basement: { icon: '🏠', label: 'Basement' },
  ac: { icon: '❄️', label: 'Air Conditioning' },
  hardwood: { icon: '🪵', label: 'Hardwood Floors' },
  updated: { icon: '✨', label: 'Recently Updated' },
  newConstruction: { icon: '🆕', label: 'New Construction' }
}

export function OverviewTab({ property, className }: OverviewTabProps) {
  const activeFeatures = Object.entries(property.features)
    .filter(([_, value]) => value)
    .map(([key]) => key as keyof typeof FEATURE_ICONS)

  const formatSquareFeet = (sqft: number) => `${sqft.toLocaleString()} sq ft`
  const formatLotSize = (sqft: number) => {
    if (sqft >= 43560) {
      return `${(sqft / 43560).toFixed(2)} acres`
    }
    return `${sqft.toLocaleString()} sq ft`
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* AI-Enhanced Description */}
      <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-text-primary">AI-Enhanced Description</h2>
          <Badge className="bg-primary text-white text-xs">Powered by AI</Badge>
        </div>
        
        <div className="space-y-4">
          <p className="text-text-primary leading-relaxed">
            {property.aiDescription}
          </p>
          
          {property.description && (
            <details className="group">
              <summary className="cursor-pointer text-primary font-medium hover:text-primary/80 transition-colors">
                View Original Description
              </summary>
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-text-secondary text-sm leading-relaxed">
                  {property.description}
                </p>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Property Details Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Basic Details */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text-primary">Property Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Home className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-text-secondary">Bedrooms</p>
                <p className="font-semibold text-text-primary">{property.bedrooms}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Home className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-text-secondary">Bathrooms</p>
                <p className="font-semibold text-text-primary">{property.bathrooms}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Ruler className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-text-secondary">Square Feet</p>
                <p className="font-semibold text-text-primary">{formatSquareFeet(property.squareFeet)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-text-secondary">Lot Size</p>
                <p className="font-semibold text-text-primary">{formatLotSize(property.lotSize)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-text-secondary">Year Built</p>
                <p className="font-semibold text-text-primary">{property.yearBuilt}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Home className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-text-secondary">Property Type</p>
                <p className="font-semibold text-text-primary">{property.propertyType}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text-primary">Key Features</h2>
          
          {activeFeatures.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {activeFeatures.map((featureKey) => {
                const feature = FEATURE_ICONS[featureKey]
                return (
                  <div key={featureKey} className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
                    <span className="text-xl">{feature.icon}</span>
                    <span className="font-medium text-text-primary">{feature.label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-text-secondary">No special features listed</p>
          )}
        </div>
      </div>

      {/* Recent Updates & Permits */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Updates */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-text-primary">Recent Updates</h2>
          </div>
          
          {property.recentUpdates && property.recentUpdates.length > 0 ? (
            <div className="space-y-4">
              {property.recentUpdates.map((update, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                    update.type === 'renovation' ? 'bg-blue-500' :
                    update.type === 'repair' ? 'bg-orange-500' : 'bg-green-500'
                  )}>
                    {update.year.toString().slice(-2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-text-primary">{update.year}</span>
                      <Badge variant="outline" className="text-xs">
                        {update.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-secondary">{update.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No recent updates recorded</p>
          )}
        </div>

        {/* Permits */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-text-primary">Permits</h2>
          </div>
          
          {property.permits && property.permits.length > 0 ? (
            <div className="space-y-4">
              {property.permits.map((permit, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className={cn(
                    "w-5 h-5 mt-0.5",
                    permit.status === 'approved' ? 'text-green-500' :
                    permit.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                  )} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-text-primary">{permit.type}</span>
                      <span className="text-sm text-text-secondary">({permit.year})</span>
                      <Badge variant={
                        permit.status === 'approved' ? 'default' :
                        permit.status === 'pending' ? 'secondary' : 'destructive'
                      } className="text-xs">
                        {permit.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-secondary">{permit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No permits on record</p>
          )}
        </div>
      </div>

      {/* Price History */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-text-primary">Price History</h2>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <PriceHistoryChart 
            data={property.priceHistory} 
            currentPrice={500000} // This would come from props
          />
        </div>
      </div>
    </div>
  )
}