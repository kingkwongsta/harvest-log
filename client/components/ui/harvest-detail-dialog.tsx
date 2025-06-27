"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Calendar, 
  MapPin, 
  Scale, 
  ChevronLeft, 
  ChevronRight, 
  Camera,
  StickyNote
} from "lucide-react"
import { type HarvestLogResponse } from "@/lib/api"

interface HarvestDetailDialogProps {
  harvest: HarvestLogResponse | null
  isOpen: boolean
  onClose: () => void
}

export function HarvestDetailDialog({ harvest, isOpen, onClose }: HarvestDetailDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!harvest) return null

  const hasImages = harvest.images && harvest.images.length > 0
  const hasMultipleImages = hasImages && harvest.images!.length > 1

  const nextImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => 
        (prev + 1) % harvest.images!.length
      )
    }
  }

  const previousImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? harvest.images!.length - 1 : prev - 1
      )
    }
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1076px] max-h-[90vh] overflow-y-auto p-0">
        {/* Hero Image Section */}
        {hasImages && (
          <div className="relative w-full h-130 bg-gray-100 rounded-t-lg overflow-hidden">
            <img
              src={harvest.images![currentImageIndex].public_url || '/placeholder.svg'}
              alt={`${harvest.crop_name} photo ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg'
              }}
            />
            
            {/* Navigation arrows for multiple images */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={previousImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Image counter */}
            {hasMultipleImages && (
              <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {harvest.images!.length}
              </div>
            )}

            {/* Image thumbnails */}
            {hasMultipleImages && (
              <div className="absolute bottom-4 left-4 flex gap-2">
                {harvest.images!.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex 
                        ? 'bg-white' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {harvest.crop_name}
              </DialogTitle>
              <div className="flex gap-2">
                {hasImages && (
                  <Badge variant="secondary" className="text-sm">
                    <Camera className="w-4 h-4 mr-1" />
                    {harvest.images!.length} photo{harvest.images!.length > 1 ? 's' : ''}
                  </Badge>
                )}
                <Badge variant="outline" className="text-sm">
                  {new Date(harvest.harvest_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Harvest Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Scale className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Quantity</h3>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {harvest.quantity} {harvest.unit}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Harvest Date</h3>
                </div>
                <p className="text-lg text-gray-700">
                  {new Date(harvest.harvest_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>

            {harvest.location && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-gray-900">Location</h3>
                  </div>
                  <p className="text-lg text-gray-700">{harvest.location}</p>
                </CardContent>
              </Card>
            )}

            {harvest.notes && (
              <Card className={harvest.location ? "md:col-span-1" : "md:col-span-2"}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <StickyNote className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-gray-900">Notes</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{harvest.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Image Gallery for multiple images */}
          {hasMultipleImages && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">All Photos</h3>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {harvest.images!.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => goToImage(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-green-500 ring-2 ring-green-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.public_url || '/placeholder.svg'}
                        alt={`${harvest.crop_name} photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg'
                        }}
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                Created: {new Date(harvest.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {harvest.updated_at !== harvest.created_at && (
                <span>
                  Updated: {new Date(harvest.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 