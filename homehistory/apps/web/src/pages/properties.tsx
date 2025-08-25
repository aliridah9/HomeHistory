import * as React from "react"
import { Helmet } from "react-helmet-async"
import { Building, Grid, List, Filter, SortAsc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function PropertiesPage() {
  const [viewType, setViewType] = React.useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <>
      <Helmet>
        <title>Properties - HomeHistory</title>
        <meta name="description" content="Browse all available properties with comprehensive insights and AI-powered scoring." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Properties</h1>
            <p className="text-muted-foreground">
              Browse all available properties with AI-powered insights
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <SortAsc className="mr-2 h-4 w-4" />
              Sort
            </Button>
            <div className="flex border rounded-md">
              <Button
                variant={viewType === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewType === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Properties Grid/List */}
        <div className="bg-card rounded-lg border p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Loading properties..." />
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties found</h3>
              <p className="text-muted-foreground">
                Properties will be displayed here once data is loaded
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}