import * as React from "react"
import { ArrowRight, MapPin, TrendingUp, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PropertyCard } from "@/components/property/PropertyCard"
import { Container } from "@/components/layout/Layout"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
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

interface FeaturedPropertiesProps {
  properties: Property[]
  onPropertyFavorite?: (propertyId: string) => void
  onPropertyView?: (propertyId: string) => void
  onViewAll?: () => void
  isLoading?: boolean
  favoritedProperties?: string[]
  className?: string
}

// Mock data for demonstration
const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern Family Home',
    address: '1234 Oak Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    price: 485000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2400,
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
    homeHistoryScore: 92,
    highlights: ['Recently renovated kitchen', 'Large backyard perfect for families', 'Top-rated school district'],
    features: {
      yard: true,
      garage: true,
      modernUpdates: true
    },
    listingType: 'sale',
    daysOnMarket: 5
  },
  {
    id: '2',
    title: 'Downtown Luxury Condo',
    address: '567 Main Avenue',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    price: 325000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
    homeHistoryScore: 88,
    highlights: ['City skyline views', 'Walking distance to entertainment', 'Modern amenities'],
    features: {
      garage: true,
      modernUpdates: true,
      walkable: true
    },
    listingType: 'sale',
    daysOnMarket: 12
  },
  {
    id: '3',
    title: 'Charming Craftsman',
    address: '890 Elm Drive',
    city: 'Austin',
    state: 'TX',
    zipCode: '78703',
    price: 395000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
    homeHistoryScore: 85,
    highlights: ['Original hardwood floors', 'Covered front porch', 'Mature trees'],
    features: {
      yard: true,
      garage: false
    },
    listingType: 'sale',
    daysOnMarket: 8
  },
  {
    id: '4',
    title: 'New Construction',
    address: '456 Pine Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78704',
    price: 550000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2800,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    homeHistoryScore: 95,
    highlights: ['Brand new construction', 'Energy efficient features', 'Smart home technology'],
    features: {
      newConstruction: true,
      garage: true,
      modernUpdates: true
    },
    listingType: 'sale',
    daysOnMarket: 3
  },
  {
    id: '5',
    title: 'Pool Paradise',
    address: '789 Cedar Lane',
    city: 'Austin',
    state: 'TX',
    zipCode: '78705',
    price: 475000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 2100,
    imageUrl: 'https://images.unsplash.com/photo-1566908829077-2e3b8c4e4b6d?w=800&h=600&fit=crop',
    homeHistoryScore: 89,
    highlights: ['Sparkling pool and spa', 'Outdoor entertaining area', 'Updated throughout'],
    features: {
      pool: true,
      yard: true,
      garage: true
    },
    listingType: 'sale',
    daysOnMarket: 15
  },
  {
    id: '6',
    title: 'Investment Opportunity',
    address: '321 Maple Court',
    city: 'Austin',
    state: 'TX',
    zipCode: '78706',
    price: 285000,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 1100,
    imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop',
    homeHistoryScore: 73,
    highlights: ['Great rental potential', 'Up and coming neighborhood', 'Easy maintenance'],
    features: {
      garage: false,
      yard: true
    },
    listingType: 'sale',
    daysOnMarket: 22,
    priceHistory: {
      originalPrice: 310000,
      reductions: 1
    }
  }
]

export function FeaturedProperties({
  properties = MOCK_PROPERTIES,
  onPropertyFavorite,
  onPropertyView,
  onViewAll,
  isLoading = false,
  favoritedProperties = [],
  className
}: FeaturedPropertiesProps) {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')

  const handleFavorite = (propertyId: string) => {
    onPropertyFavorite?.(propertyId)
  }

  const handleViewReport = (propertyId: string) => {
    onPropertyView?.(propertyId)
  }

  if (isLoading) {
    return (
      <section className={cn("py-16", className)}>
        <Container>
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                Featured Properties
              </h2>
              <p className="text-lg text-text-secondary">
                Discover homes with exceptional HomeHistory Scores
              </p>
            </div>
            
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-text-secondary">Loading featured properties...</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className={cn("py-16 bg-gray-50", className)}>
      <Container>
        <div className="space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Badge className="bg-gradient-to-r from-[#007AFF]/10 to-[#BF5AF2]/10 text-primary border-primary/20 font-medium">
                <TrendingUp className="w-4 h-4 mr-2" />
                Top Rated Properties
              </Badge>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              Featured Properties
            </h2>
            
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Discover exceptional homes with high HomeHistory Scores, verified data, 
              and comprehensive analysis from our AI-powered platform.
            </p>
          </div>

          {/* Filter and View Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-text-secondary" />
              <span className="text-text-secondary">
                Showing {properties.length} properties with scores 85+
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="rounded-full"
              >
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
                className="rounded-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View on Map
              </Button>
            </div>
          </div>

          {/* Properties Grid */}
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1 max-w-4xl mx-auto"
          )}>
            {properties.slice(0, 6).map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onFavorite={handleFavorite}
                onViewReport={handleViewReport}
                isFavorited={favoritedProperties.includes(property.id)}
                showScore={true}
                size={viewMode === 'list' ? 'large' : 'default'}
                className={cn(
                  viewMode === 'list' && "flex-row items-center"
                )}
              />
            ))}
          </div>

          {/* Load More / View All */}
          <div className="text-center pt-8">
            <div className="space-y-4">
              <p className="text-text-secondary">
                Showing 6 of 2,347 properties in Austin, TX
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={onViewAll}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white rounded-full font-semibold px-8"
                >
                  View All Properties
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full font-semibold px-8 border-2"
                >
                  Save This Search
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-gray-200">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-text-primary">94.2</div>
              <div className="text-sm text-text-secondary">Avg. Score</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-text-primary">$425K</div>
              <div className="text-sm text-text-secondary">Avg. Price</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-text-primary">12</div>
              <div className="text-sm text-text-secondary">Days on Market</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-text-primary">2,100</div>
              <div className="text-sm text-text-secondary">Avg. Sq Ft</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}