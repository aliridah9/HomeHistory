import * as React from 'react'
import { ArrowRight, Heart, MapPin, Bed, Bath, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SimilarProperty {
  property: {
    id: string
    address: string
    city: string
    state: string
    price: number
    bedrooms: number
    bathrooms: number
    squareFeet: number
    thumbnailUrl?: string
  }
  similarityScore: number
  explanation: string
  keyMatchingFeatures: string[]
  priceDifference: number
  distanceKm: number
}

interface SimilarPropertiesProps {
  properties: SimilarProperty[]
  onPropertyClick: (propertyId: string) => void
  onFavorite?: (propertyId: string) => void
  favoritedIds?: string[]
  className?: string
}

export function SimilarProperties({
  properties,
  onPropertyClick,
  onFavorite,
  favoritedIds = [],
  className
}: SimilarPropertiesProps) {
  if (properties.length === 0) {
    return (
      <div className={cn('bg-white rounded-2xl border border-gray-200 p-8 text-center', className)}>
        <p className="text-text-secondary">No similar properties found</p>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-50'
    if (score >= 0.8) return 'text-green-500 bg-green-50'
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-50'
    return 'text-orange-600 bg-orange-50'
  }

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200 shadow-sm', className)}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Similar Properties</h2>
            <p className="text-sm text-text-secondary mt-1">
              AI-powered recommendations based on this property
            </p>
          </div>
          <div className="text-sm text-text-tertiary">
            {properties.length} {properties.length === 1 ? 'match' : 'matches'} found
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {properties.map((similar) => {
          const isFavorited = favoritedIds.includes(similar.property.id)
          
          return (
            <div
              key={similar.property.id}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onPropertyClick(similar.property.id)}
            >
              <div className="flex items-start space-x-4">
                {/* Property Image */}
                <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  {similar.property.thumbnailUrl ? (
                    <img
                      src={similar.property.thumbnailUrl}
                      alt={similar.property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <MapPin className="w-8 h-8" />
                    </div>
                  )}
                  
                  {/* Similarity Badge */}
                  <div className={cn(
                    'absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold',
                    getSimilarityColor(similar.similarityScore)
                  )}>
                    {(similar.similarityScore * 100).toFixed(0)}% match
                  </div>
                </div>

                {/* Property Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary truncate">
                        {similar.property.address}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {similar.property.city}, {similar.property.state}
                      </p>
                    </div>
                    
                    {onFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onFavorite(similar.property.id)
                        }}
                        className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Heart
                          className={cn(
                            'w-5 h-5',
                            isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="text-xl font-bold text-text-primary">
                      {formatPrice(similar.property.price)}
                    </span>
                    {similar.priceDifference !== 0 && (
                      <span className={cn(
                        'text-sm font-medium',
                        similar.priceDifference > 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {similar.priceDifference > 0 ? '+' : ''}
                        {formatPrice(Math.abs(similar.priceDifference))}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-text-secondary mb-3">
                    <div className="flex items-center space-x-1">
                      <Bed className="w-4 h-4" />
                      <span>{similar.property.bedrooms} beds</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bath className="w-4 h-4" />
                      <span>{similar.property.bathrooms} baths</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Maximize className="w-4 h-4" />
                      <span>{similar.property.squareFeet?.toLocaleString()} sq ft</span>
                    </div>
                    {similar.distanceKm > 0 && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{similar.distanceKm.toFixed(1)} km away</span>
                      </div>
                    )}
                  </div>

                  {/* AI Explanation */}
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                    {similar.explanation}
                  </p>

                  {/* Matching Features */}
                  {similar.keyMatchingFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {similar.keyMatchingFeatures.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium text-primary bg-blue-50 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 self-center">
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {properties.length >= 5 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <Button variant="outline" className="w-full sm:w-auto">
            View All Similar Properties
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}

