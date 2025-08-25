import * as React from "react"
import { Heart, MapPin, Bed, Bath, Square, Car, Waves, TreePine, Sparkles, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Property {
  id: string
  title: string
  address: string
  city: string
  state: string
  zipCode: string
  price: number
  bedrooms: number
  bathrooms: number
  squareFeet: number
  imageUrl: string
  images?: string[]
  homeHistoryScore: number
  highlights: string[]
  features: {
    pool?: boolean
    garage?: boolean
    yard?: boolean
    modernUpdates?: boolean
    newConstruction?: boolean
    walkable?: boolean
  }
  listingType: 'sale' | 'rent'
  daysOnMarket?: number
  priceHistory?: {
    originalPrice: number
    reductions: number
  }
}

interface PropertyCardProps {
  property: Property
  onFavorite?: (propertyId: string) => void
  onViewReport?: (propertyId: string) => void
  isFavorited?: boolean
  showScore?: boolean
  size?: 'default' | 'compact' | 'large'
  className?: string
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'bg-green-500 text-white'
  if (score >= 80) return 'bg-green-400 text-white'
  if (score >= 70) return 'bg-yellow-500 text-white'
  if (score >= 60) return 'bg-orange-500 text-white'
  return 'bg-red-500 text-white'
}

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Very Good'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  return 'Needs Attention'
}

const formatPrice = (price: number, type: 'sale' | 'rent') => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
  
  return type === 'rent' ? `${formatted}/mo` : formatted
}

const FEATURE_ICONS = {
  pool: { icon: Waves, label: 'Pool', color: 'text-blue-500' },
  garage: { icon: Car, label: 'Garage', color: 'text-gray-600' },
  yard: { icon: TreePine, label: 'Yard', color: 'text-green-500' },
  modernUpdates: { icon: Sparkles, label: 'Modern', color: 'text-purple-500' },
  newConstruction: { icon: Sparkles, label: 'New', color: 'text-yellow-500' },
  walkable: { icon: MapPin, label: 'Walkable', color: 'text-indigo-500' }
}

export function PropertyCard({
  property,
  onFavorite,
  onViewReport,
  isFavorited = false,
  showScore = true,
  size = 'default',
  className
}: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  const isCompact = size === 'compact'
  const isLarge = size === 'large'

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite?.(property.id)
  }

  const handleViewReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onViewReport?.(property.id)
  }

  const activeFeatures = Object.entries(property.features)
    .filter(([_, value]) => value)
    .map(([key]) => key as keyof typeof FEATURE_ICONS)
    .slice(0, 3) // Show max 3 features

  return (
    <div className={cn(
      "group relative bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden",
      "hover:border-primary/20 hover:-translate-y-1",
      className
    )}>
      {/* Property Image */}
      <div className={cn(
        "relative overflow-hidden bg-gray-100",
        isCompact ? "h-40" : isLarge ? "h-64" : "h-48"
      )}>
        {!imageError ? (
          <img
            src={property.imageUrl}
            alt={property.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
              !imageLoaded && "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center text-gray-400">
              <Square className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm">No Image</span>
            </div>
          </div>
        )}

        {/* Loading Placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        {/* Favorite Heart */}
        <button
          onClick={handleFavorite}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
            "bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-110",
            isFavorited ? "text-red-500" : "text-gray-600 hover:text-red-500"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
        </button>

        {/* HomeHistory Score Badge */}
        {showScore && (
          <div className="absolute top-3 left-3">
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm",
              getScoreColor(property.homeHistoryScore)
            )}>
              {property.homeHistoryScore}
            </div>
          </div>
        )}

        {/* Days on Market */}
        {property.daysOnMarket && property.daysOnMarket > 0 && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-700 text-xs">
              {property.daysOnMarket} days on market
            </Badge>
          </div>
        )}

        {/* Price Reduction Indicator */}
        {property.priceHistory?.reductions && property.priceHistory.reductions > 0 && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="bg-green-500 text-white text-xs">
              Price Reduced
            </Badge>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className={cn("p-4", isCompact && "p-3")}>
        {/* Price and Score Label */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className={cn(
              "font-bold text-text-primary",
              isCompact ? "text-lg" : isLarge ? "text-2xl" : "text-xl"
            )}>
              {formatPrice(property.price, property.listingType)}
            </h3>
            {showScore && (
              <p className="text-xs text-text-secondary">
                HomeHistory Score™: {getScoreLabel(property.homeHistoryScore)}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center text-text-secondary mb-3">
          <MapPin className="w-4 h-4 mr-1 shrink-0" />
          <span className={cn(
            "truncate",
            isCompact ? "text-sm" : "text-base"
          )}>
            {property.address}, {property.city}, {property.state}
          </span>
        </div>

        {/* Property Stats */}
        <div className="flex items-center space-x-4 mb-3 text-text-secondary">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            <span className={cn(isCompact ? "text-sm" : "text-base")}>
              {property.bedrooms}
            </span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            <span className={cn(isCompact ? "text-sm" : "text-base")}>
              {property.bathrooms}
            </span>
          </div>
          <div className="flex items-center">
            <Square className="w-4 h-4 mr-1" />
            <span className={cn(isCompact ? "text-sm" : "text-base")}>
              {property.squareFeet.toLocaleString()} sq ft
            </span>
          </div>
        </div>

        {/* Key Features */}
        {activeFeatures.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFeatures.map((featureKey) => {
              const feature = FEATURE_ICONS[featureKey]
              const Icon = feature.icon
              return (
                <div
                  key={featureKey}
                  className="flex items-center px-2 py-1 bg-gray-50 rounded-full"
                >
                  <Icon className={cn("w-3 h-3 mr-1", feature.color)} />
                  <span className="text-xs text-text-secondary">
                    {feature.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Highlights */}
        {property.highlights && property.highlights.length > 0 && (
          <div className="mb-4">
            <p className={cn(
              "text-text-secondary line-clamp-2",
              isCompact ? "text-sm" : "text-base"
            )}>
              {property.highlights.slice(0, 2).join(' • ')}
            </p>
          </div>
        )}

        {/* View Report Button */}
        <Button
          onClick={handleViewReport}
          className={cn(
            "w-full bg-primary hover:bg-primary/90 text-white rounded-full font-semibold transition-all duration-200",
            "group-hover:bg-gradient-to-r group-hover:from-[#007AFF] group-hover:to-[#BF5AF2]",
            isCompact ? "h-9 text-sm" : "h-10"
          )}
        >
          <Eye className="w-4 h-4 mr-2" />
          View HomeHistory Report
        </Button>
      </div>

      {/* Hover Overlay for Additional Info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  )
}