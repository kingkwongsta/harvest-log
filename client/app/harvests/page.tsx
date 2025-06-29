"use client"

import { useState, useEffect } from "react"
import { harvestLogsApi, ApiError, type HarvestLogResponse } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Clock, 
  TreePine, 
  Images, 
  BarChart3, 
  Search, 
  Sprout,
  Zap
} from "lucide-react"
import Link from "next/link"

// Import view components
import { TimelineView } from "@/components/gallery/timeline-view"
import { CropGardenView } from "@/components/gallery/crop-garden-view"
import { PhotoMosaicView } from "@/components/gallery/photo-mosaic-view"
import { DashboardView } from "@/components/gallery/dashboard-view"

type ViewMode = 'timeline' | 'garden' | 'mosaic' | 'dashboard'

const VIEW_MODES = [
  {
    id: 'timeline' as ViewMode,
    name: 'Timeline Journey',
    description: 'Chronological harvest story',
    icon: Clock,
    color: 'bg-blue-500'
  },
  {
    id: 'garden' as ViewMode,
    name: 'Crop Garden',
    description: 'Organized by crop type',
    icon: TreePine,
    color: 'bg-green-500'
  },
  {
    id: 'mosaic' as ViewMode,
    name: 'Photo Wall',
    description: 'Image-focused display',
    icon: Images,
    color: 'bg-purple-500'
  },
  {
    id: 'dashboard' as ViewMode,
    name: 'Data Insights',
    description: 'Charts and analytics',
    icon: BarChart3,
    color: 'bg-orange-500'
  }
]

export default function HarvestsPage() {
  const [currentView, setCurrentView] = useState<ViewMode>('timeline')
  const [harvests, setHarvests] = useState<HarvestLogResponse[]>([])
  const [filteredHarvests, setFilteredHarvests] = useState<HarvestLogResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCrop, setFilterCrop] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  // Fetch harvest data
  useEffect(() => {
    const fetchHarvests = async () => {
      try {
        setLoading(true)
        const response = await harvestLogsApi.getAll()
        if (response.success && response.data) {
          setHarvests(response.data)
          setFilteredHarvests(response.data)
        } else {
          setError(response.message || "Failed to load harvests")
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError("Failed to load harvests")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchHarvests()
  }, [])

  // Filter and search logic
  useEffect(() => {
    let filtered = [...harvests]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(harvest =>
        harvest.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        harvest.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Crop filter
    if (filterCrop !== "all") {
      filtered = filtered.filter(harvest => 
        harvest.crop_name.toLowerCase() === filterCrop.toLowerCase()
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.harvest_date).getTime() - new Date(a.harvest_date).getTime()
        case 'crop':
          return a.crop_name.localeCompare(b.crop_name)
        case 'quantity':
          return b.quantity - a.quantity
        default:
          return 0
      }
    })

    setFilteredHarvests(filtered)
  }, [harvests, searchTerm, filterCrop, sortBy])

  // Get unique crop types for filter
  const uniqueCrops = Array.from(new Set(harvests.map(h => h.crop_name))).sort()

  const renderCurrentView = () => {
    const commonProps = {
      harvests: filteredHarvests,
      loading,
      error
    }

    switch (currentView) {
      case 'timeline':
        return <TimelineView {...commonProps} />
      case 'garden':
        return <CropGardenView {...commonProps} />
      case 'mosaic':
        return <PhotoMosaicView {...commonProps} />
      case 'dashboard':
        return <DashboardView {...commonProps} />
      default:
        return <TimelineView {...commonProps} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 harvest-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-organic">Loading your harvest gallery...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Unable to load gallery</h3>
            <p className="text-organic mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Controls */}
      <div className="bg-card border-b border-border/50 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Harvests</h1>
              <p className="text-sm text-organic">
                {filteredHarvests.length} harvest{filteredHarvests.length !== 1 ? 's' : ''} • 
                {filteredHarvests.reduce((total, h) => total + (h.images?.length ?? 0), 0)} photos
              </p>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex flex-wrap gap-3 mb-4">
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon
              return (
                <Button
                  key={mode.id}
                  variant={currentView === mode.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView(mode.id)}
                  className={currentView === mode.id ? "border-primary/30" : ""}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{mode.name}</span>
                  <span className="sm:hidden">{mode.name.split(' ')[0]}</span>
                </Button>
              )
            })}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search harvests, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCrop} onValueChange={setFilterCrop}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All crops" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crops</SelectItem>
                {uniqueCrops.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="crop">Crop</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Current View */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {filteredHarvests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No harvests found</h3>
            <p className="text-organic mb-4">
              {searchTerm || filterCrop !== "all" 
                ? "Try adjusting your search or filters"
                : "Start by logging your first harvest"
              }
            </p>
            {!searchTerm && filterCrop === "all" && (
              <Link href="/">
                <Button variant="harvest">
                  <Sprout className="w-4 h-4 mr-2" />
                  Add First Harvest
                </Button>
              </Link>
            )}
          </div>
        ) : (
          renderCurrentView()
        )}
      </main>
    </div>
  )
}
