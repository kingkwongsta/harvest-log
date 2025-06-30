"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  MapPin, 
  Scale, 
  StickyNote, 
  Camera,
  Expand,
  Leaf,
  Flower,
  Eye
} from "lucide-react"
import Image from "next/image"
import type { PlantEvent } from "@/lib/api"

interface TimelineViewProps {
  events: PlantEvent[]
  loading: boolean
  error: string | null
}

interface TimelineGroup {
  period: string
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  events: PlantEvent[]
}

const SEASON_CONFIG = {
  spring: {
    color: 'bg-green-100 border-green-200',
    accent: 'bg-green-500',
    icon: '🌱',
    theme: 'Spring awakening'
  },
  summer: {
    color: 'bg-yellow-100 border-yellow-200', 
    accent: 'bg-yellow-500',
    icon: '☀️',
    theme: 'Summer abundance'
  },
  autumn: {
    color: 'bg-orange-100 border-orange-200',
    accent: 'bg-orange-500', 
    icon: '🍂',
    theme: 'Autumn harvest'
  },
  winter: {
    color: 'bg-blue-100 border-blue-200',
    accent: 'bg-blue-500',
    icon: '❄️',
    theme: 'Winter preservation'
  }
}

const getSeason = (date: string): 'spring' | 'summer' | 'autumn' | 'winter' => {
  const month = new Date(date).getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`
  return `${Math.ceil(diffDays / 365)} years ago`
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'harvest':
      return Leaf
    case 'bloom':
      return Flower
    case 'snapshot':
      return Eye
    default:
      return Eye
  }
}

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'harvest':
      return 'text-green-600'
    case 'bloom':
      return 'text-pink-600'
    case 'snapshot':
      return 'text-blue-600'
    default:
      return 'text-gray-600'
  }
}

export function TimelineView({ events, loading, error }: TimelineViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Group events by month and season
  const timelineGroups: TimelineGroup[] = []
  const groupedByMonth = events.reduce((acc, event) => {
    const date = new Date(event.event_date)
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[monthYear]) {
      acc[monthYear] = []
    }
    acc[monthYear].push(event)
    return acc
  }, {} as Record<string, PlantEvent[]>)

  Object.entries(groupedByMonth)
    .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
    .forEach(([monthYear, monthEvents]) => {
      const [year, month] = monthYear.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      const period = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      const season = getSeason(monthEvents[0].event_date)
      
      timelineGroups.push({
        period,
        season,
        events: monthEvents.sort((a, b) => 
          new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        )
      })
    })

  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-1/4"></div>
            <div className="space-y-4">
              <div className="h-40 bg-muted rounded"></div>
              <div className="h-40 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-300 via-yellow-300 via-orange-300 to-blue-300 rounded-full opacity-30"></div>
      
      <div className="space-y-12">
        {timelineGroups.map((group) => {
          const seasonConfig = SEASON_CONFIG[group.season]
          
          return (
            <div key={group.period} className="relative">
              {/* Period Header */}
              <div className="flex items-center mb-6">
                <div className={`absolute left-6 w-6 h-6 ${seasonConfig.accent} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg z-10`}>
                  {seasonConfig.icon}
                </div>
                <div className="ml-16">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    {group.period}
                    <Badge variant="secondary" className="text-xs">
                      {seasonConfig.theme}
                    </Badge>
                  </h2>
                  <p className="text-sm text-organic">
                    {group.events.length} event{group.events.length !== 1 ? 's' : ''} this period
                  </p>
                </div>
              </div>

              {/* Event Cards */}
              <div className="ml-16 space-y-6">
                {group.events.map((event) => {
                  const EventIcon = getEventIcon(event.event_type)
                  const eventColor = getEventColor(event.event_type)
                  
                  return (
                  <Card 
                    key={event.id} 
                    className={`${seasonConfig.color} hover:shadow-lg transition-all duration-300 overflow-hidden`}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* Images Section */}
                        {event.images && event.images.length > 0 ? (
                          <div className="lg:w-1/3 relative">
                            <div className="aspect-square lg:aspect-[4/3] relative overflow-hidden">
                              <Image
                                src={event.images[0].public_url || "/placeholder.svg"}
                                alt={`${event.plant?.variety?.name || event.produce || 'Plant'} ${event.event_type}`}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                onError={(e) => {
                                  // Fallback to placeholder
                                  const img = e.target as HTMLImageElement;
                                  if (img.src !== '/placeholder.svg') {
                                    img.src = '/placeholder.svg';
                                  }
                                }}
                              />
                              {event.images.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Camera className="w-3 h-3" />
                                  +{event.images.length - 1}
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute bottom-2 right-2 bg-white/80 hover:bg-white"
                                onClick={() => setSelectedImage(event.images![0].public_url!)}
                              >
                                <Expand className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="lg:w-1/3 relative bg-gray-100 flex items-center justify-center">
                            <div className="aspect-square lg:aspect-[4/3] relative overflow-hidden flex items-center justify-center text-gray-500 text-sm">
                              <div className="text-center">
                                <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No image</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Content Section */}
                        <div className="flex-1 p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-foreground mb-1 flex items-center gap-2">
                                <EventIcon className={`w-5 h-5 ${eventColor}`} />
                                {event.plant?.variety?.name || event.produce || 'Plant Event'}
                              </h3>
                              <p className="text-sm text-organic">
                                {getRelativeTime(event.event_date)}
                              </p>
                            </div>
                            <div className="flex gap-2 mt-2 sm:mt-0">
                              <Badge 
                                variant="outline" 
                                className={`w-fit capitalize ${eventColor}`}
                              >
                                {event.event_type}
                              </Badge>
                              {event.quantity && (
                                <Badge 
                                  variant="outline" 
                                  className="w-fit"
                                >
                                  {event.quantity} {event.unit}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center text-sm text-organic">
                              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                              {formatDate(event.event_date)}
                            </div>
                            
                            {event.quantity && (
                              <div className="flex items-center text-sm text-organic">
                                <Scale className="w-4 h-4 mr-2 text-muted-foreground" />
                                {event.quantity} {event.unit}
                              </div>
                            )}

                            {event.coordinates && (
                              <div className="flex items-center text-sm text-organic">
                                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                {event.coordinates.latitude.toFixed(4)}, {event.coordinates.longitude.toFixed(4)}
                              </div>
                            )}

                            {event.images && event.images.length > 0 && (
                              <div className="flex items-center text-sm text-organic">
                                <Camera className="w-4 h-4 mr-2 text-muted-foreground" />
                                {event.images.length} photo{event.images.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>

                          {/* Notes and Description */}
                          {(event.notes || event.description) && (
                            <div className="bg-white/50 rounded-lg p-3 border border-white/50">
                              <div className="flex items-start">
                                <StickyNote className="w-4 h-4 mr-2 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-foreground leading-relaxed">
                                  {event.description && (
                                    <p className="font-medium mb-1">{event.description}</p>
                                  )}
                                  {event.notes && (
                                    <p>{event.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Image Gallery Preview */}
                          {event.images && event.images.length > 1 && (
                            <div className="mt-4">
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {event.images.slice(1, 5).map((image, index) => (
                                  <div 
                                    key={image.id}
                                    className="flex-shrink-0 relative cursor-pointer group"
                                    onClick={() => setSelectedImage(image.public_url!)}
                                  >
                                    <div className="w-16 h-16 relative overflow-hidden rounded-lg border-2 border-white/50">
                                      <Image
                                        src={image.public_url || "/placeholder.svg"}
                                        alt={`${event.plant?.variety?.name || event.produce || 'Plant'} photo ${index + 2}`}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-200"
                                        sizes="64px"
                                      />
                                    </div>
                                  </div>
                                ))}
                                {event.images.length > 5 && (
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600">
                                    +{event.images.length - 5}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={selectedImage}
              alt="Plant event photo"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        </div>
      )}
    </div>
  )
}