"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Scale, 
  MapPin, 
  StickyNote,
  Heart,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Flower,
  Eye
} from "lucide-react"
import Image from "next/image"
import type { PlantEvent, EventImage } from "@/lib/api"
import { cleanImageUrl } from "@/lib/utils"

interface PhotoMosaicViewProps {
  events: PlantEvent[]
  loading: boolean
  error: string | null
}

interface PhotoItem {
  image: EventImage
  event: PlantEvent
  aspectRatio: number
}

const getImageAspectRatio = (width?: number, height?: number): number => {
  if (!width || !height) return 1
  return width / height
}

const getMasonryColumns = (photos: PhotoItem[]): PhotoItem[][] => {
  const columns: PhotoItem[][] = [[], [], []]
  const columnHeights = [0, 0, 0]
  
  photos.forEach((photo) => {
    // Find the shortest column
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
    columns[shortestColumnIndex].push(photo)
    // Add to column height (approximate based on aspect ratio)
    columnHeights[shortestColumnIndex] += 300 / photo.aspectRatio
  })
  
  return columns
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
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

export function PhotoMosaicView({ events, loading, error }: PhotoMosaicViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showDetails, setShowDetails] = useState(false)

  // Collect all photos with their event context
  const allPhotos = useMemo(() => {
    const photos: PhotoItem[] = []
    events.forEach((event) => {
      if (event.images) {
        event.images.forEach((image) => {
          photos.push({
            image,
            event,
            aspectRatio: getImageAspectRatio(image.width, image.height)
          })
        })
      }
    })

    // Sort by upload date (newest first)
    photos.sort((a, b) => 
      new Date(b.image.created_at).getTime() - new Date(a.image.created_at).getTime()
    )
    
    return photos
  }, [events])

  // Group photos by plant variety for color coding
  const cropColors: Record<string, string> = {}
  const uniqueCrops = Array.from(new Set(events.map(e => e.plant?.variety?.name || e.plant_variety || 'Unknown Plant')))
  const colors = [
    'bg-red-100 border-red-200',
    'bg-green-100 border-green-200', 
    'bg-yellow-100 border-yellow-200',
    'bg-blue-100 border-blue-200',
    'bg-purple-100 border-purple-200',
    'bg-pink-100 border-pink-200',
    'bg-indigo-100 border-indigo-200',
    'bg-teal-100 border-teal-200'
  ]
  uniqueCrops.forEach((crop, index) => {
    cropColors[crop] = colors[index % colors.length]
  })

  // Group photos by event type for additional color coding
  const eventTypeColors: Record<string, string> = {
    'harvest': 'border-green-300',
    'bloom': 'border-pink-300', 
    'snapshot': 'border-blue-300'
  }

  const masonryColumns = getMasonryColumns(allPhotos)

  const toggleFavorite = (imageId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(imageId)) {
        newFavorites.delete(imageId)
      } else {
        newFavorites.add(imageId)
      }
      return newFavorites
    })
  }

  const openLightbox = (photo: PhotoItem) => {
    const index = allPhotos.findIndex(p => p.image.id === photo.image.id)
    setSelectedPhoto(photo)
    setSelectedIndex(index)
    setShowDetails(false)
  }

  const navigateLightbox = useCallback((direction: 'prev' | 'next') => {
    if (!selectedPhoto) return
    
    let newIndex = selectedIndex
    if (direction === 'prev') {
      newIndex = selectedIndex > 0 ? selectedIndex - 1 : allPhotos.length - 1
    } else {
      newIndex = selectedIndex < allPhotos.length - 1 ? selectedIndex + 1 : 0
    }
    
    setSelectedIndex(newIndex)
    setSelectedPhoto(allPhotos[newIndex])
  }, [selectedPhoto, selectedIndex, allPhotos])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedPhoto) return
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          navigateLightbox('prev')
          break
        case 'ArrowRight':
          e.preventDefault()
          navigateLightbox('next')
          break
        case 'Escape':
          e.preventDefault()
          setSelectedPhoto(null)
          break
        case 'i':
        case 'I':
          e.preventDefault()
          setShowDetails(!showDetails)
          break
      }
    }

    if (selectedPhoto) {
      document.addEventListener('keydown', handleKeyPress)
      return () => document.removeEventListener('keydown', handleKeyPress)
    }
  }, [selectedPhoto, showDetails, selectedIndex, navigateLightbox])

  if (loading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="break-inside-avoid mb-6 animate-pulse"
            style={{ height: Math.random() * 200 + 200 }}
          >
            <div className="bg-muted rounded-lg h-full"></div>
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

  if (allPhotos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📸</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No Photos Yet</h3>
        <p className="text-organic">Start adding photos to your plant events to see them here</p>
      </div>
    )
  }

  return (
    <>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {allPhotos.length}
            </div>
            <p className="text-sm text-organic">Total Photos</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {uniqueCrops.length}
            </div>
            <p className="text-sm text-organic">Plant Types</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {events.length}
            </div>
            <p className="text-sm text-organic">Plant Events</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {favorites.size}
            </div>
            <p className="text-sm text-organic">Favorites</p>
          </CardContent>
        </Card>
      </div>

      {/* Masonry Grid - Desktop */}
      <div className="hidden lg:flex gap-6">
        {masonryColumns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex-1 space-y-6">
            {column.map((photo) => (
              <div
                key={photo.image.id}
                className="group relative cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                onClick={() => openLightbox(photo)}
              >
                <div 
                  className={`border-2 ${cropColors[photo.event.plant?.variety?.name || photo.event.plant_variety || 'Unknown Plant']} ${eventTypeColors[photo.event.event_type]} rounded-lg overflow-hidden`}
                  style={{ aspectRatio: photo.aspectRatio }}
                >
                  <Image
                    src={cleanImageUrl(photo.image.public_url)}
                    alt={`${photo.event.plant?.variety?.name || photo.event.plant_variety || 'Plant'} ${photo.event.event_type}`}
                    width={400}
                    height={400 / photo.aspectRatio}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            {(() => {
                              const EventIcon = getEventIcon(photo.event.event_type)
                              return <EventIcon className={`w-3 h-3 ${getEventColor(photo.event.event_type)} text-white`} />
                            })()}
                            <span className="text-white/80 text-xs capitalize">{photo.event.event_type}</span>
                          </div>
                          <h3 className="text-white font-semibold text-sm">
                            {photo.event.plant?.variety?.name || photo.event.plant_variety || 'Plant Event'}
                          </h3>
                          <p className="text-white/80 text-xs">
                            {formatDate(photo.event.event_date)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(photo.image.id)
                          }}
                        >
                          <Heart 
                            className={`w-4 h-4 ${
                              favorites.has(photo.image.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-white'
                            }`} 
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Responsive Grid - Mobile/Tablet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {allPhotos.map((photo) => (
          <div
            key={photo.image.id}
            className="group relative cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
            onClick={() => openLightbox(photo)}
          >
            <div 
              className={`border-2 ${cropColors[photo.event.plant?.variety?.name || photo.event.plant_variety || 'Unknown Plant']} ${eventTypeColors[photo.event.event_type]} rounded-lg overflow-hidden aspect-square`}
            >
              <Image
                src={cleanImageUrl(photo.image.public_url)}
                alt={`${photo.event.plant?.variety?.name || photo.event.plant_variety || 'Plant'} ${photo.event.event_type}`}
                width={300}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {(() => {
                          const EventIcon = getEventIcon(photo.event.event_type)
                          return <EventIcon className={`w-3 h-3 ${getEventColor(photo.event.event_type)} text-white`} />
                        })()}
                        <span className="text-white/80 text-xs capitalize">{photo.event.event_type}</span>
                      </div>
                      <h3 className="text-white font-semibold text-sm">
                        {photo.event.plant?.variety?.name || photo.event.plant_variety || 'Plant Event'}
                      </h3>
                      <p className="text-white/80 text-xs">
                        {formatDate(photo.event.event_date)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(photo.image.id)
                      }}
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          favorites.has(photo.image.id) 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-white'
                        }`} 
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          {/* Navigation */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
            onClick={() => navigateLightbox('prev')}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
            onClick={() => navigateLightbox('next')}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Info Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 text-white hover:bg-white/20 z-10"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Info className="w-6 h-6" />
          </Button>

          {/* Image */}
          <div className="relative max-w-4xl max-h-full p-4">
            <Image
              src={cleanImageUrl(selectedPhoto.image.public_url)}
              alt={`${selectedPhoto.event.plant?.variety?.name || selectedPhoto.event.plant_variety || 'Plant'} ${selectedPhoto.event.event_type}`}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>

          {/* Details Panel */}
          {showDetails && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-6 transform transition-transform">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const EventIcon = getEventIcon(selectedPhoto.event.event_type)
                        return <EventIcon className={`w-5 h-5 ${getEventColor(selectedPhoto.event.event_type)} text-white`} />
                      })()}
                      <span className="text-white/80 text-sm capitalize">{selectedPhoto.event.event_type}</span>
                    </div>
                    <h2 className="text-xl font-semibold mb-1">
                      {selectedPhoto.event.plant?.variety?.name || selectedPhoto.event.plant_variety || 'Plant Event'}
                    </h2>
                    <p className="text-white/80 text-sm">
                      Photo {selectedIndex + 1} of {allPhotos.length}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => toggleFavorite(selectedPhoto.image.id)}
                  >
                    <Heart 
                      className={`w-5 h-5 ${
                        favorites.has(selectedPhoto.image.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-white'
                      }`} 
                    />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(selectedPhoto.event.event_date)}</span>
                    </div>
                    {selectedPhoto.event.quantity && (
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        <span>{selectedPhoto.event.quantity}</span>
                      </div>
                    )}
                    {selectedPhoto.event.coordinates && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedPhoto.event.coordinates.latitude.toFixed(4)}, {selectedPhoto.event.coordinates.longitude.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedPhoto.event.description && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <StickyNote className="w-4 h-4 mt-0.5" />
                        <div className="text-white/90">
                          <p>{selectedPhoto.event.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {allPhotos.length}
          </div>
        </div>
      )}
    </>
  )
}