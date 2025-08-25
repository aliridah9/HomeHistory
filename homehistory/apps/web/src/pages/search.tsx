import * as React from "react"
import { Helmet } from "react-helmet-async"
import { useSearchParams, useNavigate } from "react-router-dom"
import { SearchHeader } from "@/components/search/SearchHeader"
import { SearchFilters } from "@/components/search/SearchFilters"
import { PropertyGrid } from "@/components/search/PropertyGrid"
import { PropertyMap } from "@/components/search/PropertyMap"
import { useUIStore } from "@/stores/ui.store"
import { usePropertiesStore } from "@/stores/properties.store"
import { cn } from "@/lib/utils"

interface SearchFilters {
  priceRange: { min: number; max: number }
  propertyTypes: string[]
  bedrooms: number | null
  bathrooms: number | null
  squareFootage: { min: number; max: number }
  lotSize: { min: number; max: number }
  homeHistoryScore: { min: number; max: number }
  yearBuilt: { min: number; max: number }
  features: string[]
  amenities: string[]
  schoolRating: number | null
  keywords: string[]
}

// Mock property data with coordinates for map
const MOCK_SEARCH_PROPERTIES = [
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
    highlights: ['Recently renovated kitchen', 'Large backyard perfect for families'],
    features: { yard: true, garage: true, modernUpdates: true },
    listingType: 'sale' as const,
    daysOnMarket: 5,
    latitude: 30.2672 + (Math.random() - 0.5) * 0.1,
    longitude: -97.7431 + (Math.random() - 0.5) * 0.1
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
    highlights: ['City skyline views', 'Walking distance to entertainment'],
    features: { garage: true, modernUpdates: true, walkable: true },
    listingType: 'sale' as const,
    daysOnMarket: 12,
    latitude: 30.2672 + (Math.random() - 0.5) * 0.1,
    longitude: -97.7431 + (Math.random() - 0.5) * 0.1
  },
  // Add more mock properties...
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `mock-${i + 3}`,
    title: `Property ${i + 3}`,
    address: `${1000 + i} Street Name`,
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    price: Math.floor(Math.random() * 800000) + 200000,
    bedrooms: Math.floor(Math.random() * 4) + 2,
    bathrooms: Math.floor(Math.random() * 3) + 1.5,
    squareFeet: Math.floor(Math.random() * 2000) + 1000,
    imageUrl: `https://images.unsplash.com/photo-${1564013799919 + i}?w=800&h=600&fit=crop`,
    homeHistoryScore: Math.floor(Math.random() * 40) + 60,
    highlights: ['Great location', 'Well maintained'],
    features: { 
      garage: Math.random() > 0.5,
      pool: Math.random() > 0.7,
      yard: Math.random() > 0.3
    },
    listingType: 'sale' as const,
    daysOnMarket: Math.floor(Math.random() * 30) + 1,
    latitude: 30.2672 + (Math.random() - 0.5) * 0.1,
    longitude: -97.7431 + (Math.random() - 0.5) * 0.1
  }))
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const { favoriteProperty, unfavoriteProperty, favoritedProperties } = usePropertiesStore()

  // Search state
  const [query, setQuery] = React.useState(searchParams.get('q') || '')
  const [properties, setProperties] = React.useState(MOCK_SEARCH_PROPERTIES)
  const [filteredProperties, setFilteredProperties] = React.useState(MOCK_SEARCH_PROPERTIES)
  const [isLoading, setIsLoading] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'map'>('grid')
  const [showMap, setShowMap] = React.useState(false)
  const [showFilters, setShowFilters] = React.useState(true)
  const [isMapFullscreen, setIsMapFullscreen] = React.useState(false)
  const [selectedProperty, setSelectedProperty] = React.useState<string>()
  const [comparedProperties, setComparedProperties] = React.useState<string[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage] = React.useState(24)
  const [sortBy, setSortBy] = React.useState('relevance')

  // Filter state
  const [filters, setFilters] = React.useState<SearchFilters>({
    priceRange: { min: 0, max: 2000000 },
    propertyTypes: [],
    bedrooms: null,
    bathrooms: null,
    squareFootage: { min: 500, max: 10000 },
    lotSize: { min: 0.1, max: 5 },
    homeHistoryScore: { min: 0, max: 100 },
    yearBuilt: { min: 1900, max: new Date().getFullYear() },
    features: [],
    amenities: [],
    schoolRating: null,
    keywords: []
  })

  // Initialize from URL params
  React.useEffect(() => {
    const urlQuery = searchParams.get('q')
    if (urlQuery) {
      setQuery(urlQuery)
      performSearch(urlQuery)
    }
  }, [searchParams])

  // Apply filters whenever they change
  React.useEffect(() => {
    applyFilters()
  }, [properties, filters, sortBy])

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // In production, call the actual search API
      // const results = await searchApi.naturalLanguageSearch(searchQuery)
      // setProperties(results.data)
      
      // For now, use mock data
      setProperties(MOCK_SEARCH_PROPERTIES)
      
      addNotification({
        type: "success",
        title: "Search completed",
        message: `Found ${MOCK_SEARCH_PROPERTIES.length} properties`
      })
    } catch (error) {
      addNotification({
        type: "error",
        title: "Search failed",
        message: "There was an error performing your search"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...properties]

    // Apply price filter
    if (filters.priceRange.min > 0 || filters.priceRange.max < 2000000) {
      filtered = filtered.filter(p => 
        p.price >= filters.priceRange.min && p.price <= filters.priceRange.max
      )
    }

    // Apply property type filter
    if (filters.propertyTypes.length > 0) {
      // Mock filter - in production, use actual property type field
      filtered = filtered.filter(p => filters.propertyTypes.includes('house'))
    }

    // Apply bedroom filter
    if (filters.bedrooms !== null) {
      filtered = filtered.filter(p => p.bedrooms >= filters.bedrooms!)
    }

    // Apply bathroom filter
    if (filters.bathrooms !== null) {
      filtered = filtered.filter(p => p.bathrooms >= filters.bathrooms!)
    }

    // Apply HomeHistory Score filter
    if (filters.homeHistoryScore.min > 0 || filters.homeHistoryScore.max < 100) {
      filtered = filtered.filter(p => 
        p.homeHistoryScore >= filters.homeHistoryScore.min && 
        p.homeHistoryScore <= filters.homeHistoryScore.max
      )
    }

    // Apply features filter
    if (filters.features.length > 0) {
      filtered = filtered.filter(p => 
        filters.features.some(feature => p.features[feature as keyof typeof p.features])
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'score-desc':
        filtered.sort((a, b) => b.homeHistoryScore - a.homeHistoryScore)
        break
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        filtered.sort((a, b) => (a.daysOnMarket || 0) - (b.daysOnMarket || 0))
        break
      case 'size-desc':
        filtered.sort((a, b) => b.squareFeet - a.squareFeet)
        break
      default:
        // Keep original order for relevance
        break
    }

    setFilteredProperties(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery)
    setSearchParams({ q: newQuery })
    performSearch(newQuery)
  }

  const handlePropertyFavorite = (propertyId: string) => {
    if (favoritedProperties.includes(propertyId)) {
      unfavoriteProperty(propertyId)
      addNotification({
        type: "info",
        title: "Removed from favorites",
        message: "Property removed from your favorites"
      })
    } else {
      favoriteProperty(propertyId)
      addNotification({
        type: "success",
        title: "Added to favorites",
        message: "Property added to your favorites"
      })
    }
  }

  const handlePropertyView = (propertyId: string) => {
    navigate(`/property/${propertyId}`)
  }

  const handlePropertyShare = (propertyId: string) => {
    const property = filteredProperties.find(p => p.id === propertyId)
    if (property) {
      navigator.clipboard.writeText(`${window.location.origin}/property/${propertyId}`)
      addNotification({
        type: "success",
        title: "Link copied",
        message: `Link to ${property.title} copied to clipboard`
      })
    }
  }

  const handlePropertyCompare = (propertyId: string) => {
    if (comparedProperties.includes(propertyId)) {
      setComparedProperties(prev => prev.filter(id => id !== propertyId))
      addNotification({
        type: "info",
        title: "Removed from comparison",
        message: "Property removed from comparison list"
      })
    } else if (comparedProperties.length < 4) {
      setComparedProperties(prev => [...prev, propertyId])
      addNotification({
        type: "success",
        title: "Added to comparison",
        message: "Property added to comparison list"
      })
    } else {
      addNotification({
        type: "error",
        title: "Comparison limit reached",
        message: "You can only compare up to 4 properties at once"
      })
    }
  }

  const handleSaveSearch = () => {
    addNotification({
      type: "success",
      title: "Search saved",
      message: "You'll receive alerts when new properties match your criteria"
    })
  }

  const handleShareResults = () => {
    const url = new URL(window.location.href)
    navigator.clipboard.writeText(url.toString())
    addNotification({
      type: "success",
      title: "Search link copied",
      message: "Search results link copied to clipboard"
    })
  }

  const handleClearFilters = () => {
    setFilters({
      priceRange: { min: 0, max: 2000000 },
      propertyTypes: [],
      bedrooms: null,
      bathrooms: null,
      squareFootage: { min: 500, max: 10000 },
      lotSize: { min: 0.1, max: 5 },
      homeHistoryScore: { min: 0, max: 100 },
      yearBuilt: { min: 1900, max: new Date().getFullYear() },
      features: [],
      amenities: [],
      schoolRating: null,
      keywords: []
    })
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProperties = filteredProperties.slice(startIndex, endIndex)

  return (
    <>
      <Helmet>
        <title>{query ? `"${query}" - Search Results` : 'Search Properties'} | HomeHistory</title>
        <meta name="description" content={`Search results for "${query}" - Find your perfect home with HomeHistory's AI-powered search`} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Search Header */}
        <SearchHeader
          query={query}
          resultCount={currentProperties.length}
          totalCount={filteredProperties.length}
          currentPage={currentPage}
          totalPages={totalPages}
          sortBy={sortBy}
          viewMode={viewMode}
          showMap={showMap}
          onQueryChange={handleQueryChange}
          onSortChange={setSortBy}
          onViewModeChange={setViewMode}
          onToggleMap={() => setShowMap(!showMap)}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onSaveSearch={handleSaveSearch}
          onShareResults={handleShareResults}
          isLoading={isLoading}
        />

        {/* Main Content */}
        <div className="flex h-[calc(100vh-200px)]">
          {/* Left Sidebar - Filters */}
          <div className={cn(
            "transition-all duration-300 bg-white border-r border-gray-200",
            showFilters ? "w-80 flex-shrink-0" : "w-0 overflow-hidden"
          )}>
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearAll={handleClearFilters}
              isCollapsed={!showFilters}
              onToggleCollapse={() => setShowFilters(!showFilters)}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* Property List */}
            <div className={cn(
              "transition-all duration-300 overflow-y-auto",
              showMap ? "w-1/2 border-r border-gray-200" : "w-full"
            )}>
              <div className="p-6">
                <PropertyGrid
                  properties={currentProperties}
                  viewMode={viewMode}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={filteredProperties.length}
                  isLoading={isLoading}
                  onPropertyFavorite={handlePropertyFavorite}
                  onPropertyView={handlePropertyView}
                  onPropertyShare={handlePropertyShare}
                  onPropertyCompare={handlePropertyCompare}
                  onPageChange={setCurrentPage}
                  favoritedProperties={favoritedProperties}
                  comparedProperties={comparedProperties}
                />
              </div>
            </div>

            {/* Map Panel */}
            {showMap && (
              <div className="w-1/2">
                <PropertyMap
                  properties={filteredProperties}
                  selectedProperty={selectedProperty}
                  onPropertySelect={setSelectedProperty}
                  onPropertyHover={(id) => {
                    // Highlight property in list
                  }}
                  isFullscreen={isMapFullscreen}
                  onToggleFullscreen={() => setIsMapFullscreen(!isMapFullscreen)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}