"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, X, RotateCw, ImageIcon, SwitchCamera } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onClose: () => void
  isOpen: boolean
}

export function CameraCapture({ onCapture, onClose, isOpen }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment') // Start with back camera for harvest photos
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // Check if device has multiple cameras
  const checkForMultipleCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setHasMultipleCameras(videoDevices.length > 1)
    } catch (err) {
      console.log('Could not enumerate devices:', err)
    }
  }, [])

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!isOpen) return

    setIsInitializing(true)
    setError(null)

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 2560, max: 2560 },
          height: { ideal: 1440, max: 1440 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      await checkForMultipleCameras()
    } catch (err) {
      console.error('Error accessing camera:', err)
      let errorMessage = 'Unable to access camera'
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.'
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.'
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this device.'
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsInitializing(false)
    }
  }, [isOpen, facingMode, checkForMultipleCameras])

  // Cleanup camera stream
  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  // Switch between front and back camera
  const switchCamera = useCallback(() => {
    setFacingMode(current => current === 'user' ? 'environment' : 'user')
  }, [])

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Could not get canvas context')
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create image blob'))
          }
        }, 'image/jpeg', 0.98)
      })

      // Create file from blob
      const file = new File([blob], `harvest-photo-${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      onCapture(file)
      onClose()
    } catch (err) {
      console.error('Error capturing photo:', err)
      setError('Failed to capture photo. Please try again.')
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, onCapture, onClose])

  // Initialize camera when component opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera()
    } else {
      cleanupCamera()
    }

    return cleanupCamera
  }, [isOpen, initializeCamera, cleanupCamera])

  // Handle camera switching
  useEffect(() => {
    if (isOpen && streamRef.current) {
      initializeCamera()
    }
  }, [facingMode, isOpen, initializeCamera])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-black border-gray-700">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
            <h3 className="text-lg font-semibold">Take Photo</h3>
            <div className="flex items-center gap-2">
              {hasMultipleCameras && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={switchCamera}
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

          {/* Camera View */}
          <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
                <Camera className="w-16 h-16 mb-4 text-gray-500" />
                <p className="text-lg mb-2">Camera Error</p>
                <p className="text-sm text-gray-300 mb-4">{error}</p>
                <Button onClick={initializeCamera} disabled={isInitializing}>
                  {isInitializing ? 'Retrying...' : 'Try Again'}
                </Button>
              </div>
            ) : (
              <>
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
                      <p>Initializing camera...</p>
                    </div>
                  </div>
                )}

                {/* Capture overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="flex items-center justify-center">
                    <Button
                      size="lg"
                      onClick={capturePhoto}
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
                      {isCapturing ? 'Capturing...' : 'Tap to capture'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-gray-900 text-white text-center">
            <p className="text-sm text-gray-300">
              Point your camera at the harvest and tap the capture button
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 