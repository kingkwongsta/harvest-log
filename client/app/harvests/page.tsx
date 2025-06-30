"use client"

import { useState, useEffect } from "react"
import { eventsApi, ApiError, type PlantEvent } from "@/lib/api"
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
  Zap,
  Leaf,
  Flower,
  Camera
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
  const [events, setEvents] = useState<PlantEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<PlantEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCrop, setFilterCrop] = useState("all")
  const [filterEventType, setFilterEventType] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  // Fetch event data
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await eventsApi.getAll()
        if (response.success && response.data) {
          setEvents(response.data)
          setFilteredEvents(response.data)
        } else {
          setError(response.message || "Failed to load events")
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError("Failed to load events")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Filter and search logic
  useEffect(() => {
    let filtered = [...events]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        (event.plant?.variety?.name || event.produce || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Crop/Plant filter
    if (filterCrop !== "all") {
      filtered = filtered.filter(event => 
        (event.plant?.variety?.name || event.produce || '').toLowerCase() === filterCrop.toLowerCase()
      )
    }

    // Event type filter
    if (filterEventType !== "all") {
      filtered = filtered.filter(event => event.event_type === filterEventType)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        case 'crop':
          const cropA = a.plant?.variety?.name || a.produce || ''
          const cropB = b.plant?.variety?.name || b.produce || ''
          return cropA.localeCompare(cropB)
        case 'quantity':
          return (b.quantity || 0) - (a.quantity || 0)
        case 'type':
          return a.event_type.localeCompare(b.event_type)
        default:
          return 0
      }
    })

    setFilteredEvents(filtered)
  }, [events, searchTerm, filterCrop, filterEventType, sortBy])

  // Get unique crop types for filter
  const uniqueCrops = Array.from(new Set(events.map(e => e.plant?.variety?.name || e.produce || 'Unknown').filter(Boolean))).sort()

  // Get unique event types for filter
  const uniqueEventTypes = Array.from(new Set(events.map(e => e.event_type))).sort()

  const renderCurrentView = () => {
    const commonProps = {
      events: filteredEvents,
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
          <p className="text-organic">Loading your plant journey...</p>
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
              <h1 className="text-2xl font-bold text-foreground">Plant Journey</h1>
              <p className="text-sm text-organic">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} • 
                {filteredEvents.reduce((total, e) => total + (e.images?.length ?? 0), 0)} photos
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
                placeholder="Search plants, events, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCrop} onValueChange={setFilterCrop}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All plants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plants</SelectItem>
                {uniqueCrops.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEventType} onValueChange={setFilterEventType}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {uniqueEventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {type === 'harvest' && <Leaf className="w-3 h-3" />}
                      {type === 'bloom' && <Flower className="w-3 h-3" />}
                      {type === 'snapshot' && <Camera className="w-3 h-3" />}
                      <span className="capitalize">{type}</span>
                    </div>
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
                <SelectItem value="crop">Plant</SelectItem>
                <SelectItem value="type">Event Type</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Current View */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-organic mb-4">
              {searchTerm || filterCrop !== "all" || filterEventType !== "all"
                ? "Try adjusting your search or filters"
                : "Start by logging your first plant event"
              }
            </p>
            {!searchTerm && filterCrop === "all" && filterEventType === "all" && (
              <Link href="/">
                <Button variant="harvest">
                  <Sprout className="w-4 h-4 mr-2" />
                  Add First Event
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
