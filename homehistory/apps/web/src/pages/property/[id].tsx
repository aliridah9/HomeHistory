import * as React from "react"
import { Helmet } from "react-helmet-async"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PropertyHero } from "@/components/property/PropertyHero"
import { PropertyTabs, PropertyTabType } from "@/components/property/PropertyTabs"
import { PropertySidebar } from "@/components/property/PropertySidebar"
import { OverviewTab } from "@/components/property/tabs/OverviewTab"
import { ReportTab } from "@/components/property/tabs/ReportTab"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useUIStore } from "@/stores/ui.store"
import { usePropertiesStore } from "@/stores/properties.store"
import { Container } from "@/components/layout/Layout"

// Mock property data - in production this would come from the API
const MOCK_PROPERTY = {
  id: '1',
  title: 'Modern Family Home with Pool',
  description: 'Beautiful family home in desirable neighborhood with recent updates and premium finishes throughout.',
  aiDescription: 'This exceptional family home seamlessly blends modern luxury with comfortable living. The open-concept design creates an inviting flow between the gourmet kitchen, featuring quartz countertops and stainless steel appliances, and the spacious living areas perfect for both daily life and entertaining. The private backyard oasis includes a sparkling pool and mature landscaping, providing the perfect retreat. With recent updates including new flooring, fresh paint, and energy-efficient windows, this home represents an outstanding opportunity in one of the area\'s most sought-after neighborhoods.',
  address: '1234 Oak Street',
  city: 'Austin',
  state: 'TX',
  zipCode: '78701',
  price: 485000,
  bedrooms: 4,
  bathrooms: 3,
  squareFeet: 2400,
  lotSize: 8712,
  yearBuilt: 2018,
  propertyType: 'Single Family',
  parkingSpaces: 2,
  stories: 2,
  homeHistoryScore: 92,
  listingType: 'sale' as const,
  daysOnMarket: 5,
  images: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1566908829077-2e3b8c4e4b6d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&h=800&fit=crop'
  ],
  features: {
    pool: true,
    garage: true,
    fireplace: true,
    yard: true,
    deck: true,
    ac: true,
    hardwood: true,
    updated: true
  },
  recentUpdates: [
    { year: 2023, description: 'Kitchen renovation with quartz countertops and new appliances', type: 'renovation' as const },
    { year: 2022, description: 'New hardwood flooring throughout main level', type: 'renovation' as const },
    { year: 2021, description: 'HVAC system replacement with smart thermostat', type: 'repair' as const }
  ],
  permits: [
    { year: 2023, type: 'Kitchen Renovation', description: 'Full kitchen remodel including electrical and plumbing updates', status: 'approved' as const },
    { year: 2021, type: 'HVAC Replacement', description: 'Installation of new central air conditioning system', status: 'approved' as const }
  ],
  priceHistory: [
    { date: '2024-01-15', price: 495000, event: 'listed' as const },
    { date: '2024-02-01', price: 485000, event: 'price_change' as const }
  ],
  agent: {
    name: 'Sarah Johnson',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    phone: '(512) 555-0123',
    email: 'sarah.johnson@realty.com',
    company: 'Austin Premier Realty'
  }
}

const MOCK_SCORE_BREAKDOWN = {
  quality: 95,
  safety: 88,
  value: 92,
  location: 94,
  overall: 92
}

const MOCK_AI_EXPLANATION = "This property receives an exceptional HomeHistory Score™ of 92/100, placing it in the 'Excellent' category. The high score reflects outstanding construction quality with premium materials and recent renovations, excellent safety ratings with no structural concerns, strong market value with 15% appreciation potential over 5 years, and a prime location in a highly desirable neighborhood with top-rated schools and convenient amenities. The recent kitchen renovation and HVAC upgrades demonstrate proper maintenance, while the established neighborhood and proximity to major employers contribute to long-term value stability."

const MOCK_RISK_ASSESSMENT = {
  level: 'low' as const,
  factors: [
    {
      type: 'structural' as const,
      description: 'Recent professional inspection shows excellent structural integrity with no foundation issues or major repairs needed.',
      severity: 'low' as const,
      recommendation: 'Continue routine maintenance and annual inspections to preserve structural quality.'
    },
    {
      type: 'environmental' as const,
      description: 'Property is located in a low-risk flood zone with no history of environmental hazards or contamination.',
      severity: 'low' as const,
      recommendation: 'Maintain adequate insurance coverage and monitor local environmental reports.'
    },
    {
      type: 'financial' as const,
      description: 'Market analysis shows stable property values with consistent appreciation in this neighborhood.',
      severity: 'low' as const,
      recommendation: 'Consider this a sound long-term investment with strong resale potential.'
    }
  ]
}

const MOCK_MAINTENANCE_HISTORY = [
  {
    date: '2023-06-15',
    type: 'upgrade' as const,
    description: 'Kitchen renovation with quartz countertops, new cabinets, and stainless steel appliances',
    cost: 35000,
    contractor: 'Austin Kitchen Design',
    warranty: '5 years on cabinets, 2 years on appliances'
  },
  {
    date: '2022-09-10',
    type: 'maintenance' as const,
    description: 'Annual HVAC service and duct cleaning',
    cost: 450,
    contractor: 'Cool Air Services'
  },
  {
    date: '2021-11-20',
    type: 'repair' as const,
    description: 'HVAC system replacement with high-efficiency unit',
    cost: 8500,
    contractor: 'Austin Heating & Air',
    warranty: '10 years on unit, 2 years on installation'
  }
]

const MOCK_OWNERSHIP_HISTORY = [
  {
    owner: 'Current Owner',
    period: '2018 - Present',
    purchasePrice: 420000,
    duration: '6 years',
    notes: 'Original owner, well-maintained property with regular updates'
  },
  {
    owner: 'Builder - Austin Homes LLC',
    period: '2018',
    salePrice: 420000,
    duration: 'New Construction',
    notes: 'Custom built by reputable local builder'
  }
]

export default function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const { favoriteProperty, unfavoriteProperty, favoritedProperties } = usePropertiesStore()
  
  const [activeTab, setActiveTab] = React.useState<PropertyTabType>('overview')
  const [isLoading, setIsLoading] = React.useState(false)
  const [comparedProperties, setComparedProperties] = React.useState<string[]>([])
  
  const property = MOCK_PROPERTY // In production: fetch from API using id
  const isFavorited = favoritedProperties.includes(property.id)
  const isCompared = comparedProperties.includes(property.id)

  // Simulate loading
  React.useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [id])

  const handleFavorite = () => {
    if (isFavorited) {
      unfavoriteProperty(property.id)
      addNotification({
        type: "info",
        title: "Removed from favorites",
        message: "Property removed from your favorites"
      })
    } else {
      favoriteProperty(property.id)
      addNotification({
        type: "success",
        title: "Added to favorites",
        message: "Property added to your favorites"
      })
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    addNotification({
      type: "success",
      title: "Link copied",
      message: "Property link copied to clipboard"
    })
  }

  const handleCompare = () => {
    if (isCompared) {
      setComparedProperties(prev => prev.filter(id => id !== property.id))
      addNotification({
        type: "info",
        title: "Removed from comparison",
        message: "Property removed from comparison list"
      })
    } else if (comparedProperties.length < 4) {
      setComparedProperties(prev => [...prev, property.id])
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

  const handleContactAgent = async (contactData: any) => {
    addNotification({
      type: "success",
      title: "Message sent",
      message: "Your message has been sent to the agent"
    })
  }

  const handleScheduleTour = () => {
    addNotification({
      type: "success",
      title: "Tour request sent",
      message: "The agent will contact you to schedule a tour"
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-text-secondary">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-2xl font-bold text-text-primary">Property Not Found</h1>
          <p className="text-text-secondary">The property you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/search')} className="rounded-full">
            Back to Search
          </Button>
        </div>
      </div>
    )
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab property={property} />
      case 'report':
        return (
          <ReportTab
            propertyId={property.id}
            scoreBreakdown={MOCK_SCORE_BREAKDOWN}
            aiExplanation={MOCK_AI_EXPLANATION}
            riskAssessment={MOCK_RISK_ASSESSMENT}
            maintenanceHistory={MOCK_MAINTENANCE_HISTORY}
            ownershipHistory={MOCK_OWNERSHIP_HISTORY}
          />
        )
      case 'images':
        return <div className="text-center py-16 text-text-secondary">Images tab coming soon</div>
      case 'neighborhood':
        return <div className="text-center py-16 text-text-secondary">Neighborhood tab coming soon</div>
      case 'score':
        return <div className="text-center py-16 text-text-secondary">Score details tab coming soon</div>
      default:
        return <OverviewTab property={property} />
    }
  }

  return (
    <>
      <Helmet>
        <title>{property.title} - {property.address} | HomeHistory</title>
        <meta name="description" content={`${property.title} in ${property.city}, ${property.state}. ${property.bedrooms} bed, ${property.bathrooms} bath, ${property.squareFeet.toLocaleString()} sq ft. HomeHistory Score™: ${property.homeHistoryScore}/100.`} />
        <meta property="og:title" content={`${property.title} - ${property.address}`} />
        <meta property="og:description" content={property.aiDescription} />
        <meta property="og:image" content={property.images[0]} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200">
          <Container className="py-4">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </Container>
        </div>

        {/* Main Content */}
        <Container className="py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Property Hero */}
              <PropertyHero
                property={property}
                isFavorited={isFavorited}
                onFavorite={handleFavorite}
                onShare={handleShare}
                onContactAgent={handleContactAgent}
              />

              {/* Tabs Navigation */}
              <PropertyTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                reportScore={property.homeHistoryScore}
                imageCount={property.images.length}
              />

              {/* Tab Content */}
              <div className="min-h-[600px]">
                {renderActiveTab()}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <PropertySidebar
                  property={property}
                  isFavorited={isFavorited}
                  isCompared={isCompared}
                  onFavorite={handleFavorite}
                  onShare={handleShare}
                  onCompare={handleCompare}
                  onScheduleTour={handleScheduleTour}
                  onContactAgent={handleContactAgent}
                />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  )
}