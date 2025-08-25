import * as React from "react"
import { Search, Sparkles, MapPin, Filter, Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"

interface SearchSuggestion {
  id: string
  query: string
  type: 'popular' | 'recent' | 'ai_suggested'
  count?: number
}

interface NaturalLanguageSearchProps {
  onSearch: (query: string) => void
  onSuggestionClick: (suggestion: SearchSuggestion) => void
  isLoading?: boolean
  showResults?: boolean
  className?: string
  size?: 'default' | 'large'
}

const POPULAR_SEARCHES: SearchSuggestion[] = [
  { id: '1', query: 'Modern family home with big backyard under $500k', type: 'popular', count: 1247 },
  { id: '2', query: 'Cozy 2-bedroom condo near downtown with parking', type: 'popular', count: 892 },
  { id: '3', query: 'Luxury home with pool and mountain views', type: 'popular', count: 743 },
  { id: '4', query: 'Fixer-upper house with good bones under $300k', type: 'popular', count: 634 },
  { id: '5', query: 'Pet-friendly apartment with outdoor space', type: 'popular', count: 521 },
  { id: '6', query: 'Investment property with high rental potential', type: 'popular', count: 445 }
]

const FILTER_PILLS = [
  { id: 'price', label: 'Under $500k', icon: '💰' },
  { id: 'beds', label: '3+ Bedrooms', icon: '🛏️' },
  { id: 'pool', label: 'Pool', icon: '🏊' },
  { id: 'garage', label: 'Garage', icon: '🚗' },
  { id: 'yard', label: 'Big Yard', icon: '🌳' },
  { id: 'modern', label: 'Modern', icon: '✨' }
]

export function NaturalLanguageSearch({
  onSearch,
  onSuggestionClick,
  isLoading = false,
  showResults = false,
  className,
  size = 'default'
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = React.useState('')
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
  const [showMap, setShowMap] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const isLarge = size === 'large'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowSuggestions(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setShowSuggestions(value.length > 0)
  }

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query)
    setShowSuggestions(false)
    onSuggestionClick(suggestion)
  }

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "relative flex items-center bg-white rounded-2xl border-2 border-gray-200 shadow-lg transition-all duration-200",
          "hover:border-primary/30 focus-within:border-primary focus-within:shadow-xl",
          isLarge ? "h-16 px-6" : "h-12 px-4"
        )}>
          {/* AI Sparkles Icon */}
          <div className={cn(
            "flex items-center justify-center rounded-full bg-gradient-to-r from-[#007AFF] to-[#BF5AF2] text-white mr-3",
            isLarge ? "w-8 h-8" : "w-6 h-6"
          )}>
            <Sparkles className={cn(isLarge ? "w-4 h-4" : "w-3 h-3")} />
          </div>

          {/* Search Input */}
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(query.length > 0)}
            placeholder="Find me a modern family home with a big backyard under $500k"
            className={cn(
              "flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
              isLarge ? "text-lg placeholder:text-base" : "text-base placeholder:text-sm",
              "placeholder:text-text-tertiary"
            )}
            disabled={isLoading}
          />

          {/* Loading or Search Button */}
          {isLoading ? (
            <div className="mr-2">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <Button
              type="submit"
              size={isLarge ? "default" : "sm"}
              className="bg-primary hover:bg-primary/90 text-white rounded-full font-semibold shrink-0"
              disabled={!query.trim()}
            >
              <Search className={cn(isLarge ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
              Search
            </Button>
          )}
        </div>

        {/* AI Powered Indicator */}
        <div className="flex items-center justify-center mt-2">
          <Badge variant="secondary" className="text-xs font-normal bg-gradient-to-r from-[#007AFF]/10 to-[#BF5AF2]/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by AI
          </Badge>
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Popular Searches */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              Popular AI Searches
            </h3>
            <div className="space-y-2">
              {POPULAR_SEARCHES.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary group-hover:text-primary transition-colors">
                      {suggestion.query}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {suggestion.count?.toLocaleString()} searches
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="rounded-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Heart className="w-4 h-4 mr-2" />
                Save Search
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      {selectedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {FILTER_PILLS.filter(pill => selectedFilters.includes(pill.id)).map((pill) => (
            <Badge
              key={pill.id}
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => toggleFilter(pill.id)}
            >
              <span className="mr-1">{pill.icon}</span>
              {pill.label}
              <button className="ml-2 hover:text-danger">×</button>
            </Badge>
          ))}
        </div>
      )}

      {/* Quick Filter Pills (Always Visible) */}
      <div className="flex flex-wrap gap-2 mt-4">
        {FILTER_PILLS.map((pill) => (
          <Badge
            key={pill.id}
            variant="outline"
            className={cn(
              "cursor-pointer transition-all duration-200 hover:border-primary hover:text-primary",
              selectedFilters.includes(pill.id)
                ? "bg-primary/10 text-primary border-primary/20"
                : "border-gray-200 text-text-secondary hover:bg-primary/5"
            )}
            onClick={() => toggleFilter(pill.id)}
          >
            <span className="mr-1">{pill.icon}</span>
            {pill.label}
          </Badge>
        ))}
      </div>

      {/* AI Processing Animation */}
      {isLoading && (
        <div className="flex items-center justify-center mt-6 p-4 bg-gradient-to-r from-[#007AFF]/5 to-[#BF5AF2]/5 rounded-2xl">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-[#007AFF] to-[#BF5AF2] rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-8 h-8 bg-gradient-to-r from-[#007AFF] to-[#BF5AF2] rounded-full animate-ping opacity-20"></div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-text-primary">
                AI is analyzing your search...
              </p>
              <p className="text-xs text-text-secondary">
                Finding the perfect properties for you
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}