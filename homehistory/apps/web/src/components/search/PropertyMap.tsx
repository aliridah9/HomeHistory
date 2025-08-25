import * as React from "react"
import { MapPin, Maximize2, Minimize2, Layers, Navigation } from "lucide-react"
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
  homeHistoryScore: number
  latitude: number
  longitude: number
  listingType: 'sale' | 'rent'
}

interface PropertyMapProps {
  properties: Property[]
  selectedProperty?: string
  onPropertySelect: (propertyId: string) => void
  onPropertyHover: (propertyId: string | null) => void
  center?: { lat: number; lng: number }
  zoom?: number
  isFullscreen?: boolean
  onToggleFullscreen: () => void
  className?: string
}

interface MapMarkerProps {
  property: Property
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
  onHover: (hover: boolean) => void
}

// Mock Google Maps implementation for demonstration
// In production, you would use @googlemaps/react-wrapper or similar
function MapMarker({ property, isSelected, isHovered, onClick, onHover }: MapMarkerProps) {
  const getMarkerColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-green-400'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`
    }
    return `$${(price / 1000).toFixed(0)}K`
  }

  return (
    <div
      className="relative cursor-pointer transform transition-all duration-200"
      style={{
        transform: isSelected || isHovered ? 'scale(1.1)' : 'scale(1)',
        zIndex: isSelected ? 1000 : isHovered ? 999 : 1
      }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Price Bubble */}
      <div className={cn(
        "px-2 py-1 rounded-lg text-xs font-bold text-white shadow-lg transition-all duration-200",
        getMarkerColor(property.homeHistoryScore),
        isSelected && "ring-2 ring-white ring-offset-2",
        isHovered && "shadow-xl"
      )}>
        {formatPrice(property.price)}
      </div>
      
      {/* Score Badge */}
      <div className="absolute -top-1 -right-1">
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md",
          getMarkerColor(property.homeHistoryScore)
        )}>
          {property.homeHistoryScore}
        </div>
      </div>

      {/* Property Info Popup */}
      {(isSelected || isHovered) && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50">
          <div className="flex space-x-3">
            <img
              src={property.imageUrl}
              alt={property.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-text-primary text-sm truncate">
                {property.title}
              </h4>
              <p className="text-xs text-text-secondary truncate">
                {property.address}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-text-primary">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0
                  }).format(property.price)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  Score: {property.homeHistoryScore}
                </Badge>
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {property.bedrooms}bd • {property.bathrooms}ba • {property.squareFeet.toLocaleString()}sf
              </div>
            </div>
          </div>
          
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
        </div>
      )}
    </div>
  )
}

interface PropertyClusterProps {
  properties: Property[]
  count: number
  averageScore: number
  onClick: () => void
}

function PropertyCluster({ properties, count, averageScore, onClick }: PropertyClusterProps) {
  const getClusterColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-green-400'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110",
        getClusterColor(averageScore)
      )}
    >
      {count}
    </button>
  )
}

export function PropertyMap({
  properties,
  selectedProperty,
  onPropertySelect,
  onPropertyHover,
  center = { lat: 30.2672, lng: -97.7431 }, // Austin, TX default
  zoom = 12,
  isFullscreen = false,
  onToggleFullscreen,
  className
}: PropertyMapProps) {
  const [mapInstance, setMapInstance] = React.useState<any>(null)
  const [hoveredProperty, setHoveredProperty] = React.useState<string | null>(null)
  const [mapType, setMapType] = React.useState<'roadmap' | 'satellite'>('roadmap')
  const mapRef = React.useRef<HTMLDivElement>(null)

  // Mock map initialization
  React.useEffect(() => {
    if (mapRef.current && typeof window !== 'undefined') {
      // In production, initialize Google Maps here
      // const map = new google.maps.Map(mapRef.current, {
      //   center,
      //   zoom,
      //   mapTypeId: mapType
      // })
      // setMapInstance(map)
      
      // For now, we'll just set a mock instance
      setMapInstance({ center, zoom, mapType })
    }
  }, [center, zoom, mapType])

  // Update map when properties change
  React.useEffect(() => {
    if (mapInstance && properties.length > 0) {
      // In production, update markers here
      // clearMarkers()
      // properties.forEach(property => addMarker(property))
    }
  }, [mapInstance, properties])

  const handlePropertyHover = (propertyId: string | null) => {
    setHoveredProperty(propertyId)
    onPropertyHover(propertyId)
  }

  const handleMarkerClick = (propertyId: string) => {
    onPropertySelect(propertyId)
  }

  const handleClusterClick = (clusterProperties: Property[]) => {
    // Zoom into cluster area
    if (mapInstance && clusterProperties.length > 0) {
      // Calculate bounds and zoom
      // const bounds = new google.maps.LatLngBounds()
      // clusterProperties.forEach(property => {
      //   bounds.extend({ lat: property.latitude, lng: property.longitude })
      // })
      // mapInstance.fitBounds(bounds)
    }
  }

  // Mock clustering logic
  const getClusters = () => {
    // In production, use a proper clustering algorithm
    const clusters = []
    const singleProperties = []
    
    // Simple mock clustering - group properties that are close together
    const processed = new Set()
    
    properties.forEach((property, index) => {
      if (processed.has(property.id)) return
      
      const nearby = properties.filter((p, i) => 
        i !== index && 
        !processed.has(p.id) && 
        Math.abs(p.latitude - property.latitude) < 0.01 && 
        Math.abs(p.longitude - property.longitude) < 0.01
      )
      
      if (nearby.length > 0) {
        const clusterProperties = [property, ...nearby]
        clusters.push({
          id: `cluster-${index}`,
          properties: clusterProperties,
          count: clusterProperties.length,
          averageScore: clusterProperties.reduce((sum, p) => sum + p.homeHistoryScore, 0) / clusterProperties.length,
          center: {
            lat: clusterProperties.reduce((sum, p) => sum + p.latitude, 0) / clusterProperties.length,
            lng: clusterProperties.reduce((sum, p) => sum + p.longitude, 0) / clusterProperties.length
          }
        })
        
        clusterProperties.forEach(p => processed.add(p.id))
      } else {
        singleProperties.push(property)
        processed.add(property.id)
      }
    })
    
    return { clusters, singleProperties }
  }

  const { clusters, singleProperties } = getClusters()

  return (
    <div className={cn(
      "relative bg-gray-100 rounded-lg overflow-hidden",
      isFullscreen ? "fixed inset-0 z-50" : "h-full",
      className
    )}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full relative">
        {/* Mock Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <MapPin className="w-16 h-16 text-primary mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Interactive Property Map
              </h3>
              <p className="text-text-secondary">
                Google Maps integration would display {properties.length} properties here
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-text-secondary">
                  • Property markers color-coded by HomeHistory Score™
                </p>
                <p className="text-sm text-text-secondary">
                  • Clustering for nearby properties
                </p>
                <p className="text-sm text-text-secondary">
                  • Interactive popups with property details
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mock Markers Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Single Property Markers */}
          {singleProperties.map((property) => (
            <div
              key={property.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${20 + (Math.random() * 60)}%`,
                top: `${20 + (Math.random() * 60)}%`
              }}
            >
              <MapMarker
                property={property}
                isSelected={selectedProperty === property.id}
                isHovered={hoveredProperty === property.id}
                onClick={() => handleMarkerClick(property.id)}
                onHover={(hover) => handlePropertyHover(hover ? property.id : null)}
              />
            </div>
          ))}

          {/* Cluster Markers */}
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${20 + (Math.random() * 60)}%`,
                top: `${20 + (Math.random() * 60)}%`
              }}
            >
              <PropertyCluster
                properties={cluster.properties}
                count={cluster.count}
                averageScore={cluster.averageScore}
                onClick={() => handleClusterClick(cluster.properties)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Fullscreen Toggle */}
        <Button
          onClick={onToggleFullscreen}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>

        {/* Map Type Toggle */}
        <Button
          onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <Layers className="w-4 h-4" />
        </Button>

        {/* Center on User Location */}
        <Button
          onClick={() => {
            // In production, get user location and center map
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((position) => {
                // mapInstance.setCenter({
                //   lat: position.coords.latitude,
                //   lng: position.coords.longitude
                // })
              })
            }
          }}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <h4 className="text-sm font-semibold text-text-primary">HomeHistory Score™</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-text-secondary">90+ Excellent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-xs text-text-secondary">80-89 Very Good</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-text-secondary">70-79 Good</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs text-text-secondary">60-69 Fair</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-text-secondary">&lt;60 Needs Attention</span>
          </div>
        </div>
      </div>

      {/* Property Count Badge */}
      <div className="absolute top-4 left-4">
        <Badge className="bg-white text-text-primary border border-gray-200 shadow-lg">
          {properties.length} properties shown
        </Badge>
      </div>

      {/* Close Fullscreen */}
      {isFullscreen && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <Button
            onClick={onToggleFullscreen}
            variant="outline"
            className="bg-white shadow-lg"
          >
            Exit Fullscreen
          </Button>
        </div>
      )}
    </div>
  )
}