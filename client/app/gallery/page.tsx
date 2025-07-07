"use client"

import { useState, useEffect } from "react"
import { eventsApi, type PlantEvent } from "@/lib/api"
import { cleanImageUrl } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, Eye, Grid, Calendar, BarChart3, Camera, Upload } from "lucide-react"

// Import gallery view components
import { CropGardenView } from "@/components/gallery/crop-garden-view"
import { DashboardView } from "@/components/gallery/dashboard-view"
import { PhotoMosaicView } from "@/components/gallery/photo-mosaic-view"
import { TimelineView } from "@/components/gallery/timeline-view"

type ViewMode = 'timeline' | 'garden' | 'mosaic' | 'dashboard'

export default function GalleryPage() {
  const [events, setEvents] = useState<PlantEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<PlantEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
  const [activeView, setActiveView] = useState<ViewMode>('timeline')

  // Load events on component mount
  useEffect(() => {
    loadEvents()
  }, [])

  // Filter events when search term or filter changes
  useEffect(() => {
    filterEvents()
  }, [events, searchTerm, eventTypeFilter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Loading events from API...')
      const response = await eventsApi.getAll()
      console.log('📊 API Response:', response)
      
      if (response.success && response.data) {
        console.log(`✅ Loaded ${response.data.length} events`)
        console.log('📋 Events with image counts:', response.data.map(e => ({
          id: e.id,
          type: e.event_type,
          images: e.images?.length || 0,
          produce: e.plant_variety || 'Unknown'
        })))
        
        // Debug: Log actual image URLs to see if they have trailing ? characters
        response.data.forEach(event => {
          if (event.images && event.images.length > 0) {
            console.log(`🖼️ Event ${event.id} images:`)
            event.images.forEach((img, idx) => {
              console.log(`  Image ${idx}: "${img.public_url}"`)
              console.log(`  Cleaned: "${cleanImageUrl(img.public_url)}"`)
            })
          }
        })
        
        setEvents(response.data)
      } else {
        setError(response.message || 'Failed to load events')
      }
    } catch (err) {
      console.error('❌ Error loading events:', err)
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.plant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||

        event.plant?.variety?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.plant_variety?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by event type
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter(event => event.event_type === eventTypeFilter)
    }

    setFilteredEvents(filtered)
  }

  const getViewIcon = (view: ViewMode) => {
    switch (view) {
      case 'timeline': return <Calendar className="w-4 h-4" />
      case 'garden': return <Grid className="w-4 h-4" />
      case 'mosaic': return <Eye className="w-4 h-4" />
      case 'dashboard': return <BarChart3 className="w-4 h-4" />
    }
  }

  const getViewLabel = (view: ViewMode) => {
    switch (view) {
      case 'timeline': return 'Timeline'
      case 'garden': return 'Garden View'
      case 'mosaic': return 'Photo Mosaic'
      case 'dashboard': return 'Analytics'
    }
  }

  // Count events with images
  const eventsWithImages = filteredEvents.filter(event => event.images && event.images.length > 0)
  const totalImages = filteredEvents.reduce((sum, event) => sum + (event.images?.length || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gallery</h1>
              <p className="text-organic">Explore your plant journey through different views and perspectives</p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search events, plants, notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="harvest">Harvest</SelectItem>
                  <SelectItem value="bloom">Bloom</SelectItem>
                  <SelectItem value="snapshot">Snapshot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Selector */}
            <div className="flex flex-wrap gap-2">
              {(['timeline', 'garden', 'mosaic', 'dashboard'] as ViewMode[]).map((view) => (
                <Button
                  key={view}
                  variant={activeView === view ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveView(view)}
                  className="flex items-center gap-2"
                >
                  {getViewIcon(view)}
                  {getViewLabel(view)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading gallery...</div>
          </div>
        )}

        {error && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadEvents} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            {/* Results Summary */}
            <div className="mb-6 space-y-2">
              <p className="text-sm text-organic">
                Showing {filteredEvents.length} of {events.length} events
                {searchTerm && ` matching "${searchTerm}"`}
                {eventTypeFilter !== "all" && ` • ${eventTypeFilter} events only`}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Camera className="w-4 h-4" />
                  <span>{eventsWithImages.length} events with photos</span>
                </div>
                <div className="flex items-center gap-1">
                  <Upload className="w-4 h-4" />
                  <span>{totalImages} total images</span>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="text-gray-400 mb-4">
                    <Calendar className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Events Found</h3>
                  <p className="text-organic mb-4">
                    {searchTerm || eventTypeFilter !== "all" 
                      ? "Try adjusting your search terms or filters."
                      : "Start by creating your first plant event to see it here."
                    }
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                  >
                    Create First Event
                  </Button>
                </div>
              </div>
            ) : totalImages === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="text-gray-400 mb-4">
                    <Camera className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Photos Yet</h3>
                  <p className="text-organic mb-4">
                    You have {filteredEvents.length} events, but no photos uploaded yet. 
                    Add some photos to your events to create a beautiful gallery!
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                  >
                    Add Photos to Events
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Gallery Views */}
                <div className="space-y-6">
                  {activeView === 'timeline' && (
                    <TimelineView events={filteredEvents} loading={loading} error={error} />
                  )}
                  
                  {activeView === 'garden' && (
                    <CropGardenView events={filteredEvents} loading={loading} error={error} />
                  )}
                  
                  {activeView === 'mosaic' && (
                    <PhotoMosaicView events={filteredEvents} loading={loading} error={error} />
                  )}
                  
                  {activeView === 'dashboard' && (
                    <DashboardView events={filteredEvents} loading={loading} error={error} />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}