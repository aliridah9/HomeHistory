import * as React from 'react'
import { Bookmark, ChevronRight } from 'lucide-react'

type Property = {
  id: string
  title: string
  price: number
  beds: number
  baths: number
  areaSqft: number
  city: string
  image: string
  category?: string
  forSale?: boolean
}

type Props = {
  property: Property
}

export function PropertyCard({ property }: Props) {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`
    }
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`
    }
    return `$${price.toLocaleString()}`
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-md bg-white hover:shadow-lg transition-shadow">
      {/* Image with overlay elements */}
      <div className="relative h-48">
        <img 
          src={`/src/assets/${property.image}`} 
          alt={property.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* Top-left category pills */}
        <div className="absolute top-3 left-3 flex gap-1">
          {property.category && (
            <span className="px-2 py-1 text-[11px] font-medium bg-white/90 text-zinc-800 rounded-full">
              {property.category}
            </span>
          )}
          {property.forSale && (
            <span className="px-2 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-full">
              For Sale
            </span>
          )}
        </div>
        
        {/* Top-right bookmark */}
        <button 
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Bookmark property"
        >
          <Bookmark size={16} className="text-zinc-600" />
        </button>
      </div>

      {/* Bottom info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[18px] font-semibold text-zinc-900">
            {formatPrice(property.price)}
          </span>
          <button className="flex items-center gap-1 text-[13px] text-blue-600 hover:underline">
            View Details
            <ChevronRight size={14} />
          </button>
        </div>
        
        {/* Meta chips */}
        <div className="flex items-center gap-2 mb-2">
          {property.beds > 0 && (
            <span className="px-2 py-1 text-[11px] bg-zinc-100 text-zinc-700 rounded-full">
              {property.beds} bed{property.beds !== 1 ? 's' : ''}
            </span>
          )}
          {property.baths > 0 && (
            <span className="px-2 py-1 text-[11px] bg-zinc-100 text-zinc-700 rounded-full">
              {property.baths} bath{property.baths !== 1 ? 's' : ''}
            </span>
          )}
          {property.areaSqft && (
            <span className="px-2 py-1 text-[11px] bg-zinc-100 text-zinc-700 rounded-full">
              {property.areaSqft.toLocaleString()} sqft
            </span>
          )}
        </div>
        
        {/* Location */}
        <p className="text-[13px] text-zinc-500">{property.city}</p>
      </div>
    </div>
  )
}