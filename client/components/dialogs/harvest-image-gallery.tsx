"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Camera } from "lucide-react"
import { type HarvestImage } from "@/lib/api"

interface HarvestImageGalleryProps {
  images: HarvestImage[]
}

export const HarvestImageGallery = React.memo(function HarvestImageGallery({ images }: HarvestImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Camera className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    )
  }

  const hasMultipleImages = images.length > 1
  const currentImage = images[currentImageIndex]

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)
  }

  return (
    <div className="relative">
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        <img
          src={currentImage.public_url || "/placeholder.svg"}
          alt={`Harvest photo ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {hasMultipleImages && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={previousImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 rounded-full w-8 h-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 rounded-full w-8 h-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
})