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
  Expand
} from "lucide-react"
import Image from "next/image"
import type { HarvestLogResponse } from "@/lib/api"

interface CropGardenViewProps {
  harvests: HarvestLogResponse[]
  loading: boolean
  error: string | null
}

interface CropData {
  name: string
  emoji: string
  harvests: HarvestLogResponse[]
  totalQuantity: number
  totalHarvests: number
  averageQuantity: number
  firstHarvest: string
  lastHarvest: string
  bestHarvest: HarvestLogResponse
  trend: 'up' | 'down' | 'stable'
  images: string[]
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

const calculateTrend = (harvests: HarvestLogResponse[]): 'up' | 'down' | 'stable' => {
  if (harvests.length < 2) return 'stable'
  
  const sorted = [...harvests].sort((a, b) => 
    new Date(a.harvest_date).getTime() - new Date(b.harvest_date).getTime()
  )
  
  const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2))
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, h) => sum + h.quantity, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, h) => sum + h.quantity, 0) / secondHalf.length
  
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

export function CropGardenView({ harvests, loading, error }: CropGardenViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null)

  // Group harvests by crop type
  const cropGroups = harvests.reduce((acc, harvest) => {
    const cropName = harvest.crop_name
    if (!acc[cropName]) {
      acc[cropName] = []
    }
    acc[cropName].push(harvest)
    return acc
  }, {} as Record<string, HarvestLogResponse[]>)

  // Process crop data
  const cropData: CropData[] = Object.entries(cropGroups).map(([name, cropHarvests]) => {
    const totalQuantity = cropHarvests.reduce((sum, h) => sum + h.quantity, 0)
    const totalHarvests = cropHarvests.length
    const averageQuantity = totalQuantity / totalHarvests
    
    const sortedByDate = [...cropHarvests].sort((a, b) => 
      new Date(a.harvest_date).getTime() - new Date(b.harvest_date).getTime()
    )
    
    const bestHarvest = [...cropHarvests].sort((a, b) => b.quantity - a.quantity)[0]
    const trend = calculateTrend(cropHarvests)
    
    const images = cropHarvests
      .flatMap(h => h.images?.map(img => img.public_url) || [])
      .filter(Boolean) as string[]
    
    return {
      name,
      emoji: getCropEmoji(name),
      harvests: cropHarvests,
      totalQuantity,
      totalHarvests,
      averageQuantity,
      firstHarvest: sortedByDate[0].harvest_date,
      lastHarvest: sortedByDate[sortedByDate.length - 1].harvest_date,
      bestHarvest,
      trend,
      images: images.slice(0, 6) // Limit to 6 images per crop
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
            <p className="text-sm text-organic">Crop Varieties</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {harvests.reduce((sum, h) => sum + h.quantity, 0)}
            </div>
            <p className="text-sm text-organic">Total Harvest</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {Math.round(harvests.reduce((sum, h) => sum + h.quantity, 0) / harvests.length)}
            </div>
            <p className="text-sm text-organic">Avg per Harvest</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {harvests.reduce((sum, h) => sum + (h.images?.length || 0), 0)}
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
                    {crop.totalHarvests}
                  </div>
                  <p className="text-xs text-organic">Times Harvested</p>
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
                        onClick={() => setSelectedImage(imageUrl)}
                      >
                        <Image
                          src={imageUrl || "/placeholder.svg"}
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

              {/* Harvest Details */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-organic flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    First Harvest
                  </span>
                  <span className="text-foreground">
                    {formatDate(crop.firstHarvest)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-organic flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Latest Harvest
                  </span>
                  <span className="text-foreground">
                    {formatDate(crop.lastHarvest)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-organic flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Best Harvest
                  </span>
                  <span className="text-foreground">
                    {crop.bestHarvest.quantity} {crop.bestHarvest.unit}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-organic flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    Average
                  </span>
                  <span className="text-foreground">
                    {Math.round(crop.averageQuantity)} {crop.bestHarvest.unit}
                  </span>
                </div>
              </div>

              {/* Expand Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setExpandedCrop(expandedCrop === crop.name ? null : crop.name)}
              >
                {expandedCrop === crop.name ? 'Show Less' : 'View All Harvests'}
              </Button>

              {/* Expanded Harvest List */}
              {expandedCrop === crop.name && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {crop.harvests
                    .sort((a, b) => new Date(b.harvest_date).getTime() - new Date(a.harvest_date).getTime())
                    .map((harvest) => (
                      <div 
                        key={harvest.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>{formatDate(harvest.harvest_date)}</span>
                          {harvest.images && harvest.images.length > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Camera className="w-3 h-3" />
                              <span>{harvest.images.length}</span>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {harvest.quantity} {harvest.unit}
                        </Badge>
                      </div>
                    ))}
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