"use client"

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CameraControls } from './camera-controls'
import { CameraView } from './camera-view'
import { useCamera } from './use-camera'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onClose: () => void
  isOpen: boolean
}

export function CameraCapture({ onCapture, onClose, isOpen }: CameraCaptureProps) {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  
  const {
    videoRef,
    canvasRef,
    isInitializing,
    error,
    isCapturing,
    hasMultipleCameras,
    initializeCamera,
    capturePhoto
  } = useCamera(isOpen, facingMode)

  // Switch between front and back camera
  const switchCamera = useCallback(() => {
    setFacingMode(current => current === 'user' ? 'environment' : 'user')
  }, [])

  const handleCapture = useCallback(() => {
    capturePhoto(onCapture, onClose)
  }, [capturePhoto, onCapture, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-black border-gray-700">
        <CardContent className="p-0">
          <CameraControls
            hasMultipleCameras={hasMultipleCameras}
            isInitializing={isInitializing}
            isCapturing={isCapturing}
            error={error}
            onSwitchCamera={switchCamera}
            onClose={onClose}
            onCapture={handleCapture}
            onRetry={initializeCamera}
          />

          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            isInitializing={isInitializing}
            error={error}
          />

          {/* Info */}
          <div className="p-4 bg-gray-900 text-white text-center">
            <p className="text-sm text-gray-300">
              Point camera and tap to capture
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}