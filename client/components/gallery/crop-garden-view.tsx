"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Scale, 
  Camera,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Expand,
  Leaf,
  Flower,
  Eye
} from "lucide-react"
import Image from "next/image"
import type { PlantEvent } from "@/lib/api"
import { cleanImageUrl } from "@/lib/utils"

interface CropGardenViewProps {
  events: PlantEvent[]
  loading: boolean
  error: string | null
}

interface CropData {
  name: string
  emoji: string
  events: PlantEvent[]
  totalQuantity: number
  totalEvents: number
  averageQuantity: number
  firstEvent: string
  lastEvent: string
  bestEvent: PlantEvent
  trend: 'up' | 'down' | 'stable'
  images: string[]
  eventCounts: {
    harvest: number
    bloom: number
    snapshot: number
  }
}

const CROP_EMOJIS: Record<string, string> = {
  'tomatoes': '🍅',
  'tomato': '🍅',
  'avocado': '🥑',
  'basil': '🌿',
  'mint': '🌿',
  'pepper': '🌶️',
  'orange': '🍊',
  'passion-fruit': '🥭',
  'passion fruit': '🥭',
  'dragonfruit': '🐉',
  'dragon fruit': '🐉',
  'lettuce': '🥬',
  'cucumber': '🥒',
  'carrot': '🥕',
  'potato': '🥔',
  'onion': '🧅',
  'garlic': '🧄',
  'herbs': '🌿',
  'default': '🌱'
}

const getCropEmoji = (cropName: string): string => {
  const key = cropName.toLowerCase().replace(/[^a-z\s-]/g, '')
  return CROP_EMOJIS[key] || CROP_EMOJIS['default']
}

const calculateTrend = (events: PlantEvent[]): 'up' | 'down' | 'stable' => {
  // Only calculate trend for harvest events with quantities
  const harvestEvents = events.filter(e => e.event_type === 'harvest' && e.quantity)
  
  if (harvestEvents.length < 2) return 'stable'
  
  const sorted = [...harvestEvents].sort((a, b) => 
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  )
  
  const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2))
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, e) => sum + (e.quantity || 0), 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, e) => sum + (e.quantity || 0), 0) / secondHalf.length
  
  if (firstAvg === 0) return 'stable'
  const diff = (secondAvg - firstAvg) / firstAvg
  
  if (diff > 0.1) return 'up'
  if (diff < -0.1) return 'down'
  return 'stable'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function CropGardenView({ events, loading, error }: CropGardenViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null)

  // Group events by plant variety or produce name
  const cropGroups = events.reduce((acc, event) => {
    const cropName = event.plant?.variety?.name || event.produce || 'Unknown Plant'
    if (!acc[cropName]) {
      acc[cropName] = []
    }
    acc[cropName].push(event)
    return acc
  }, {} as Record<string, PlantEvent[]>)

  // Process crop data
  const cropData: CropData[] = Object.entries(cropGroups).map(([name, cropEvents]) => {
    const harvestEvents = cropEvents.filter(e => e.event_type === 'harvest')
    const totalQuantity = harvestEvents.reduce((sum, e) => sum + (e.quantity || 0), 0)
    const totalEvents = cropEvents.length
    const averageQuantity = harvestEvents.length > 0 ? totalQuantity / harvestEvents.length : 0
    
    const sortedByDate = [...cropEvents].sort((a, b) => 
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )
    
    const bestEvent = [...harvestEvents].sort((a, b) => (b.quantity || 0) - (a.quantity || 0))[0] || cropEvents[0]
    const trend = calculateTrend(cropEvents)
    
    const images = cropEvents
      .flatMap(e => e.images?.map(img => cleanImageUrl(img.public_url)) || [])
      .filter(Boolean) as string[]
    
    const eventCounts = {
      harvest: cropEvents.filter(e => e.event_type === 'harvest').length,
      bloom: cropEvents.filter(e => e.event_type === 'bloom').length,
      snapshot: cropEvents.filter(e => e.event_type === 'snapshot').length,
    }
    
    return {
      name,
      emoji: getCropEmoji(name),
      events: cropEvents,
      totalQuantity,
      totalEvents,
      averageQuantity,
      firstEvent: sortedByDate[0].event_date,
      lastEvent: sortedByDate[sortedByDate.length - 1].event_date,
      bestEvent,
      trend,
      images: images.slice(0, 6), // Limit to 6 images per crop
      eventCounts
    }
  })

  // Sort by total quantity (most productive first)
  cropData.sort((a, b) => b.totalQuantity - a.totalQuantity)

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-64 bg-muted rounded-lg"></div>
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
    <div className="space-y-6">
      {/* Garden Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {cropData.length}
            </div>
            <p className="text-sm text-organic">Plant Varieties</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {events.length}
            </div>
            <p className="text-sm text-organic">Total Events</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {cropData.reduce((sum, c) => sum + c.totalQuantity, 0)}
            </div>
            <p className="text-sm text-organic">Total Harvested</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {events.reduce((sum, e) => sum + (e.images?.length || 0), 0)}
            </div>
            <p className="text-sm text-organic">Total Photos</p>
          </CardContent>
        </Card>
      </div>

      {/* Crop Garden Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cropData.map((crop) => (
          <Card 
            key={crop.name} 
            className="hover:shadow-lg transition-all duration-300 overflow-hidden group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className="text-2xl">{crop.emoji}</span>
                  <span className="capitalize">{crop.name}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {crop.trend === 'up' && (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  )}
                  {crop.trend === 'down' && (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  {crop.trend === 'stable' && (
                    <Minus className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {crop.totalQuantity}
                  </div>
                  <p className="text-xs text-organic">Total Harvested</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {crop.totalEvents}
                  </div>
                  <p className="text-xs text-organic">Total Events</p>
                </div>
              </div>

              {/* Event Type Breakdown */}
              <div className="flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-green-600" />
                  <span>{crop.eventCounts.harvest}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flower className="w-3 h-3 text-pink-600" />
                  <span>{crop.eventCounts.bloom}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-blue-600" />
                  <span>{crop.eventCounts.snapshot}</span>
                </div>
              </div>

              {/* Progress Bar - showing productivity relative to best crop */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-organic">Productivity</span>
                  <span className="text-foreground">
                    {Math.round((crop.totalQuantity / cropData[0].totalQuantity) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(crop.totalQuantity / cropData[0].totalQuantity) * 100} 
                  className="h-2"
                />
              </div>

              {/* Image Gallery */}
              {crop.images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-organic">Recent Photos</span>
                    <Badge variant="secondary" className="text-xs">
                      {crop.images.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {crop.images.slice(0, 3).map((imageUrl, index) => (
                      <div 
                        key={index}
                        className="aspect-square relative overflow-hidden rounded-lg cursor-pointer group/img"
                        onClick={() => setSelectedImage(cleanImageUrl(imageUrl))}
                      >
                        <Image
                          src={cleanImageUrl(imageUrl)}
                          alt={`${crop.name} harvest`}
                          fill
                          className="object-cover group-hover/img:scale-110 transition-transform duration-200"
                          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 16vw, 12vw"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute inset-0 bg-black/0 hover:bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <Expand className="w-4 h-4 text-white" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {crop.images.length > 3 && (
                    <p className="text-xs text-organic text-center">
                      +{crop.images.length - 3} more photos
                    </p>
                  )}
                </div>
              )}

              {/* Event Details */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-organic flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    First Event
                  </span>
                  <span className="text-foreground">
                    {formatDate(crop.firstEvent)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-organic flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Latest Event
                  </span>
                  <span className="text-foreground">
                    {formatDate(crop.lastEvent)}
                  </span>
                </div>
                
                {crop.bestEvent.quantity && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-organic flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Best Harvest
                      </span>
                      <span className="text-foreground">
                        {crop.bestEvent.quantity}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-organic flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        Avg Harvest
                      </span>
                      <span className="text-foreground">
                        {Math.round(crop.averageQuantity)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Expand Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setExpandedCrop(expandedCrop === crop.name ? null : crop.name)}
              >
                {expandedCrop === crop.name ? 'Show Less' : 'View All Events'}
              </Button>

              {/* Expanded Event List */}
              {expandedCrop === crop.name && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {crop.events
                    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
                    .map((event) => {
                      const getEventIcon = (type: string) => {
                        switch (type) {
                          case 'harvest': return <Leaf className="w-3 h-3 text-green-600" />
                          case 'bloom': return <Flower className="w-3 h-3 text-pink-600" />
                          case 'snapshot': return <Eye className="w-3 h-3 text-blue-600" />
                          default: return <Eye className="w-3 h-3 text-gray-600" />
                        }
                      }
                      
                      return (
                        <div 
                          key={event.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.event_type)}
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span>{formatDate(event.event_date)}</span>
                            {event.images && event.images.length > 0 && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Camera className="w-3 h-3" />
                                <span>{event.images.length}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {event.event_type}
                            </Badge>
                            {event.quantity && (
                              <Badge variant="outline" className="text-xs">
                                {event.quantity}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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