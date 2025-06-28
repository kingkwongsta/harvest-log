"use client"

import React, { RefObject } from "react"
import { RotateCw } from "lucide-react"

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  isInitializing: boolean
  error: string | null
}

export const CameraView = React.memo(function CameraView({ videoRef, canvasRef, isInitializing, error }: CameraViewProps) {
  if (error) {
    return null // Error state is handled by CameraControls
  }

  return (
    <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <RotateCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Starting camera...</p>
          </div>
        </div>
      )}
    </div>
  )
})