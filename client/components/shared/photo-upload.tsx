'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, X, Camera, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { CameraCapture } from '@/components/camera/camera-capture'
import { useImageCompression } from '@/lib/useImageCompression'

interface PhotoUploadProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  maxImages?: number
  label?: string
  description?: string
  themeColor?: 'green' | 'pink' | 'blue'
  isProcessing?: boolean
  disabled?: boolean
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  label = "Photos (Optional)",
  themeColor = 'green',
  isProcessing = false,
  disabled = false
}) => {
  const [showCamera, setShowCamera] = useState(false)
  const [processingImages, setProcessingImages] = useState(false)
  
  // Image compression hook
  const { compressImage, isCompressing, compressionProgress, compressionError } = useImageCompression()

  const themeColors = {
    green: 'text-green-700',
    pink: 'text-pink-700', 
    blue: 'text-blue-700'
  }

  // Process and compress images
  const processImages = async (files: File[]) => {
    setProcessingImages(true)
    const processedImages: File[] = []
    
    try {
      for (const file of files) {
        // Log file details for debugging
        console.log('🔍 Processing file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          sizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
        })
        
        try {
          // Use conservative compression settings for phone images
          const isPhoneImage = /^\d+_\d+\.jpg$/i.test(file.name) || 
                             /^IMG_\d+\.jpg$/i.test(file.name) ||
                             /^DSC_\d+\.jpg$/i.test(file.name) ||
                             /^PXL_\d+\.jpg$/i.test(file.name)
          
          const compressionOptions = {
            maxSizeMB: isPhoneImage ? 2.0 : 1.0, // More lenient for phone images
            maxWidthOrHeight: isPhoneImage ? 2048 : 1600, // Higher resolution for phone images
            quality: isPhoneImage ? 0.85 : 0.8, // Higher quality for phone images
            convertToWebP: !isPhoneImage, // Disable WebP for phone images to avoid issues
            preserveExif: false // Remove EXIF data to avoid orientation issues
          }
          
          console.log('⚙️ Compression settings:', {
            file: file.name,
            isPhoneImage,
            options: compressionOptions
          })
          
          const result = await compressImage(file, compressionOptions)
          
          // Show compression stats with method used
          console.log('📸 Image compressed successfully:', {
            original: (result.originalSize / (1024 * 1024)).toFixed(2) + 'MB',
            compressed: (result.compressedSize / (1024 * 1024)).toFixed(2) + 'MB',
            savings: result.compressionRatio,
            method: result.method,
            warnings: result.warnings
          })
          
          // Show warnings to user if any
          if (result.warnings && result.warnings.length > 0) {
            console.warn('⚠️ Compression warnings:', result.warnings)
            toast({
              title: 'Compression Notice',
              description: `${file.name}: ${result.warnings.join(', ')}`,
              variant: 'default',
            })
          }
          
          processedImages.push(result.compressedFile)
          
        } catch (error) {
          console.error('❌ Failed to compress image:', {
            file: file.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          
          // Determine if we should use original or skip the file
          const isTooBig = file.size > 10 * 1024 * 1024 // 10MB
          
          if (isTooBig) {
            toast({
              title: 'File Too Large',
              description: `${file.name} is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller image.`,
              variant: 'destructive',
            })
          } else {
            toast({
              title: 'Compression Failed',
              description: `Failed to compress ${file.name}. Using original file (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
              variant: 'default',
            })
            // Use original file if compression fails and it's not too big
            processedImages.push(file)
          }
        }
      }
      
      return processedImages
    } catch (error) {
      console.error('❌ Batch processing failed:', error)
      toast({
        title: 'Processing Error',
        description: 'Failed to process images. Please try again.',
        variant: 'destructive',
      })
      return []
    } finally {
      setProcessingImages(false)
    }
  }

  // Handle camera capture
  const handleCameraCapture = async (file: File) => {
    console.log('📷 Camera captured image:', {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      type: file.type
    })
    
    const processedImages = await processImages([file])
    onImagesChange([...images, ...processedImages].slice(0, maxImages))
    setShowCamera(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB (generous limit before compression)
      
      if (!isImage) {
        toast({
          title: 'Invalid File',
          description: `${file.name} is not an image file.`,
          variant: 'destructive',
        })
        return false
      }
      
      if (!isValidSize) {
        toast({
          title: 'File Too Large',
          description: `${file.name} is larger than 50MB.`,
          variant: 'destructive',
        })
        return false
      }
      
      return true
    })

    if (validFiles.length > 0) {
      const processedImages = await processImages(validFiles)
      onImagesChange([...images, ...processedImages].slice(0, maxImages))
    }
    
    // Clear the input so the same file can be selected again
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className={`text-sm font-medium ${themeColors[themeColor]}`}>
        {label}
      </div>
      
      {/* Photo Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload from Device */}
        <label
          htmlFor="photo-upload"
          className="border-2 border-dashed border-muted rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer block"
        >
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-2">
              <span className="block text-sm font-medium text-foreground">
                Upload Photos
              </span>
              <span className="block text-xs text-muted-foreground mt-1">
                From your device
              </span>
            </div>
          </div>
          <input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="sr-only"
            disabled={disabled || processingImages || isCompressing}
          />
        </label>

        {/* Take Photo with Camera */}
        <button
          type="button"
          onClick={() => setShowCamera(true)}
          disabled={disabled || processingImages || isCompressing || images.length >= maxImages}
          className="border-2 border-dashed border-muted rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="text-center">
            <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-2">
              <span className="block text-sm font-medium text-foreground">
                Take Photo
              </span>
              <span className="block text-xs text-muted-foreground mt-1">
                Use camera
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Processing Indicator */}
      {(processingImages || isCompressing || isProcessing) && (
        <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">
            {isCompressing 
              ? `Compressing images... ${compressionProgress}%`
              : 'Processing images...'
            }
          </span>
        </div>
      )}

      {/* Compression Error */}
      {compressionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            Compression error: {compressionError}
          </p>
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Images will be automatically compressed • Up to {maxImages} photos • Phone images optimized for best quality
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          {images.map((file, index) => (
            <div key={index} className="relative">
              <Image
                src={URL.createObjectURL(file)}
                alt={`Photo ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
                width={200}
                height={96}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
              <div className="text-xs text-gray-500 mt-1 truncate">
                {file.name}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)}MB
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera Modal */}
      <CameraCapture
        isOpen={showCamera}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    </div>
  )
}