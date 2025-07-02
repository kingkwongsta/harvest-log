'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Upload, X, Calendar, Camera, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { CameraCapture } from '@/components/camera/camera-capture'
import { useImageCompression } from '@/lib/useImageCompression'
import { LocationInput } from '@/components/location/location-input'
import { WeatherDisplay } from '@/components/location/weather-display'
import type { Plant, WeatherData, Coordinates } from '@/lib/api'

export interface HarvestFormData {
  plant_id?: string
  event_date: string
  description?: string
  notes?: string
  produce: string
  quantity: number
  location?: string
  coordinates?: Coordinates
  images?: File[]
}

interface HarvestFormProps {
  plants: Plant[]
  onSubmit: (data: HarvestFormData) => void
  isSubmitting: boolean
  onReset?: () => void
}

export interface HarvestFormRef {
  reset: () => void
}

const commonProduce = [
  'Tomatoes',
  'Lettuce',
  'Carrots',
  'Peppers',
  'Cucumbers',
  'Zucchini',
  'Beans',
  'Peas',
  'Corn',
  'Squash',
  'Eggplant',
  'Broccoli',
  'Cabbage',
  'Spinach',
  'Kale',
  'Radishes',
  'Onions',
  'Potatoes',
  'Herbs',
  'Berries'
]


export const HarvestForm = forwardRef<HarvestFormRef, HarvestFormProps>(
  ({ plants, onSubmit, isSubmitting, onReset }, ref) => {
    // Common event fields
    const [selectedPlant, setSelectedPlant] = useState('')
    const [eventDate, setEventDate] = useState(new Date())
    const [description, setDescription] = useState('')
    const [notes, setNotes] = useState('')
    
    // Harvest-specific fields
    const [produce, setProduce] = useState('')
    const [customProduce, setCustomProduce] = useState('')
    const [quantity, setQuantity] = useState('')
    const [images, setImages] = useState<File[]>([])
    const [showCamera, setShowCamera] = useState(false)
    const [processingImages, setProcessingImages] = useState(false)
    
    // Location and weather fields
    const [location, setLocation] = useState('')
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
    
    // Image compression hook
    const { compressImage, isCompressing, compressionProgress, compressionError } = useImageCompression()

    const resetForm = () => {
      console.log('🧹 HarvestForm resetForm called')
      console.log('📊 Current values before reset:', { produce, quantity, images: images.length })
      // Reset common fields
      setSelectedPlant('')
      setEventDate(new Date())
      setDescription('')
      setNotes('')
      // Reset harvest-specific fields
      setProduce('')
      setCustomProduce('')
      setQuantity('')
      setImages([])
      setShowCamera(false)
      setProcessingImages(false)
      // Reset location and weather fields
      setLocation('')
      setCoordinates(null)
      setWeatherData(null)
      onReset?.()
      console.log('✅ HarvestForm reset completed')
    }

    useImperativeHandle(ref, () => ({
      reset: resetForm
    }))

    // Process and compress images
    const processImages = async (files: File[]) => {
      setProcessingImages(true)
      const processedImages: File[] = []
      
      try {
        for (const file of files) {
          try {
            const result = await compressImage(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1600,
              quality: 0.8,
              convertToWebP: false
            })
            
            // Show compression stats
            console.log('📸 Image compressed:', {
              original: (result.originalSize / (1024 * 1024)).toFixed(2) + 'MB',
              compressed: (result.compressedSize / (1024 * 1024)).toFixed(2) + 'MB',
              savings: result.compressionRatio
            })
            
            processedImages.push(result.compressedFile)
          } catch (error) {
            console.error('Failed to compress image:', file.name, error)
            toast({
              title: 'Compression Error',
              description: `Failed to compress ${file.name}. Using original file.`,
              variant: 'destructive',
            })
            // Use original file if compression fails
            processedImages.push(file)
          }
        }
        
        return processedImages
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
      setImages(prev => [...prev, ...processedImages].slice(0, 5))
      setShowCamera(false)
    }

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const finalProduce = produce === 'custom' ? customProduce : produce
    if (!finalProduce.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please specify what you harvested.',
        variant: 'destructive',
      })
      return
    }

    if (finalProduce.trim().length > 100) {
      toast({
        title: 'Validation Error',
        description: 'Product name must be 100 characters or less.',
        variant: 'destructive',
      })
      return
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid quantity.',
        variant: 'destructive',
      })
      return
    }

    onSubmit({
      plant_id: selectedPlant || undefined,
      event_date: eventDate.toISOString(),
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      produce: finalProduce.trim(),
      quantity: parseFloat(quantity),
      location: location.trim() || undefined,
      coordinates: coordinates || undefined,
      images: images.length > 0 ? images : undefined,
    })
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
      setImages(prev => [...prev, ...processedImages].slice(0, 5)) // Limit to 5 images
    }
    
    // Clear the input so the same file can be selected again
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-green-700 flex items-center">
            🌾 Harvest Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Details Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-green-700">Event Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plant">Plant</Label>
                <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plants.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id}>
                        {plant.name} {plant.variety && `(${plant.variety.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-date">Event Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="event-date"
                    type="datetime-local"
                    value={eventDate.toISOString().slice(0, 16)}
                    onChange={(e) => setEventDate(new Date(e.target.value))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this harvest event..."
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional observations, conditions, or details..."
                rows={3}
                maxLength={2000}
              />
            </div>

            {/* Location Section */}
            <LocationInput
              location={location}
              onLocationChange={setLocation}
              coordinates={coordinates}
              onCoordinatesChange={setCoordinates}
              onWeatherData={setWeatherData}
              eventDate={eventDate.toISOString().split('T')[0]}
              disabled={isSubmitting}
              defaultLocation="Torrance, CA"
            />

            {/* Weather Display */}
            {weatherData && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-700">Weather Conditions</Label>
                <WeatherDisplay weather={weatherData} compact />
              </div>
            )}
          </div>

          <Separator />

          {/* Harvest Details Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-green-700">Harvest Details</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="produce">What did you harvest? *</Label>
                <Select value={produce} onValueChange={setProduce} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select produce..." />
                  </SelectTrigger>
                  <SelectContent>
                    {commonProduce.map(produceOption => (
                      <SelectItem key={produceOption} value={produceOption}>
                        {produceOption}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom produce...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="2.5"
                  required
                />
              </div>
            </div>

            {produce === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-produce">Custom Produce</Label>
                <Input
                  id="custom-produce"
                  value={customProduce}
                  onChange={(e) => setCustomProduce(e.target.value)}
                  placeholder="Enter custom produce..."
                  maxLength={100}
                  required
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Photos Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-green-700">Harvest Photos</Label>
            
            {/* Photo Upload Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload from Device */}
              <label
                htmlFor="harvest-images"
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
                  id="harvest-images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                  disabled={processingImages || isCompressing}
                />
              </label>

              {/* Take Photo with Camera */}
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                disabled={processingImages || isCompressing || images.length >= 5}
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
            {(processingImages || isCompressing) && (
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
              Images will be compressed to 1MB max • Up to 5 photos • WebP format for optimal web performance
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                {images.map((file, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Harvest ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                      width={200}
                      height={96}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button 
          type="submit" 
          disabled={isSubmitting || processingImages || isCompressing} 
          variant="harvest" 
          size="lg"
        >
          {isSubmitting ? 'Logging Harvest...' : 'Log Harvest Event'}
        </Button>
      </div>

      {/* Camera Modal */}
      <CameraCapture
        isOpen={showCamera}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    </form>
  )
})

HarvestForm.displayName = 'HarvestForm'