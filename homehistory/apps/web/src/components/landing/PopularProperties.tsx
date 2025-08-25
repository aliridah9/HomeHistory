import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PropertyCard } from './PropertyCard'

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
  properties: Property[]
}

export function PopularProperties({ properties }: Props) {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, properties.length - 2))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, properties.length - 2)) % Math.max(1, properties.length - 2))
  }

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[24px] md:text-[28px] font-semibold text-zinc-900">
          Popular Properties in NY
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={prevSlide}
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Previous properties"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={nextSlide}
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Next properties"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Desktop: 3 cards, Mobile: responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.slice(currentIndex, currentIndex + 3).map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  )
}