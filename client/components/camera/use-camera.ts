import { useState, useRef, useCallback, useEffect } from 'react'

export function useCamera(isOpen: boolean, facingMode: 'user' | 'environment') {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
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
          // Request maximum available resolution for better quality
          width: { ideal: 4096, max: 4096 },
          height: { ideal: 3072, max: 3072 },
          // Additional quality settings for mobile devices
          frameRate: { ideal: 30, max: 60 },
          aspectRatio: { ideal: 4/3 }
        },
        audio: false
      }

      console.log('📱 Requesting camera with constraints:', constraints)

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Log the actual capabilities we got
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : null
        
        console.log('📹 Camera settings received:', {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          facingMode: settings.facingMode,
          aspectRatio: settings.aspectRatio
        })
        
        if (capabilities) {
          console.log('📹 Camera capabilities:', {
            width: capabilities.width,
            height: capabilities.height,
            frameRate: capabilities.frameRate,
            facingMode: capabilities.facingMode
          })
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        
        // Log video element properties once it's loaded
        videoRef.current.addEventListener('loadedmetadata', () => {
          console.log('🎥 Video element properties:', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            clientWidth: videoRef.current?.clientWidth,
            clientHeight: videoRef.current?.clientHeight
          })
        })
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

  // Capture photo
  const capturePhoto = useCallback(async (onCapture: (file: File) => void, onClose: () => void) => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Could not get canvas context')
      }

      // Set canvas dimensions to match video - using actual video resolution
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Log the actual resolution being captured for debugging
      console.log('📸 Camera capture info:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        aspectRatio: (video.videoWidth / video.videoHeight).toFixed(2)
      })

      // Configure canvas for high quality rendering
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'

      // Draw video frame to canvas at full resolution
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob with maximum quality
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create image blob'))
          }
        }, 'image/jpeg', 1.0) // Maximum JPEG quality
      })

      // Log the resulting file size for debugging
      console.log('📸 Captured photo info:', {
        size: blob.size,
        sizeKB: Math.round(blob.size / 1024),
        sizeMB: (blob.size / (1024 * 1024)).toFixed(2)
      })

      // Create file from blob
              const file = new File([blob], `plant-photo-${Date.now()}.jpg`, {
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
  }, [isCapturing])

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

  return {
    videoRef,
    canvasRef,
    isInitializing,
    error,
    isCapturing,
    hasMultipleCameras,
    initializeCamera,
    capturePhoto
  }
}