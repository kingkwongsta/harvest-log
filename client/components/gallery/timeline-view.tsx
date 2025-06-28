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
  Expand
} from "lucide-react"
import Image from "next/image"
import type { HarvestLogResponse } from "@/lib/api"

interface TimelineViewProps {
  harvests: HarvestLogResponse[]
  loading: boolean
  error: string | null
}

interface TimelineGroup {
  period: string
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  harvests: HarvestLogResponse[]
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

export function TimelineView({ harvests, loading, error }: TimelineViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Group harvests by month and season
  const timelineGroups: TimelineGroup[] = []
  const groupedByMonth = harvests.reduce((acc, harvest) => {
    const date = new Date(harvest.harvest_date)
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[monthYear]) {
      acc[monthYear] = []
    }
    acc[monthYear].push(harvest)
    return acc
  }, {} as Record<string, HarvestLogResponse[]>)

  Object.entries(groupedByMonth)
    .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
    .forEach(([monthYear, monthHarvests]) => {
      const [year, month] = monthYear.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      const period = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      const season = getSeason(monthHarvests[0].harvest_date)
      
      timelineGroups.push({
        period,
        season,
        harvests: monthHarvests.sort((a, b) => 
          new Date(b.harvest_date).getTime() - new Date(a.harvest_date).getTime()
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
                    {group.harvests.length} harvest{group.harvests.length !== 1 ? 's' : ''} this period
                  </p>
                </div>
              </div>

              {/* Harvest Cards */}
              <div className="ml-16 space-y-6">
                {group.harvests.map((harvest) => (
                  <Card 
                    key={harvest.id} 
                    className={`${seasonConfig.color} hover:shadow-lg transition-all duration-300 overflow-hidden`}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* Images Section */}
                        {harvest.images && harvest.images.length > 0 && (
                          <div className="lg:w-1/3 relative">
                            <div className="aspect-square lg:aspect-[4/3] relative overflow-hidden">
                              <Image
                                src={harvest.images[0].public_url || "/placeholder.svg"}
                                alt={`${harvest.crop_name} harvest`}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                              />
                              {harvest.images.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Camera className="w-3 h-3" />
                                  +{harvest.images.length - 1}
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute bottom-2 right-2 bg-white/80 hover:bg-white"
                                onClick={() => setSelectedImage(harvest.images![0].public_url!)}
                              >
                                <Expand className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Content Section */}
                        <div className="flex-1 p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-foreground mb-1">
                                {harvest.crop_name}
                              </h3>
                              <p className="text-sm text-organic">
                                {getRelativeTime(harvest.harvest_date)}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="mt-2 sm:mt-0 w-fit"
                            >
                              {harvest.quantity} {harvest.unit}
                            </Badge>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center text-sm text-organic">
                              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                              {formatDate(harvest.harvest_date)}
                            </div>
                            
                            <div className="flex items-center text-sm text-organic">
                              <Scale className="w-4 h-4 mr-2 text-muted-foreground" />
                              {harvest.quantity} {harvest.unit}
                            </div>

                            {harvest.location && (
                              <div className="flex items-center text-sm text-organic">
                                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                {harvest.location}
                              </div>
                            )}

                            {harvest.images && harvest.images.length > 0 && (
                              <div className="flex items-center text-sm text-organic">
                                <Camera className="w-4 h-4 mr-2 text-muted-foreground" />
                                {harvest.images.length} photo{harvest.images.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {harvest.notes && (
                            <div className="bg-white/50 rounded-lg p-3 border border-white/50">
                              <div className="flex items-start">
                                <StickyNote className="w-4 h-4 mr-2 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-foreground leading-relaxed">
                                  {harvest.notes}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Image Gallery Preview */}
                          {harvest.images && harvest.images.length > 1 && (
                            <div className="mt-4">
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {harvest.images.slice(1, 5).map((image, index) => (
                                  <div 
                                    key={image.id}
                                    className="flex-shrink-0 relative cursor-pointer group"
                                    onClick={() => setSelectedImage(image.public_url!)}
                                  >
                                    <div className="w-16 h-16 relative overflow-hidden rounded-lg border-2 border-white/50">
                                      <Image
                                        src={image.public_url || "/placeholder.svg"}
                                        alt={`${harvest.crop_name} photo ${index + 2}`}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-200"
                                        sizes="64px"
                                      />
                                    </div>
                                  </div>
                                ))}
                                {harvest.images.length > 5 && (
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600">
                                    +{harvest.images.length - 5}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              alt="Harvest photo"
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