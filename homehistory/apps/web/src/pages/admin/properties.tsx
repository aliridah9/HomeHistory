import * as React from "react"
import { Helmet } from "react-helmet-async"
import { Plus, Search, Edit, Trash2, Eye, Upload, RefreshCw, Home, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/layout/Layout"
import { cn } from "@/lib/utils"

interface Property {
  id: string
  title: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  homeHistoryScore: number
  status: 'active' | 'pending' | 'sold'
  views: number
  leads: number
}

const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern Family Home',
    address: '1234 Oak Street, Austin TX',
    price: 485000,
    bedrooms: 4,
    bathrooms: 3,
    homeHistoryScore: 92,
    status: 'active',
    views: 1247,
    leads: 23
  },
  {
    id: '2',
    title: 'Downtown Luxury Condo',
    address: '567 Main Avenue, Austin TX',
    price: 325000,
    bedrooms: 2,
    bathrooms: 2,
    homeHistoryScore: 88,
    status: 'pending',
    views: 892,
    leads: 15
  }
]

export default function AdminProperties() {
  const [properties] = React.useState(MOCK_PROPERTIES)
  const [searchQuery, setSearchQuery] = React.useState('')

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'sold': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-orange-500'
  }

  return (
    <>
      <Helmet>
        <title>Property Management | HomeHistory Admin</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Container className="py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Property Management</h1>
              <p className="text-text-secondary mt-1">Manage properties and bulk operations</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="rounded-full">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Properties</p>
                  <p className="text-2xl font-bold text-text-primary">{properties.length}</p>
                </div>
                <Home className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Active Listings</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {properties.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Avg Score</p>
                  <p className="text-2xl font-bold text-text-primary">90</p>
                </div>
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Views</p>
                  <p className="text-2xl font-bold text-text-primary">2.1K</p>
                </div>
                <Eye className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recalculate Scores
              </Button>
            </div>
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Property</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Details</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Score</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Performance</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="font-semibold text-text-primary">{property.title}</h3>
                          <p className="text-sm text-text-secondary">{property.address}</p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-primary">
                          ${property.price.toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-primary">
                          {property.bedrooms} bed • {property.bathrooms} bath
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className={cn("text-lg font-bold", getScoreColor(property.homeHistoryScore))}>
                          {property.homeHistoryScore}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <Badge className={cn("capitalize", getStatusColor(property.status))}>
                          {property.status}
                        </Badge>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-text-primary">{property.views} views</div>
                          <div className="text-text-secondary">{property.leads} leads</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </div>
    </>
  )
}