import * as React from "react"
import { Search, Sparkles, MapPin, Grid3X3, List, Map, Save, Share2, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NaturalLanguageSearch } from "./NaturalLanguageSearch"
import { cn } from "@/lib/utils"

interface SearchHeaderProps {
  query: string
  resultCount: number
  totalCount: number
  currentPage: number
  totalPages: number
  sortBy: string
  viewMode: 'grid' | 'list' | 'map'
  showMap: boolean
  onQueryChange: (query: string) => void
  onSortChange: (sort: string) => void
  onViewModeChange: (mode: 'grid' | 'list' | 'map') => void
  onToggleMap: () => void
  onToggleFilters: () => void
  onSaveSearch: () => void
  onShareResults: () => void
  isLoading?: boolean
  className?: string
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Best Match', icon: '🎯' },
  { value: 'score-desc', label: 'Highest Score', icon: '⭐' },
  { value: 'price-asc', label: 'Lowest Price', icon: '💰' },
  { value: 'price-desc', label: 'Highest Price', icon: '💎' },
  { value: 'newest', label: 'Newest Listed', icon: '🆕' },
  { value: 'size-desc', label: 'Largest First', icon: '📏' },
  { value: 'lot-desc', label: 'Largest Lot', icon: '🌳' }
]

interface SearchSuggestion {
  id: string
  query: string
  type: 'similar' | 'related' | 'trending'
  count?: number
}

const SIMILAR_SEARCHES: SearchSuggestion[] = [
  { id: '1', query: 'Family homes with pools near good schools', type: 'similar', count: 847 },
  { id: '2', query: 'Updated homes under $400k with garage', type: 'related', count: 1203 },
  { id: '3', query: 'Modern condos downtown walkable', type: 'trending', count: 692 },
  { id: '4', query: 'Investment properties with high scores', type: 'related', count: 445 }
]

export function SearchHeader({
  query,
  resultCount,
  totalCount,
  currentPage,
  totalPages,
  sortBy,
  viewMode,
  showMap,
  onQueryChange,
  onSortChange,
  onViewModeChange,
  onToggleMap,
  onToggleFilters,
  onSaveSearch,
  onShareResults,
  isLoading = false,
  className
}: SearchHeaderProps) {
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState(query)

  React.useEffect(() => {
    setSearchValue(query)
  }, [query])

  const handleSearch = (newQuery: string) => {
    setSearchValue(newQuery)
    onQueryChange(newQuery)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.query)
  }

  const currentSort = SORT_OPTIONS.find(option => option.value === sortBy) || SORT_OPTIONS[0]

  const resultText = React.useMemo(() => {
    if (isLoading) return "Searching..."
    if (resultCount === 0) return "No properties found"
    
    const start = (currentPage - 1) * 24 + 1
    const end = Math.min(currentPage * 24, totalCount)
    
    return `Showing ${start.toLocaleString()}-${end.toLocaleString()} of ${totalCount.toLocaleString()} properties`
  }, [resultCount, totalCount, currentPage, isLoading])

  return (
    <div className={cn("bg-white border-b border-gray-200", className)}>
      {/* Top Section - Search Bar */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            {/* Persistent Natural Language Search */}
            <div className="flex-1 max-w-2xl">
              <NaturalLanguageSearch
                onSearch={handleSearch}
                onSuggestionClick={handleSuggestionClick}
                isLoading={isLoading}
                size="default"
                className="w-full"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={onSaveSearch}
                variant="outline"
                size="sm"
                className="hidden sm:flex rounded-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </Button>
              
              <Button
                onClick={onShareResults}
                variant="outline"
                size="sm"
                className="hidden sm:flex rounded-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* AI Similar Searches */}
          {query && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">People also searched for:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SIMILAR_SEARCHES.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="group"
                  >
                    <Badge
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors"
                    >
                      {suggestion.query}
                      <span className="ml-2 text-text-tertiary group-hover:text-primary">
                        ({suggestion.count})
                      </span>
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Results Info & Controls */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left Side - Results Info */}
            <div className="flex items-center space-x-4">
              {/* Results Count */}
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-secondary">
                  {resultText}
                </span>
                {query && (
                  <Badge variant="secondary" className="text-xs">
                    for "{query.length > 30 ? query.substring(0, 30) + '...' : query}"
                  </Badge>
                )}
              </div>

              {/* Mobile Filter Toggle */}
              <Button
                onClick={onToggleFilters}
                variant="outline"
                size="sm"
                className="sm:hidden rounded-full"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Right Side - Controls */}
            <div className="flex items-center space-x-4">
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-text-secondary hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'grid'
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-gray-50"
                  )}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onViewModeChange('list')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'list'
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-gray-50"
                  )}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Map Toggle */}
              <Button
                onClick={onToggleMap}
                variant={showMap ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                <Map className="w-4 h-4 mr-2" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}