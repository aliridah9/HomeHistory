import * as React from "react"
import { Filter, X, ChevronDown, ChevronUp, Sparkles, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FilterRange {
  min: number
  max: number
}

interface SearchFilters {
  priceRange: FilterRange
  propertyTypes: string[]
  bedrooms: number | null
  bathrooms: number | null
  squareFootage: FilterRange
  lotSize: FilterRange
  homeHistoryScore: FilterRange
  yearBuilt: FilterRange
  features: string[]
  amenities: string[]
  schoolRating: number | null
  keywords: string[]
}

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onClearAll: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

const PROPERTY_TYPES = [
  { id: 'house', label: 'House', icon: '🏠' },
  { id: 'condo', label: 'Condo', icon: '🏢' },
  { id: 'townhouse', label: 'Townhouse', icon: '🏘️' },
  { id: 'apartment', label: 'Apartment', icon: '🏬' },
  { id: 'land', label: 'Land', icon: '🌍' },
  { id: 'commercial', label: 'Commercial', icon: '🏭' }
]

const FEATURES = [
  { id: 'pool', label: 'Pool', icon: '🏊' },
  { id: 'garage', label: 'Garage', icon: '🚗' },
  { id: 'fireplace', label: 'Fireplace', icon: '🔥' },
  { id: 'yard', label: 'Yard', icon: '🌳' },
  { id: 'deck', label: 'Deck/Patio', icon: '🪴' },
  { id: 'basement', label: 'Basement', icon: '🏠' },
  { id: 'ac', label: 'Air Conditioning', icon: '❄️' },
  { id: 'hardwood', label: 'Hardwood Floors', icon: '🪵' },
  { id: 'updated', label: 'Recently Updated', icon: '✨' },
  { id: 'new', label: 'New Construction', icon: '🆕' }
]

const AMENITIES = [
  { id: 'walkable', label: 'Walkable', icon: '🚶' },
  { id: 'transit', label: 'Public Transit', icon: '🚌' },
  { id: 'shopping', label: 'Shopping Nearby', icon: '🛍️' },
  { id: 'restaurants', label: 'Restaurants', icon: '🍽️' },
  { id: 'parks', label: 'Parks & Recreation', icon: '🏞️' },
  { id: 'schools', label: 'Top Schools', icon: '🎓' },
  { id: 'gym', label: 'Gym/Fitness', icon: '💪' },
  { id: 'hospital', label: 'Hospital Nearby', icon: '🏥' }
]

const BEDROOM_OPTIONS = [
  { value: null, label: 'Any' },
  { value: 1, label: '1+' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 5, label: '5+' }
]

const BATHROOM_OPTIONS = [
  { value: null, label: 'Any' },
  { value: 1, label: '1+' },
  { value: 1.5, label: '1.5+' },
  { value: 2, label: '2+' },
  { value: 2.5, label: '2.5+' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' }
]

const SCHOOL_RATINGS = [
  { value: null, label: 'Any Rating' },
  { value: 7, label: '7+ (Good)' },
  { value: 8, label: '8+ (Very Good)' },
  { value: 9, label: '9+ (Excellent)' },
  { value: 10, label: '10 (Outstanding)' }
]

interface RangeSliderProps {
  min: number
  max: number
  value: FilterRange
  onChange: (value: FilterRange) => void
  step?: number
  formatValue?: (value: number) => string
  className?: string
}

function RangeSlider({ min, max, value, onChange, step = 1, formatValue = (v) => v.toString(), className }: RangeSliderProps) {
  const [localMin, setLocalMin] = React.useState(value.min)
  const [localMax, setLocalMax] = React.useState(value.max)

  React.useEffect(() => {
    setLocalMin(value.min)
    setLocalMax(value.max)
  }, [value])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localMax)
    setLocalMin(newMin)
    onChange({ min: newMin, max: localMax })
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localMin)
    setLocalMax(newMax)
    onChange({ min: localMin, max: newMax })
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          value={localMin}
          onChange={handleMinChange}
          placeholder="Min"
          className="w-20 h-8 text-xs"
          min={min}
          max={max}
          step={step}
        />
        <span className="text-text-tertiary">to</span>
        <Input
          type="number"
          value={localMax}
          onChange={handleMaxChange}
          placeholder="Max"
          className="w-20 h-8 text-xs"
          min={min}
          max={max}
          step={step}
        />
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={handleMinChange}
          step={step}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={handleMaxChange}
          step={step}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
        />
      </div>
      <div className="flex justify-between text-xs text-text-tertiary">
        <span>{formatValue(localMin)}</span>
        <span>{formatValue(localMax)}</span>
      </div>
    </div>
  )
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  isCollapsible?: boolean
  defaultExpanded?: boolean
  icon?: React.ElementType
}

function FilterSection({ title, children, isCollapsible = false, defaultExpanded = true, icon: Icon }: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  return (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center justify-between w-full text-left mb-3",
          isCollapsible && "hover:text-primary transition-colors"
        )}
      >
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-text-secondary" />}
          <h3 className="font-semibold text-text-primary">{title}</h3>
        </div>
        {isCollapsible && (
          <ChevronDown className={cn(
            "w-4 h-4 text-text-secondary transition-transform",
            isExpanded && "transform rotate-180"
          )} />
        )}
      </button>
      
      {(!isCollapsible || isExpanded) && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

export function SearchFilters({
  filters,
  onFiltersChange,
  onClearAll,
  isCollapsed = false,
  onToggleCollapse,
  className
}: SearchFiltersProps) {
  const [aiSuggestions, setAiSuggestions] = React.useState<string[]>([])

  // AI-suggested filters based on search behavior
  React.useEffect(() => {
    const suggestions = ['Modern Kitchen', 'Walk-in Closet', 'Open Floor Plan', 'Master Suite']
    setAiSuggestions(suggestions)
  }, [filters])

  const updateFilters = (updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const togglePropertyType = (type: string) => {
    const newTypes = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter(t => t !== type)
      : [...filters.propertyTypes, type]
    updateFilters({ propertyTypes: newTypes })
  }

  const toggleFeature = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter(f => f !== feature)
      : [...filters.features, feature]
    updateFilters({ features: newFeatures })
  }

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity]
    updateFilters({ amenities: newAmenities })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatSqft = (sqft: number) => `${sqft.toLocaleString()} sq ft`
  const formatAcres = (acres: number) => `${acres} acres`

  if (isCollapsed) {
    return (
      <div className={cn("p-4", className)}>
        <Button
          onClick={onToggleCollapse}
          variant="outline"
          className="w-full justify-center"
        >
          <Filter className="w-4 h-4 mr-2" />
          Show Filters
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("bg-white border-r border-gray-200 h-full overflow-y-auto", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-text-primary flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onClearAll}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear All
            </Button>
            {onToggleCollapse && (
              <Button
                onClick={onToggleCollapse}
                variant="outline"
                size="sm"
                className="lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">AI Suggested</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {aiSuggestions.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/30"
                  onClick={() => updateFilters({ keywords: [...filters.keywords, suggestion] })}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Sections */}
      <div className="p-4 space-y-6">
        {/* Price Range */}
        <FilterSection title="Price Range">
          <RangeSlider
            min={0}
            max={2000000}
            step={25000}
            value={filters.priceRange}
            onChange={(priceRange) => updateFilters({ priceRange })}
            formatValue={formatPrice}
          />
        </FilterSection>

        {/* Property Type */}
        <FilterSection title="Property Type">
          <div className="grid grid-cols-2 gap-2">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => togglePropertyType(type.id)}
                className={cn(
                  "flex items-center space-x-2 p-2 rounded-lg border text-sm transition-colors",
                  filters.propertyTypes.includes(type.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Bedrooms & Bathrooms */}
        <FilterSection title="Beds & Baths">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Bedrooms</label>
              <select
                value={filters.bedrooms || ''}
                onChange={(e) => updateFilters({ bedrooms: e.target.value ? Number(e.target.value) : null })}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              >
                {BEDROOM_OPTIONS.map((option) => (
                  <option key={option.value || 'any'} value={option.value || ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Bathrooms</label>
              <select
                value={filters.bathrooms || ''}
                onChange={(e) => updateFilters({ bathrooms: e.target.value ? Number(e.target.value) : null })}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              >
                {BATHROOM_OPTIONS.map((option) => (
                  <option key={option.value || 'any'} value={option.value || ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FilterSection>

        {/* Square Footage */}
        <FilterSection title="Square Footage">
          <RangeSlider
            min={500}
            max={10000}
            step={100}
            value={filters.squareFootage}
            onChange={(squareFootage) => updateFilters({ squareFootage })}
            formatValue={formatSqft}
          />
        </FilterSection>

        {/* Lot Size */}
        <FilterSection title="Lot Size">
          <RangeSlider
            min={0.1}
            max={5}
            step={0.1}
            value={filters.lotSize}
            onChange={(lotSize) => updateFilters({ lotSize })}
            formatValue={formatAcres}
          />
        </FilterSection>

        {/* HomeHistory Score */}
        <FilterSection title="HomeHistory Score™" icon={Sparkles}>
          <RangeSlider
            min={0}
            max={100}
            step={5}
            value={filters.homeHistoryScore}
            onChange={(homeHistoryScore) => updateFilters({ homeHistoryScore })}
            formatValue={(v) => `${v}/100`}
          />
        </FilterSection>

        {/* Year Built */}
        <FilterSection title="Year Built">
          <RangeSlider
            min={1900}
            max={new Date().getFullYear()}
            step={5}
            value={filters.yearBuilt}
            onChange={(yearBuilt) => updateFilters({ yearBuilt })}
          />
        </FilterSection>

        {/* Features */}
        <FilterSection title="Features" isCollapsible defaultExpanded={false}>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((feature) => (
              <button
                key={feature.id}
                onClick={() => toggleFeature(feature.id)}
                className={cn(
                  "flex items-center space-x-2 p-2 rounded-lg border text-sm transition-colors",
                  filters.features.includes(feature.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span>{feature.icon}</span>
                <span className="text-xs">{feature.label}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Neighborhood Amenities */}
        <FilterSection title="Neighborhood" isCollapsible defaultExpanded={false}>
          <div className="grid grid-cols-2 gap-2">
            {AMENITIES.map((amenity) => (
              <button
                key={amenity.id}
                onClick={() => toggleAmenity(amenity.id)}
                className={cn(
                  "flex items-center space-x-2 p-2 rounded-lg border text-sm transition-colors",
                  filters.amenities.includes(amenity.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span>{amenity.icon}</span>
                <span className="text-xs">{amenity.label}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* School Rating */}
        <FilterSection title="School Rating">
          <select
            value={filters.schoolRating || ''}
            onChange={(e) => updateFilters({ schoolRating: e.target.value ? Number(e.target.value) : null })}
            className="w-full p-2 border border-gray-200 rounded-lg text-sm"
          >
            {SCHOOL_RATINGS.map((rating) => (
              <option key={rating.value || 'any'} value={rating.value || ''}>
                {rating.label}
              </option>
            ))}
          </select>
        </FilterSection>
      </div>
    </div>
  )
}