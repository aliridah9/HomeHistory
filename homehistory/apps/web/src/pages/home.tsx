import * as React from "react"
import { Helmet } from "react-helmet-async"
import { useNavigate } from "react-router-dom"
import { HeroSection } from "@/components/home/HeroSection"
import { FeaturedProperties } from "@/components/home/FeaturedProperties"
import { useUIStore } from "@/stores/ui.store"
import { usePropertiesStore } from "@/stores/properties.store"

export default function HomePage() {
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const { searchProperties, favoriteProperty, unfavoriteProperty, favoritedProperties } = usePropertiesStore()
  const [isSearchLoading, setIsSearchLoading] = React.useState(false)

  const handleSearch = async (query: string) => {
    setIsSearchLoading(true)
    try {
      // Simulate API call for natural language search
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Navigate to search results with the query
      navigate(`/search?q=${encodeURIComponent(query)}`)
      
      addNotification({
        type: "success",
        title: "Search completed",
        message: `Found properties matching "${query}"`
      })
    } catch (error) {
      addNotification({
        type: "error",
        title: "Search failed",
        message: "There was an error processing your search. Please try again."
      })
    } finally {
      setIsSearchLoading(false)
    }
  }

  const handleGetStarted = () => {
    navigate('/auth/register')
  }

  const handlePropertyFavorite = (propertyId: string) => {
    if (favoritedProperties.includes(propertyId)) {
      unfavoriteProperty(propertyId)
      addNotification({
        type: "info",
        title: "Removed from favorites",
        message: "Property removed from your favorites list."
      })
    } else {
      favoriteProperty(propertyId)
      addNotification({
        type: "success",
        title: "Added to favorites",
        message: "Property added to your favorites list."
      })
    }
  }

  const handlePropertyView = (propertyId: string) => {
    navigate(`/property/${propertyId}`)
  }

  const handleViewAllProperties = () => {
    navigate('/properties')
  }

  return (
    <>
      <Helmet>
        <title>HomeHistory - The Carfax for Real Estate</title>
        <meta name="description" content="Discover your perfect home with AI-powered intelligence. Get comprehensive property reports, HomeHistory Scores, and verified data from thousands of sources." />
        <meta name="keywords" content="real estate, property search, home buying, AI-powered, property reports, HomeHistory Score" />
        
        {/* Open Graph */}
        <meta property="og:title" content="HomeHistory - The Carfax for Real Estate" />
        <meta property="og:description" content="Discover your perfect home with AI-powered intelligence. Get comprehensive property reports and verified data." />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="HomeHistory - The Carfax for Real Estate" />
        <meta name="twitter:description" content="Discover your perfect home with AI-powered intelligence." />
      </Helmet>
      
      <div className="min-h-screen">
        {/* Hero Section with AI Search */}
        <HeroSection
          onSearch={handleSearch}
          onGetStarted={handleGetStarted}
          isSearchLoading={isSearchLoading}
        />

        {/* Featured Properties */}
        <FeaturedProperties
          onPropertyFavorite={handlePropertyFavorite}
          onPropertyView={handlePropertyView}
          onViewAll={handleViewAllProperties}
          favoritedProperties={favoritedProperties}
        />

        {/* Additional sections can be added here */}
        {/* - How It Works */}
        {/* - Customer Testimonials */}
        {/* - Recent Market Insights */}
        {/* - Footer CTA */}
      </div>
    </>
  )
}