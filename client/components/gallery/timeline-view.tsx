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
import { cleanImageUrl } from "@/lib/utils"

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
    color: 'bg-green-50 border-green-100 hover:bg-green-100/50',
    accent: 'bg-green-600',
    icon: '🌱',
    theme: 'Spring awakening',
    gradient: 'from-green-50 to-emerald-50'
  },
  summer: {
    color: 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50', 
    accent: 'bg-emerald-600',
    icon: '🌿',
    theme: 'Summer growth',
    gradient: 'from-emerald-50 to-green-50'
  },
  autumn: {
    color: 'bg-green-50 border-green-200 hover:bg-green-100/50',
    accent: 'bg-green-700', 
    icon: '🍃',
    theme: 'Autumn harvest',
    gradient: 'from-green-50 to-lime-50'
  },
  winter: {
    color: 'bg-slate-50 border-slate-100 hover:bg-slate-100/50',
    accent: 'bg-slate-600',
    icon: '❄️',
    theme: 'Winter rest',
    gradient: 'from-slate-50 to-green-50'
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
      return 'text-green-700'
    case 'bloom':
      return 'text-pink-600'
    case 'snapshot':
      return 'text-blue-600'
    default:
      return 'text-slate-600'
  }
}

const getEventBadgeColor = (eventType: string) => {
  switch (eventType) {
    case 'harvest':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'bloom':
      return 'bg-pink-100 text-pink-800 border-pink-200'
    case 'snapshot':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const getEventHighlightColor = (eventType: string) => {
  switch (eventType) {
    case 'harvest':
      return 'bg-green-50 border-green-100 hover:bg-green-100/50'
    case 'bloom':
      return 'bg-pink-50 border-pink-100 hover:bg-pink-100/50'
    case 'snapshot':
      return 'bg-blue-50 border-blue-100 hover:bg-blue-100/50'
    default:
      return 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'
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
            <div className="h-8 bg-slate-100 rounded-lg mb-4 w-1/4"></div>
            <div className="space-y-4">
              <div className="h-40 bg-slate-50 rounded-lg border border-slate-100"></div>
              <div className="h-40 bg-slate-50 rounded-lg border border-slate-100"></div>
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
      <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 via-emerald-400 to-green-600 rounded-full opacity-40 shadow-sm"></div>
      
      <div className="space-y-16">
        {timelineGroups.map((group, groupIndex) => {
          const seasonConfig = SEASON_CONFIG[group.season]
          
          return (
            <div key={group.period} className="relative animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${groupIndex * 100}ms` }}>
              {/* Period Header */}
              <div className="flex items-center mb-8">
                <div className={`absolute left-6 w-8 h-8 ${seasonConfig.accent} rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg z-10 ring-4 ring-white`}>
                  {seasonConfig.icon}
                </div>
                <div className="ml-18">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    {group.period}
                    <Badge variant="secondary" className={`text-xs bg-gradient-to-r ${seasonConfig.gradient} border-0 text-green-800 font-medium`}>
                      {seasonConfig.theme}
                    </Badge>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {group.events.length} event{group.events.length !== 1 ? 's' : ''} this period
                  </p>
                </div>
              </div>

              {/* Event Cards */}
              <div className="ml-18 space-y-8">
                {group.events.map((event, eventIndex) => {
                  const EventIcon = getEventIcon(event.event_type)
                  const eventColor = getEventColor(event.event_type)
                  const eventBadgeColor = getEventBadgeColor(event.event_type)
                  const eventHighlightColor = getEventHighlightColor(event.event_type)
                  
                  return (
                  <Card 
                    key={event.id} 
                    className={`${eventHighlightColor} hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden border-2 backdrop-blur-sm animate-in fade-in-50 slide-in-from-left-4`}
                    style={{ animationDelay: `${(groupIndex * 100) + (eventIndex * 50)}ms` }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* Images Section */}
                        {event.images && event.images.length > 0 ? (
                          <div className="lg:w-1/3 relative">
                            <div className="aspect-square lg:aspect-[4/3] relative overflow-hidden">
                              <Image
                                src={cleanImageUrl(event.images[0].public_url)}
                                alt={`${event.plant?.variety?.name || event.plant_variety || 'Plant'} ${event.event_type}`}
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
                                className={`absolute bottom-2 right-2 bg-white/90 hover:bg-white ${eventColor.replace('600', '700')} hover:${eventColor.replace('600', '800')} border ${eventColor.replace('text-', 'border-').replace('600', '200')} hover:${eventColor.replace('text-', 'border-').replace('600', '300')} shadow-sm`}
                                onClick={() => setSelectedImage(cleanImageUrl(event.images![0].public_url))}
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
                        <div className="flex-1 p-7">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-5">
                            <div>
                              <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                                <EventIcon className={`w-5 h-5 ${eventColor}`} />
                                {event.plant?.name || event.plant_variety || 'Plant Event'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {event.plant?.variety?.name && (
                                  <span className={`font-medium ${eventColor.replace('600', '700')}`}>{event.plant.variety.name} • </span>
                                )}
                                {getRelativeTime(event.event_date)}
                              </p>
                            </div>
                            <div className="flex gap-2 mt-3 sm:mt-0">
                              <Badge 
                                variant="outline" 
                                className={`w-fit capitalize ${eventBadgeColor} font-medium`}
                              >
                                {event.event_type}
                              </Badge>
                              {event.quantity && (
                                <Badge 
                                  variant="outline" 
                                  className={`w-fit bg-white/80 ${eventColor.replace('600', '700')} ${eventColor.replace('text-', 'border-').replace('600', '200')} font-medium`}
                                >
                                  {event.quantity}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className={`w-4 h-4 mr-3 ${eventColor}`} />
                              <span className="font-medium">{formatDate(event.event_date)}</span>
                            </div>
                            
                            {event.quantity && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Scale className={`w-4 h-4 mr-3 ${eventColor}`} />
                                <span className="font-medium">{event.quantity}</span>
                              </div>
                            )}

                            {event.coordinates && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className={`w-4 h-4 mr-3 ${eventColor}`} />
                                <span className="font-medium">{event.coordinates.latitude.toFixed(4)}, {event.coordinates.longitude.toFixed(4)}</span>
                              </div>
                            )}

                            {event.images && event.images.length > 0 && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Camera className={`w-4 h-4 mr-3 ${eventColor}`} />
                                <span className="font-medium">{event.images.length} photo{event.images.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>

                          {/* Notes and Description */}
                          {event.description && (
                            <div className="bg-white/80 rounded-lg p-4 border border-current/20 shadow-sm">
                              <div className="flex items-start">
                                <StickyNote className={`w-4 h-4 mr-3 ${eventColor} mt-0.5 flex-shrink-0`} />
                                <div className="text-sm text-foreground leading-relaxed">
                                  <p className={`font-medium ${eventColor.replace('600', '800')}`}>{event.description}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Image Gallery Preview */}
                          {event.images && event.images.length > 1 && (
                            <div className="mt-5">
                              <div className="flex gap-3 overflow-x-auto pb-2">
                                {event.images.slice(1, 5).map((image, index) => (
                                  <div 
                                    key={image.id}
                                    className="flex-shrink-0 relative cursor-pointer group"
                                    onClick={() => setSelectedImage(cleanImageUrl(image.public_url))}
                                  >
                                    <div className={`w-16 h-16 relative overflow-hidden rounded-lg border-2 ${eventColor.replace('text-', 'border-').replace('600', '200')} hover:${eventColor.replace('text-', 'border-').replace('600', '300')} transition-colors duration-200 shadow-sm`}>
                                      <Image
                                        src={cleanImageUrl(image.public_url)}
                                        alt={`${event.plant?.variety?.name || event.plant_variety || 'Plant'} photo ${index + 2}`}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-200"
                                        sizes="64px"
                                      />
                                    </div>
                                  </div>
                                ))}
                                {event.images.length > 5 && (
                                  <div className={`w-16 h-16 ${eventColor.replace('text-', 'bg-').replace('600', '50')} border-2 ${eventColor.replace('text-', 'border-').replace('600', '100')} rounded-lg flex items-center justify-center text-xs ${eventColor.replace('600', '700')} font-medium`}>
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
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={selectedImage}
              alt="Plant event photo"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              sizes="(max-width: 768px) 100vw, 800px"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}