import * as React from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { Heart, Share2, Trash2, Filter, SortAsc, Grid, List, MapPin, Bed, Bath, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout/Layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { favoritesApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface FavoriteProperty {
  id: string
  propertyId: string
  address: string
  city: string
  state: string
  zipCode: string
  price: number
  beds: number
  baths: number
  sqft: number
  propertyType: string
  image: string
  homeHistoryScore: number
  notes?: string
  tags: string[]
  savedAt: string
  priceChange?: {
    amount: number
    direction: 'up' | 'down'
    date: string
  }
}

type ViewMode = 'grid' | 'list'
type SortOption = 'recent' | 'price-low' | 'price-high' | 'score'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = React.useState<FavoriteProperty[]>([])
  const [filteredFavorites, setFilteredFavorites] = React.useState<FavoriteProperty[]>([])
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
  const [sortBy, setSortBy] = React.useState<SortOption>('recent')
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [allTags, setAllTags] = React.useState<string[]>([])

  React.useEffect(() => {
    fetchFavorites()
  }, [])

  React.useEffect(() => {
    let filtered = [...favorites]

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(fav => 
        selectedTags.some(tag => fav.tags.includes(tag))
      )
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => 
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        )
        break
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'score':
        filtered.sort((a, b) => b.homeHistoryScore - a.homeHistoryScore)
        break
    }

    setFilteredFavorites(filtered)
  }, [favorites, selectedTags, sortBy])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const response = await favoritesApi.getFavorites()
      const favs = response.data || []
      setFavorites(favs)
      
      // Extract all unique tags
      const tags = Array.from(new Set(favs.flatMap((f: FavoriteProperty) => f.tags)))
      setAllTags(tags)
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
      // Mock data for development
      const mockFavorites: FavoriteProperty[] = [
        {
          id: '1',
          propertyId: 'prop-1',
          address: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          price: 1200000,
          beds: 3,
          baths: 2,
          sqft: 1800,
          propertyType: 'Single Family',
          image: '/images/property-1.jpg',
          homeHistoryScore: 87,
          notes: 'Love the kitchen and backyard!',
          tags: ['top-choice', 'great-location'],
          savedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
          priceChange: {
            amount: -50000,
            direction: 'down',
            date: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
          }
        },
        {
          id: '2',
          propertyId: 'prop-2',
          address: '456 Oak Avenue',
          city: 'Oakland',
          state: 'CA',
          zipCode: '94601',
          price: 850000,
          beds: 2,
          baths: 2,
          sqft: 1200,
          propertyType: 'Condo',
          image: '/images/property-2.jpg',
          homeHistoryScore: 82,
          tags: ['backup-option'],
          savedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
        }
      ]
      setFavorites(mockFavorites)
      setAllTags(['top-choice', 'great-location', 'backup-option'])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (favoriteId: string) => {
    if (!confirm('Remove this property from your favorites?')) return

    try {
      await favoritesApi.removeFavorite(favoriteId)
      setFavorites(favorites.filter(f => f.id !== favoriteId))
    } catch (err) {
      console.error('Failed to remove favorite:', err)
    }
  }

  const handleShareFavorites = () => {
    // TODO: Implement share functionality
    alert('Share functionality coming soon!')
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-text-secondary">Loading favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Favorites | HomeHistory</title>
        <meta name="description" content="Your favorite properties and saved homes" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Container className="py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Favorites ({favorites.length})
                </h1>
                <p className="text-text-secondary mt-1">
                  Properties you've saved for later
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleShareFavorites}
                className="rounded-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share List
              </Button>
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-text-tertiary" />
                  <div className="flex gap-2">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          selectedTags.includes(tag)
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        )}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="recent">Recently Added</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="score">Highest Score</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'px-3 py-2',
                      viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-700'
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'px-3 py-2',
                      viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-700'
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Favorites List */}
          {filteredFavorites.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {selectedTags.length > 0 ? 'No favorites match your filters' : 'No favorites yet'}
              </h3>
              <p className="text-text-secondary mb-6">
                {selectedTags.length > 0 
                  ? 'Try adjusting your filters' 
                  : 'Start favoriting properties to keep track of homes you love'}
              </p>
              {selectedTags.length === 0 && (
                <Button
                  onClick={() => navigate('/search')}
                  className="rounded-full"
                >
                  Browse Properties
                </Button>
              )}
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
            )}>
              {filteredFavorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className={cn(
                    'bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group',
                    viewMode === 'list' && 'flex'
                  )}
                >
                  {/* Image */}
                  <div
                    className={cn(
                      'relative',
                      viewMode === 'grid' ? 'h-48' : 'w-48 flex-shrink-0'
                    )}
                    onClick={() => navigate(`/property/${favorite.propertyId}`)}
                  >
                    <img
                      src={favorite.image}
                      alt={favorite.address}
                      className="w-full h-full object-cover"
                    />
                    {favorite.priceChange && (
                      <div className={cn(
                        'absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold',
                        favorite.priceChange.direction === 'down' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      )}>
                        {favorite.priceChange.direction === 'down' ? '-' : '+'}
                        {formatPrice(Math.abs(favorite.priceChange.amount))}
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/80 text-white">
                        Score: {favorite.homeHistoryScore}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1">
                    <div 
                      onClick={() => navigate(`/property/${favorite.propertyId}`)}
                      className="mb-3"
                    >
                      <p className="text-2xl font-bold text-primary mb-1">
                        {formatPrice(favorite.price)}
                      </p>
                      <p className="text-text-primary font-semibold">
                        {favorite.address}
                      </p>
                      <p className="text-sm text-text-secondary flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {favorite.city}, {favorite.state} {favorite.zipCode}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-text-secondary mb-3">
                      <span className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        {favorite.beds} beds
                      </span>
                      <span className="flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        {favorite.baths} baths
                      </span>
                      <span className="flex items-center">
                        <Square className="w-4 h-4 mr-1" />
                        {favorite.sqft.toLocaleString()} sqft
                      </span>
                    </div>

                    {favorite.notes && (
                      <p className="text-sm text-text-secondary mb-3 italic">
                        "{favorite.notes}"
                      </p>
                    )}

                    {favorite.tags.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {favorite.tags.map((tag) => (
                          <Badge key={tag} className="bg-blue-100 text-blue-700 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <p className="text-xs text-text-tertiary">
                        Saved {new Date(favorite.savedAt).toLocaleDateString()}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFavorite(favorite.id)
                        }}
                        className="text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </div>
    </>
  )
}

