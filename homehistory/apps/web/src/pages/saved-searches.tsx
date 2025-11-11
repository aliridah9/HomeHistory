import * as React from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, BellOff, Trash2, Edit, Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout/Layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { searchApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface SavedSearch {
  id: string
  name: string
  query: string
  filters: any
  alertsEnabled: boolean
  resultsCount: number
  newResultsCount: number
  lastChecked: string
  createdAt: string
}

export default function SavedSearchesPage() {
  const navigate = useNavigate()
  const [searches, setSearches] = React.useState<SavedSearch[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchSavedSearches()
  }, [])

  const fetchSavedSearches = async () => {
    try {
      setLoading(true)
      const response = await searchApi.getSavedSearches()
      setSearches(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch saved searches:', err)
      setError('Failed to load saved searches')
      // Mock data for development
      setSearches([
        {
          id: '1',
          name: 'Modern Family Homes',
          query: 'modern family home with pool under 500k',
          filters: { maxPrice: 500000, beds: 3, propertyType: 'house' },
          alertsEnabled: true,
          resultsCount: 45,
          newResultsCount: 3,
          lastChecked: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString()
        },
        {
          id: '2',
          name: 'Downtown Condos',
          query: 'condo downtown with parking',
          filters: { maxPrice: 400000, beds: 2, propertyType: 'condo' },
          alertsEnabled: false,
          resultsCount: 28,
          newResultsCount: 0,
          lastChecked: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAlerts = async (searchId: string) => {
    const search = searches.find(s => s.id === searchId)
    if (!search) return

    setSearches(searches.map(s => 
      s.id === searchId 
        ? { ...s, alertsEnabled: !s.alertsEnabled }
        : s
    ))

    // TODO: Call API to update alerts
  }

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return

    try {
      await searchApi.deleteSavedSearch(searchId)
      setSearches(searches.filter(s => s.id !== searchId))
    } catch (err) {
      console.error('Failed to delete search:', err)
    }
  }

  const handleRunSearch = (search: SavedSearch) => {
    const params = new URLSearchParams({
      q: search.query,
      ...search.filters
    })
    navigate(`/search?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-text-secondary">Loading saved searches...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Saved Searches | HomeHistory</title>
        <meta name="description" content="Manage your saved property searches and alerts" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Container className="py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary">Saved Searches</h1>
                <p className="text-text-secondary mt-1">
                  Manage your saved searches and get notified of new listings
                </p>
              </div>
              <Button
                onClick={() => navigate('/search')}
                className="rounded-full bg-gradient-to-r from-primary to-purple-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Search
              </Button>
            </div>

            {error && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-700">{error}</p>
              </div>
            )}
          </div>

          {/* Searches List */}
          {searches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No saved searches yet
              </h3>
              <p className="text-text-secondary mb-6">
                Save your searches to get notified when new properties match your criteria
              </p>
              <Button
                onClick={() => navigate('/search')}
                className="rounded-full"
              >
                Start Searching
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {searches.map((search) => (
                <div
                  key={search.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-text-primary">
                          {search.name}
                        </h3>
                        {search.newResultsCount > 0 && (
                          <Badge className="bg-green-100 text-green-700">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {search.newResultsCount} new
                          </Badge>
                        )}
                        {search.alertsEnabled && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <Bell className="w-3 h-3 mr-1" />
                            Alerts On
                          </Badge>
                        )}
                      </div>

                      <p className="text-text-secondary mb-4 flex items-center">
                        <Search className="w-4 h-4 mr-2" />
                        "{search.query}"
                      </p>

                      <div className="flex items-center space-x-6 text-sm text-text-tertiary">
                        <span>{search.resultsCount} properties</span>
                        <span>•</span>
                        <span>
                          Last checked {new Date(search.lastChecked).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>
                          Saved {new Date(search.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunSearch(search)}
                        className="rounded-full"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Run Search
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAlerts(search.id)}
                        className="rounded-full"
                      >
                        {search.alertsEnabled ? (
                          <Bell className="w-4 h-4" />
                        ) : (
                          <BellOff className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteSearch(search.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              💡 Pro Tips for Saved Searches
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Enable alerts to get notified when new properties match your criteria</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Use natural language like "modern home with pool under $500k"</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Save multiple searches to track different property types or locations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Run searches regularly to see the latest listings</span>
              </li>
            </ul>
          </div>
        </Container>
      </div>
    </>
  )
}

