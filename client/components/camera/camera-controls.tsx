"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { SwitchCamera, X, RotateCw, Camera } from "lucide-react"

interface CameraControlsProps {
  hasMultipleCameras: boolean
  isInitializing: boolean
  isCapturing: boolean
  error: string | null
  onSwitchCamera: () => void
  onClose: () => void
  onCapture: () => void
  onRetry: () => void
}

export const CameraControls = React.memo(function CameraControls({
  hasMultipleCameras,
  isInitializing,
  isCapturing,
  error,
  onSwitchCamera,
  onClose,
  onCapture,
  onRetry
}: CameraControlsProps) {
  return (
    <>
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
        <h3 className="text-lg font-semibold">Camera</h3>
        <div className="flex items-center gap-2">
          {hasMultipleCameras && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSwitchCamera}
              disabled={isInitializing}
              className="text-white hover:bg-gray-700"
            >
              <SwitchCamera className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Capture Controls */}
      {!error && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center justify-center">
            <Button
              size="lg"
              onClick={onCapture}
              disabled={isInitializing || isCapturing || !!error}
              className="w-16 h-16 rounded-full bg-white hover:bg-gray-200 text-black border-4 border-gray-300"
            >
              {isCapturing ? (
                <RotateCw className="w-6 h-6 animate-spin" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </Button>
          </div>
          
          <div className="text-center mt-2">
            <p className="text-white text-sm">
              {isCapturing ? 'Taking...' : 'Tap to take'}
            </p>
          </div>
        </div>
      )}

      {/* Error Controls */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
          <Camera className="w-16 h-16 mb-4 text-gray-500" />
          <p className="text-lg mb-2">Error</p>
          <p className="text-sm text-gray-300 mb-4">{error}</p>
          <Button onClick={onRetry} disabled={isInitializing}>
            {isInitializing ? 'Retrying...' : 'Try Again'}
          </Button>
        </div>
      )}
    </>
  )
})