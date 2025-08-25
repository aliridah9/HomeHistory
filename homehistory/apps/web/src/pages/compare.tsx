import * as React from "react"
import { Helmet } from "react-helmet-async"
import { useSearchParams, useNavigate } from "react-router-dom"
import { X, Plus, Download, Share2, ArrowLeft, BarChart3, Sparkles, MapPin, GraduationCap, Car, TrendingUp, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Container } from "@/components/layout/Layout"
import { useUIStore } from "@/stores/ui.store"
import { usePropertiesStore } from "@/stores/properties.store"
import { cn } from "@/lib/utils"

interface Property {
  id: string
  title: string
  address: string
  city: string
  state: string
  price: number
  bedrooms: number
  bathrooms: number
  squareFeet: number
  lotSize: number
  yearBuilt: number
  homeHistoryScore: number
  scoreBreakdown: {
    quality: number
    safety: number
    value: number
    location: number
  }
  imageUrl: string
  features: {
    pool?: boolean
    garage?: boolean
    fireplace?: boolean
    yard?: boolean
    updated?: boolean
  }
  neighborhood: {
    walkScore: number
    schoolRating: number
    crimeRate: 'low' | 'medium' | 'high'
    commuteTime: number
  }
  investment: {
    appreciation: number
    rentYield: number
    cashFlow: number
  }
  maintenance: {
    recentUpdates: number
    avgAnnualCost: number
    lastMajorRepair: string
  }
  listingType: 'sale' | 'rent'
}

interface PropertyComparisonCardProps {
  property: Property | null
  onRemove?: () => void
  onAdd?: () => void
  className?: string
}

function PropertyComparisonCard({ property, onRemove, onAdd, className }: PropertyComparisonCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-green-400'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatPrice = (price: number, type: 'sale' | 'rent') => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)
    return type === 'rent' ? `${formatted}/mo` : formatted
  }

  if (!property) {
    return (
      <div className={cn(
        "bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-primary transition-colors duration-200",
        className
      )}>
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Add Property</h3>
            <p className="text-text-secondary text-sm">
              Click to add a property for comparison
            </p>
          </div>
          <Button onClick={onAdd} variant="outline" className="rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden", className)}>
      {/* Remove Button */}
      {onRemove && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onRemove}
            className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Property Image */}
      <div className="relative h-48">
        <img
          src={property.imageUrl}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        
        {/* HomeHistory Score Badge */}
        <div className="absolute top-4 left-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg",
            getScoreColor(property.homeHistoryScore)
          )}>
            {property.homeHistoryScore}
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-6 space-y-4">
        {/* Price and Title */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-1">
            {formatPrice(property.price, property.listingType)}
          </h3>
          <p className="text-text-secondary text-sm truncate">{property.title}</p>
        </div>

        {/* Address */}
        <div className="flex items-center text-text-secondary">
          <MapPin className="w-4 h-4 mr-2 shrink-0" />
          <span className="text-sm truncate">
            {property.address}, {property.city}, {property.state}
          </span>
        </div>

        {/* Basic Stats */}
        <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-100">
          <div className="text-center">
            <div className="font-semibold text-text-primary">{property.bedrooms}</div>
            <div className="text-xs text-text-secondary">Beds</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-text-primary">{property.bathrooms}</div>
            <div className="text-xs text-text-secondary">Baths</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-text-primary">{property.squareFeet.toLocaleString()}</div>
            <div className="text-xs text-text-secondary">Sq Ft</div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Quality</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className={cn("h-2 rounded-full", getScoreColor(property.scoreBreakdown.quality))}
                  style={{ width: `${property.scoreBreakdown.quality}%` }}
                />
              </div>
              <span className="font-medium text-text-primary w-8">{property.scoreBreakdown.quality}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Safety</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className={cn("h-2 rounded-full", getScoreColor(property.scoreBreakdown.safety))}
                  style={{ width: `${property.scoreBreakdown.safety}%` }}
                />
              </div>
              <span className="font-medium text-text-primary w-8">{property.scoreBreakdown.safety}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Value</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className={cn("h-2 rounded-full", getScoreColor(property.scoreBreakdown.value))}
                  style={{ width: `${property.scoreBreakdown.value}%` }}
                />
              </div>
              <span className="font-medium text-text-primary w-8">{property.scoreBreakdown.value}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Location</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className={cn("h-2 rounded-full", getScoreColor(property.scoreBreakdown.location))}
                  style={{ width: `${property.scoreBreakdown.location}%` }}
                />
              </div>
              <span className="font-medium text-text-primary w-8">{property.scoreBreakdown.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ComparisonTableProps {
  properties: (Property | null)[]
}

function ComparisonTable({ properties }: ComparisonTableProps) {
  const validProperties = properties.filter(Boolean) as Property[]
  
  if (validProperties.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Add More Properties
        </h3>
        <p className="text-text-secondary">
          Add at least 2 properties to see a detailed comparison table
        </p>
      </div>
    )
  }

  const comparisonData = [
    {
      category: "Basic Information",
      rows: [
        { label: "Price", values: validProperties.map(p => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(p.price)) },
        { label: "Bedrooms", values: validProperties.map(p => p.bedrooms.toString()) },
        { label: "Bathrooms", values: validProperties.map(p => p.bathrooms.toString()) },
        { label: "Square Feet", values: validProperties.map(p => p.squareFeet.toLocaleString()) },
        { label: "Lot Size", values: validProperties.map(p => p.lotSize.toLocaleString() + " sq ft") },
        { label: "Year Built", values: validProperties.map(p => p.yearBuilt.toString()) },
      ]
    },
    {
      category: "HomeHistory Scores",
      rows: [
        { label: "Overall Score", values: validProperties.map(p => p.homeHistoryScore.toString()) },
        { label: "Quality", values: validProperties.map(p => p.scoreBreakdown.quality.toString()) },
        { label: "Safety", values: validProperties.map(p => p.scoreBreakdown.safety.toString()) },
        { label: "Value", values: validProperties.map(p => p.scoreBreakdown.value.toString()) },
        { label: "Location", values: validProperties.map(p => p.scoreBreakdown.location.toString()) },
      ]
    },
    {
      category: "Neighborhood",
      rows: [
        { label: "Walk Score", values: validProperties.map(p => p.neighborhood.walkScore.toString()) },
        { label: "School Rating", values: validProperties.map(p => p.neighborhood.schoolRating + "/10") },
        { label: "Crime Rate", values: validProperties.map(p => p.neighborhood.crimeRate) },
        { label: "Commute Time", values: validProperties.map(p => p.neighborhood.commuteTime + " min") },
      ]
    },
    {
      category: "Investment Potential",
      rows: [
        { label: "Appreciation", values: validProperties.map(p => p.investment.appreciation + "%") },
        { label: "Rent Yield", values: validProperties.map(p => p.investment.rentYield + "%") },
        { label: "Cash Flow", values: validProperties.map(p => "$" + p.investment.cashFlow.toLocaleString()) },
      ]
    },
    {
      category: "Maintenance",
      rows: [
        { label: "Recent Updates", values: validProperties.map(p => p.maintenance.recentUpdates.toString()) },
        { label: "Avg Annual Cost", values: validProperties.map(p => "$" + p.maintenance.avgAnnualCost.toLocaleString()) },
        { label: "Last Major Repair", values: validProperties.map(p => p.maintenance.lastMajorRepair) },
      ]
    }
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-text-primary">Detailed Comparison</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 font-medium text-text-secondary">Feature</th>
              {validProperties.map((property, index) => (
                <th key={property.id} className="text-center p-4 font-medium text-text-secondary min-w-[200px]">
                  Property {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((category) => (
              <React.Fragment key={category.category}>
                <tr className="bg-gray-50">
                  <td colSpan={validProperties.length + 1} className="p-4 font-semibold text-text-primary">
                    {category.category}
                  </td>
                </tr>
                {category.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-text-secondary">{row.label}</td>
                    {row.values.map((value, valueIndex) => (
                      <td key={valueIndex} className="p-4 text-center font-medium text-text-primary">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Mock properties data
const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern Family Home',
    address: '1234 Oak Street',
    city: 'Austin',
    state: 'TX',
    price: 485000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2400,
    lotSize: 8712,
    yearBuilt: 2018,
    homeHistoryScore: 92,
    scoreBreakdown: { quality: 95, safety: 88, value: 92, location: 94 },
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    features: { pool: true, garage: true, yard: true, updated: true },
    neighborhood: { walkScore: 85, schoolRating: 9, crimeRate: 'low', commuteTime: 25 },
    investment: { appreciation: 15, rentYield: 4.2, cashFlow: 1200 },
    maintenance: { recentUpdates: 3, avgAnnualCost: 2500, lastMajorRepair: '2021' },
    listingType: 'sale'
  },
  {
    id: '2',
    title: 'Downtown Luxury Condo',
    address: '567 Main Avenue',
    city: 'Austin',
    state: 'TX',
    price: 325000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    lotSize: 0,
    yearBuilt: 2020,
    homeHistoryScore: 88,
    scoreBreakdown: { quality: 90, safety: 85, value: 88, location: 90 },
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    features: { garage: true, updated: true },
    neighborhood: { walkScore: 95, schoolRating: 8, crimeRate: 'low', commuteTime: 15 },
    investment: { appreciation: 12, rentYield: 5.1, cashFlow: 800 },
    maintenance: { recentUpdates: 1, avgAnnualCost: 1800, lastMajorRepair: 'N/A' },
    listingType: 'sale'
  }
]

export default function ComparePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  
  const [comparedProperties, setComparedProperties] = React.useState<(Property | null)[]>([null, null, null, null])
  const [isLoading, setIsLoading] = React.useState(false)

  // Initialize from URL params
  React.useEffect(() => {
    const ids = searchParams.get('ids')?.split(',') || []
    if (ids.length > 0) {
      setIsLoading(true)
      // Simulate loading properties
      setTimeout(() => {
        const newProperties: (Property | null)[] = [null, null, null, null]
        ids.forEach((id, index) => {
          if (index < 4) {
            const property = MOCK_PROPERTIES.find(p => p.id === id)
            if (property) {
              newProperties[index] = property
            }
          }
        })
        setComparedProperties(newProperties)
        setIsLoading(false)
      }, 1000)
    }
  }, [searchParams])

  const handleAddProperty = (index: number) => {
    // In production, this would open a property search modal
    const availableProperty = MOCK_PROPERTIES.find(p => 
      !comparedProperties.some(cp => cp?.id === p.id)
    )
    
    if (availableProperty) {
      const newProperties = [...comparedProperties]
      newProperties[index] = availableProperty
      setComparedProperties(newProperties)
      
      addNotification({
        type: "success",
        title: "Property added",
        message: "Property added to comparison"
      })
    }
  }

  const handleRemoveProperty = (index: number) => {
    const newProperties = [...comparedProperties]
    newProperties[index] = null
    setComparedProperties(newProperties)
    
    addNotification({
      type: "info",
      title: "Property removed",
      message: "Property removed from comparison"
    })
  }

  const handleExportPDF = () => {
    addNotification({
      type: "success",
      title: "PDF exported",
      message: "Comparison exported to PDF"
    })
  }

  const handleShare = () => {
    const validProperties = comparedProperties.filter(Boolean)
    const ids = validProperties.map(p => p!.id).join(',')
    const url = `${window.location.origin}/compare?ids=${ids}`
    navigator.clipboard.writeText(url)
    
    addNotification({
      type: "success",
      title: "Link copied",
      message: "Comparison link copied to clipboard"
    })
  }

  const validPropertiesCount = comparedProperties.filter(Boolean).length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-text-secondary">Loading property comparison...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Property Comparison | HomeHistory</title>
        <meta name="description" content="Compare up to 4 properties side-by-side with HomeHistory Scores, features, and detailed analysis." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <Container className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="rounded-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Property Comparison</h1>
                  <p className="text-text-secondary">
                    {validPropertiesCount === 0 
                      ? "Add properties to start comparing"
                      : `Comparing ${validPropertiesCount} ${validPropertiesCount === 1 ? 'property' : 'properties'}`
                    }
                  </p>
                </div>
              </div>

              {validPropertiesCount > 0 && (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                  
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              )}
            </div>
          </Container>
        </div>

        {/* Main Content */}
        <Container className="py-8 space-y-8">
          {/* Property Cards */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {comparedProperties.map((property, index) => (
              <div key={index} className="relative">
                <PropertyComparisonCard
                  property={property}
                  onAdd={() => handleAddProperty(index)}
                  onRemove={property ? () => handleRemoveProperty(index) : undefined}
                />
              </div>
            ))}
          </div>

          {/* AI Insights */}
          {validPropertiesCount > 1 && (
            <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-text-primary">AI Comparison Insights</h2>
                <Badge className="bg-primary text-white text-xs">Powered by AI</Badge>
              </div>
              
              <p className="text-text-primary leading-relaxed">
                Based on your comparison, the Modern Family Home offers the best overall value with a HomeHistory Score™ of 92/100 
                and strong investment potential. The Downtown Luxury Condo provides excellent walkability and lower maintenance costs, 
                making it ideal for urban professionals. Consider your lifestyle preferences and investment goals when making your decision.
              </p>
            </div>
          )}

          {/* Comparison Table */}
          <ComparisonTable properties={comparedProperties} />

          {/* Help Text */}
          {validPropertiesCount === 0 && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <BarChart3 className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    Start Your Comparison
                  </h3>
                  <p className="text-text-secondary">
                    Add properties to compare their features, scores, and investment potential side-by-side.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/search')}
                  className="bg-primary hover:bg-primary/90 text-white rounded-full font-semibold px-8"
                >
                  Browse Properties
                </Button>
              </div>
            </div>
          )}
        </Container>
      </div>
    </>
  )
}