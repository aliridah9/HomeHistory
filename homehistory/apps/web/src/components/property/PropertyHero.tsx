import * as React from "react"
import { Heart, Share2, ChevronLeft, ChevronRight, X, Maximize2, MapPin, Calendar, Ruler, Home } from "lucide-react"
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
  lotSize: number
  yearBuilt: number
  homeHistoryScore: number
  images: string[]
  listingType: 'sale' | 'rent'
  daysOnMarket: number
  priceHistory?: {
    originalPrice: number
    reductions: number
  }
}

interface PropertyHeroProps {
  property: Property
  isFavorited: boolean
  onFavorite: () => void
  onShare: () => void
  onContactAgent: () => void
  className?: string
}

interface ImageGalleryProps {
  images: string[]
  title: string
  onImageClick: (index: number) => void
}

function ImageGallery({ images, title, onImageClick }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[16/10] bg-gray-200 rounded-2xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Home className="w-16 h-16 mx-auto mb-4" />
          <p>No images available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group">
      {/* Main Image */}
      <div className="aspect-[16/10] relative overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
          onClick={() => onImageClick(currentIndex)}
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* View All Photos Button */}
        <button
          onClick={() => onImageClick(0)}
          className="absolute bottom-4 left-4 bg-white/90 hover:bg-white px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Maximize2 className="w-4 h-4" />
          <span>View All {images.length} Photos</span>
        </button>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
          {images.slice(0, 6).map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200",
                index === currentIndex
                  ? "border-primary shadow-md"
                  : "border-transparent hover:border-gray-300"
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {images.length > 6 && (
            <button
              onClick={() => onImageClick(6)}
              className="flex-shrink-0 w-20 h-16 rounded-lg bg-gray-100 border-2 border-transparent hover:border-gray-300 flex items-center justify-center text-sm font-medium text-gray-600"
            >
              +{images.length - 6}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const getScoreColor = (score: number) => {
  if (score >= 90) return { bg: 'bg-green-500', text: 'text-green-500', label: 'Excellent' }
  if (score >= 80) return { bg: 'bg-green-400', text: 'text-green-400', label: 'Very Good' }
  if (score >= 70) return { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Good' }
  if (score >= 60) return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Fair' }
  return { bg: 'bg-red-500', text: 'text-red-500', label: 'Needs Attention' }
}

const formatPrice = (price: number, type: 'sale' | 'rent') => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
  
  return type === 'rent' ? `${formatted}/mo` : formatted
}

export function PropertyHero({
  property,
  isFavorited,
  onFavorite,
  onShare,
  onContactAgent,
  className
}: PropertyHeroProps) {
  const [showLightbox, setShowLightbox] = React.useState(false)
  const [lightboxIndex, setLightboxIndex] = React.useState(0)

  const scoreColor = getScoreColor(property.homeHistoryScore)

  const handleImageClick = (index: number) => {
    setLightboxIndex(index)
    setShowLightbox(true)
  }

  const closeLightbox = () => {
    setShowLightbox(false)
  }

  const nextLightboxImage = () => {
    setLightboxIndex((prev) => (prev + 1) % property.images.length)
  }

  const prevLightboxImage = () => {
    setLightboxIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
  }

  return (
    <>
      <div className={cn("space-y-6", className)}>
        {/* Property Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left Side - Property Info */}
          <div className="space-y-4">
            {/* Price and Status */}
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary">
                {formatPrice(property.price, property.listingType)}
              </h1>
              
              {property.priceHistory?.reductions && property.priceHistory.reductions > 0 && (
                <Badge className="bg-green-500 text-white">
                  Price Reduced
                </Badge>
              )}
              
              <Badge variant="outline" className="text-text-secondary">
                {property.daysOnMarket} days on market
              </Badge>
            </div>

            {/* Address */}
            <div className="flex items-center text-lg text-text-secondary">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{property.address}, {property.city}, {property.state} {property.zipCode}</span>
            </div>

            {/* Property Stats */}
            <div className="flex flex-wrap items-center gap-6 text-text-secondary">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5" />
                <span className="font-medium">{property.bedrooms} bed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5" />
                <span className="font-medium">{property.bathrooms} bath</span>
              </div>
              <div className="flex items-center space-x-2">
                <Ruler className="w-5 h-5" />
                <span className="font-medium">{property.squareFeet.toLocaleString()} sq ft</span>
              </div>
              <div className="flex items-center space-x-2">
                <Ruler className="w-5 h-5" />
                <span className="font-medium">{property.lotSize.toLocaleString()} sq ft lot</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Built {property.yearBuilt}</span>
              </div>
            </div>
          </div>

          {/* Right Side - HomeHistory Score & Actions */}
          <div className="flex flex-col items-end space-y-4">
            {/* HomeHistory Score */}
            <div className="text-center">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg mb-2",
                scoreColor.bg
              )}>
                {property.homeHistoryScore}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-primary">HomeHistory Score™</p>
                <p className={cn("text-xs font-medium", scoreColor.text)}>
                  {scoreColor.label}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={onFavorite}
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full",
                  isFavorited && "border-red-500 text-red-500 hover:bg-red-50"
                )}
              >
                <Heart className={cn("w-4 h-4 mr-2", isFavorited && "fill-current")} />
                {isFavorited ? 'Saved' : 'Save'}
              </Button>
              
              <Button
                onClick={onShare}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              <Button
                onClick={onContactAgent}
                className="bg-primary hover:bg-primary/90 text-white rounded-full font-semibold"
              >
                Contact Agent
              </Button>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <ImageGallery
          images={property.images}
          title={property.title}
          onImageClick={handleImageClick}
        />
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors duration-200 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation Arrows */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevLightboxImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors duration-200"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextLightboxImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors duration-200"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="max-w-5xl max-h-full">
              <img
                src={property.images[lightboxIndex]}
                alt={`${property.title} - Image ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {lightboxIndex + 1} of {property.images.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}