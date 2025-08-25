import * as React from "react"
import { Heart, Share2, BarChart3, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PropertyCard } from "@/components/property/PropertyCard"
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

interface PropertyGridProps {
  properties: Property[]
  viewMode: 'grid' | 'list'
  currentPage: number
  totalPages: number
  totalCount: number
  isLoading?: boolean
  hasMore?: boolean
  onPropertyFavorite: (propertyId: string) => void
  onPropertyView: (propertyId: string) => void
  onPropertyShare: (propertyId: string) => void
  onPropertyCompare: (propertyId: string) => void
  onPageChange: (page: number) => void
  onLoadMore?: () => void
  favoritedProperties: string[]
  comparedProperties: string[]
  infiniteScroll?: boolean
  className?: string
}

interface PropertyActionsProps {
  property: Property
  isFavorited: boolean
  isCompared: boolean
  onFavorite: (propertyId: string) => void
  onShare: (propertyId: string) => void
  onCompare: (propertyId: string) => void
}

function PropertyActions({ property, isFavorited, isCompared, onFavorite, onShare, onCompare }: PropertyActionsProps) {
  return (
    <div className="flex items-center space-x-2 mt-3">
      <Button
        onClick={() => onFavorite(property.id)}
        variant="outline"
        size="sm"
        className={cn(
          "rounded-full flex-1",
          isFavorited && "border-red-500 text-red-500 hover:bg-red-50"
        )}
      >
        <Heart className={cn("w-4 h-4 mr-2", isFavorited && "fill-current")} />
        {isFavorited ? 'Saved' : 'Save'}
      </Button>
      
      <Button
        onClick={() => onShare(property.id)}
        variant="outline"
        size="sm"
        className="rounded-full flex-1"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
      
      <Button
        onClick={() => onCompare(property.id)}
        variant="outline"
        size="sm"
        className={cn(
          "rounded-full flex-1",
          isCompared && "border-primary text-primary hover:bg-primary/10"
        )}
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        {isCompared ? 'Added' : 'Compare'}
      </Button>
    </div>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  const visiblePages = getVisiblePages()

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        variant="outline"
        size="sm"
        className="rounded-full"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {visiblePages.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-2 text-text-secondary">...</span>
          ) : (
            <Button
              onClick={() => onPageChange(Number(page))}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full min-w-[36px]",
                currentPage === page && "bg-primary text-white"
              )}
            >
              {page}
            </Button>
          )}
        </React.Fragment>
      ))}

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        variant="outline"
        size="sm"
        className="rounded-full"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

interface EmptyStateProps {
  query?: string
  hasFilters?: boolean
  onClearFilters?: () => void
  onModifySearch?: () => void
}

function EmptyState({ query, hasFilters, onClearFilters, onModifySearch }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Empty State Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="text-4xl">🏠</div>
          </div>
        </div>

        {/* Empty State Content */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-text-primary">
            No properties found
          </h3>
          
          {query ? (
            <p className="text-text-secondary">
              We couldn't find any properties matching "<strong>{query}</strong>"
              {hasFilters && " with your current filters"}.
            </p>
          ) : (
            <p className="text-text-secondary">
              Try adjusting your search criteria or filters to see more results.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {hasFilters && onClearFilters && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              className="rounded-full font-semibold"
            >
              Clear All Filters
            </Button>
          )}
          
          {onModifySearch && (
            <Button
              onClick={onModifySearch}
              className="bg-primary hover:bg-primary/90 text-white rounded-full font-semibold"
            >
              Modify Search
            </Button>
          )}
        </div>

        {/* Search Suggestions */}
        <div className="pt-4 border-t">
          <p className="text-sm text-text-tertiary mb-3">Try searching for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Family homes under $500k",
              "Modern condos downtown",
              "Houses with pools",
              "Investment properties"
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => onModifySearch?.()}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PropertyGrid({
  properties,
  viewMode,
  currentPage,
  totalPages,
  totalCount,
  isLoading = false,
  hasMore = false,
  onPropertyFavorite,
  onPropertyView,
  onPropertyShare,
  onPropertyCompare,
  onPageChange,
  onLoadMore,
  favoritedProperties,
  comparedProperties,
  infiniteScroll = false,
  className
}: PropertyGridProps) {
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)

  const handleLoadMore = async () => {
    if (onLoadMore && !isLoadingMore) {
      setIsLoadingMore(true)
      await onLoadMore()
      setIsLoadingMore(false)
    }
  }

  // Infinite scroll detection
  React.useEffect(() => {
    if (!infiniteScroll || !hasMore || isLoading || isLoadingMore) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        handleLoadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [infiniteScroll, hasMore, isLoading, isLoadingMore])

  // Loading state
  if (isLoading && properties.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-16", className)}>
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-text-secondary">Finding your perfect properties...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!isLoading && properties.length === 0) {
    return (
      <div className={className}>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Property Grid/List */}
      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' 
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
          : "grid-cols-1 max-w-4xl mx-auto"
      )}>
        {properties.map((property) => (
          <div key={property.id} className="group">
            <PropertyCard
              property={property}
              onFavorite={onPropertyFavorite}
              onViewReport={onPropertyView}
              isFavorited={favoritedProperties.includes(property.id)}
              showScore={true}
              size={viewMode === 'list' ? 'large' : 'default'}
            />
            
            {/* Quick Actions */}
            <PropertyActions
              property={property}
              isFavorited={favoritedProperties.includes(property.id)}
              isCompared={comparedProperties.includes(property.id)}
              onFavorite={onPropertyFavorite}
              onShare={onPropertyShare}
              onCompare={onPropertyCompare}
            />
          </div>
        ))}
      </div>

      {/* Loading More Indicator */}
      {(isLoading || isLoadingMore) && properties.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-text-secondary">Loading more properties...</span>
          </div>
        </div>
      )}

      {/* Load More Button (for non-infinite scroll) */}
      {!infiniteScroll && hasMore && !isLoading && (
        <div className="flex justify-center py-8">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white rounded-full font-semibold px-8"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Properties'
            )}
          </Button>
        </div>
      )}

      {/* Pagination (alternative to infinite scroll) */}
      {!infiniteScroll && !hasMore && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          className="py-8"
        />
      )}

      {/* Results Summary */}
      {!isLoading && properties.length > 0 && (
        <div className="text-center py-4 border-t border-gray-200">
          <p className="text-sm text-text-secondary">
            {infiniteScroll ? (
              `Showing ${properties.length} of ${totalCount.toLocaleString()} properties`
            ) : (
              `Page ${currentPage} of ${totalPages} • ${totalCount.toLocaleString()} total properties`
            )}
          </p>
        </div>
      )}
    </div>
  )
}