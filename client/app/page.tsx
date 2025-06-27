"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SuccessDialog } from "@/components/ui/success-dialog"
import { ErrorDialog } from "@/components/ui/error-dialog"
import { Progress } from "@/components/ui/progress"
import { CameraCapture } from "@/components/ui/camera-capture"
import { Apple, Calendar, MapPin, Camera, List, X, Upload } from "lucide-react"
import Link from "next/link"
import { harvestLogsApi, imagesApi, ApiError, HarvestStats } from "@/lib/api"
import { useImageCompression } from "@/lib/useImageCompression"

interface HarvestForm {
  fruit: string
  quantity: string
  weight: string
  date: string
  notes: string
}

// Helper function to get current local date/time formatted for datetime-local input
const getCurrentLocalDateTime = () => {
  const now = new Date()
  // Get the timezone offset and adjust for local time
  const offset = now.getTimezoneOffset() * 60000 // offset in milliseconds
  const localTime = new Date(now.getTime() - offset)
  return localTime.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
}

export default function HomePage() {
  const [formData, setFormData] = useState<HarvestForm>({
    fruit: "",
    quantity: "",
    weight: "",
    date: getCurrentLocalDateTime(), // Use user's local timezone
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [originalPhotos, setOriginalPhotos] = useState<File[]>([])
  const [compressionStats, setCompressionStats] = useState<Array<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: string;
  }>>([])
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [stats, setStats] = useState<HarvestStats>({
    total_harvests: 0,
    this_month: 0,
    this_week: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Image compression hook
  const { 
    compressMultipleImages, 
    isCompressing, 
    compressionError, 
    compressionProgress,
    getReadableFileSize 
  } = useImageCompression()

  // Fetch harvest statistics on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true)
        const response = await harvestLogsApi.getStats()
        if (response.success && response.data) {
          setStats(response.data)
        }
      } catch (error) {
        console.error('Error fetching harvest stats:', error)
        // Keep default values if API fails
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  // Refetch stats after successful harvest creation
  const refetchStats = async () => {
    try {
      const response = await harvestLogsApi.getStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error refetching harvest stats:', error)
    }
  }

  const handleInputChange = (field: keyof HarvestForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles = files.slice(0, 5 - photos.length) // Ensure we don't exceed 5 total photos
    
    if (newFiles.length === 0) return

    try {
      // Store original files for reference
      setOriginalPhotos((prev) => [...prev, ...newFiles])
      
      // Compress images with settings optimized for harvest photos  
      const compressionResults = await compressMultipleImages(newFiles, {
        maxSizeMB: 0.5, // Smaller file size for faster uploads
        maxWidthOrHeight: 1200, // Sufficient resolution for harvest documentation
        quality: 0.85, // Good balance of quality and size
        convertToWebP: true, // Best compression format
      })

      // Extract compressed files and stats
      const compressedFiles: File[] = []
      const newCompressionStats: Array<{
        originalSize: number;
        compressedSize: number;
        compressionRatio: string;
      }> = []

      compressionResults.forEach((result) => {
        if (result.success && result.data) {
          compressedFiles.push(result.data.compressedFile)
          newCompressionStats.push({
            originalSize: result.data.originalSize,
            compressedSize: result.data.compressedSize,
            compressionRatio: result.data.compressionRatio,
          })
        } else {
          // If compression fails, use original file
          console.warn('Compression failed for file, using original:', result.error)
          compressedFiles.push(result.originalFile)
          newCompressionStats.push({
            originalSize: result.originalFile.size,
            compressedSize: result.originalFile.size,
            compressionRatio: '0%',
          })
        }
      })

      setPhotos((prev) => [...prev, ...compressedFiles])
      setCompressionStats((prev) => [...prev, ...newCompressionStats])

    } catch (error) {
      console.error('Error processing photos:', error)
      // Fallback to original files if compression fails completely
      setPhotos((prev) => [...prev, ...newFiles])
      setOriginalPhotos((prev) => [...prev, ...newFiles])
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setOriginalPhotos((prev) => prev.filter((_, i) => i !== index))
    setCompressionStats((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCameraCapture = async (file: File) => {
    if (photos.length >= 5) return

    try {
      // Store original file for reference
      setOriginalPhotos((prev) => [...prev, file])
      
      // Compress captured image with settings optimized for harvest photos  
      const compressionResults = await compressMultipleImages([file], {
        maxSizeMB: 0.5, // Smaller file size for faster uploads
        maxWidthOrHeight: 1200, // Sufficient resolution for harvest documentation
        quality: 0.85, // Good balance of quality and size
        convertToWebP: true, // Best compression format
      })

      // Extract compressed file and stats
      const result = compressionResults[0]
      if (result.success && result.data !== null) {
        const compressedData = result.data
        setPhotos((prev) => [...prev, compressedData.compressedFile])
        setCompressionStats((prev) => [...prev, {
          originalSize: compressedData.originalSize,
          compressedSize: compressedData.compressedSize,
          compressionRatio: compressedData.compressionRatio,
        }])
      } else {
        // If compression fails, use original file
        console.warn('Compression failed for camera capture, using original:', result.error)
        setPhotos((prev) => [...prev, file])
        setCompressionStats((prev) => [...prev, {
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: '0%',
        }])
      }
    } catch (error) {
      console.error('Error processing camera capture:', error)
      // Fallback to original file if compression fails completely
      setPhotos((prev) => [...prev, file])
      setOriginalPhotos((prev) => [...prev, file])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Map frontend form data to backend API format
      const harvestLogData = {
        crop_name: formData.fruit,
        quantity: parseFloat(formData.quantity),
        unit: formData.weight ? formData.weight : "pieces", // Use weight as unit if provided, otherwise default to "pieces"
        harvest_date: new Date(formData.date).toISOString(),
        location: undefined, // Can be added later if needed
        notes: formData.notes || undefined
      }

      // Send data to FastAPI backend using API helper
      const result = await harvestLogsApi.create(harvestLogData)
      
      if (result.success && result.data) {
        const newHarvestId = result.data.id
        
        // Upload photos if any were selected
        let photoUploadSuccess = true
        let photoErrors: string[] = []
        
        if (photos.length > 0) {
          try {
            console.log('🖼️ Starting photo upload process:', {
              harvestId: newHarvestId,
              photoCount: photos.length,
              photos: photos.map(p => ({
                name: p.name,
                size: p.size,
                type: p.type,
                lastModified: p.lastModified
              }))
            });

            // Upload multiple photos at once
            const imageResult = await imagesApi.uploadMultiple(newHarvestId, photos)
            
            console.log('📸 Image upload result received:', {
              success: imageResult.success,
              message: imageResult.message,
              data: imageResult.data
            });
            
            if (imageResult.success && imageResult.data) {
              const { total_uploaded, total_failed, failed_uploads } = imageResult.data
              
              console.log('📊 Upload statistics:', {
                total_uploaded,
                total_failed,
                failed_uploads
              });
              
              if (total_failed > 0) {
                photoUploadSuccess = false
                photoErrors = failed_uploads.map(f => `${f.filename}: ${f.error}`)
                console.warn('⚠️ Some photos failed to upload:', failed_uploads)
              }
              
              console.log(`✅ Successfully uploaded ${total_uploaded} photos`)
            } else {
              photoUploadSuccess = false
              const errorMsg = imageResult.message || 'Unknown photo upload error'
              photoErrors.push(errorMsg)
              console.error('❌ Photo upload failed:', {
                success: imageResult.success,
                message: imageResult.message,
                data: imageResult.data
              });
              
              // Log detailed failure information
              if (imageResult.data && imageResult.data.failed_uploads) {
                console.error('🔍 Failed upload details:', imageResult.data.failed_uploads);
                imageResult.data.failed_uploads.forEach((failedUpload, index) => {
                  console.error(`📄 File ${index + 1} (${failedUpload.filename}):`, failedUpload.error);
                });
              }
            }
          } catch (photoError) {
            photoUploadSuccess = false
            const errorMsg = photoError instanceof Error ? photoError.message : 'Photo upload failed'
            photoErrors.push(errorMsg)
            console.error('💥 Photo upload exception:', {
              error: photoError,
              message: errorMsg,
              stack: photoError instanceof Error ? photoError.stack : undefined
            });
          }
        }

        // Reset form on success
        setFormData({
          fruit: "",
          quantity: "",
          weight: "",
          date: getCurrentLocalDateTime(), // Use user's local timezone
          notes: "",
        })
        setPhotos([])
        setOriginalPhotos([])
        setCompressionStats([])
        
        // Refetch stats to update the UI
        await refetchStats()
        
        // Show success dialog with photo upload status
        if (photoUploadSuccess || photos.length === 0) {
          setShowSuccessDialog(true)
        } else {
          setErrorMessage(`Harvest logged successfully, but some photos failed to upload:\n${photoErrors.join('\n')}`)
          setShowErrorDialog(true)
        }
      } else {
        throw new Error(result.message || 'Failed to create harvest log')
      }
      
    } catch (error) {
      console.error('Error submitting harvest log:', error)
      if (error instanceof ApiError) {
        setErrorMessage(`Failed to log harvest: ${error.message}`)
      } else {
        setErrorMessage(`Failed to log harvest: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      setShowErrorDialog(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Apple className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Harvest Log</h1>
            </div>
            <Link href="/harvests">
              <Button variant="outline" size="sm">
                <List className="w-4 h-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Log Your Harvest</h2>
          <p className="text-gray-600">Keep track of what you've grown and harvested</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Harvest Entry</CardTitle>
            <CardDescription>Record the details of your latest harvest</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fruit">What did you harvest? *</Label>
                  <Select value={formData.fruit} onValueChange={(value) => handleInputChange("fruit", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fruit/vegetable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apples">Apples</SelectItem>
                      <SelectItem value="tomatoes">Tomatoes</SelectItem>
                      <SelectItem value="berries">Berries</SelectItem>
                      <SelectItem value="oranges">Oranges</SelectItem>
                      <SelectItem value="peppers">Peppers</SelectItem>
                      <SelectItem value="lettuce">Lettuce</SelectItem>
                      <SelectItem value="carrots">Carrots</SelectItem>
                      <SelectItem value="herbs">Herbs</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">How many? *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="e.g., 12"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Unit/Weight (optional)</Label>
                  <Input
                    id="weight"
                    placeholder="e.g., lbs, kg, pieces"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">When? *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="date"
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>



              {/* Photo Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Photos (optional)</Label>
                  <div className="flex items-center space-x-2">
                    {compressionStats.length > 0 && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        {compressionStats.reduce((total, stat) => total + (stat.originalSize - stat.compressedSize), 0) > 0 && (
                          <>
                            Saved {getReadableFileSize(
                              compressionStats.reduce((total, stat) => total + (stat.originalSize - stat.compressedSize), 0)
                            )}
                          </>
                        )}
                      </span>
                    )}
                    {photos.length > 0 && (
                      <span className="text-sm text-gray-500">{photos.length}/5 photos</span>
                    )}
                  </div>
                </div>
                
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isCompressing 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-green-400'
                }`}>
                  {isCompressing ? (
                    <div>
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">
                        Compressing images... {compressionProgress > 0 && `${compressionProgress}%`}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Please wait...</p>
                      
                      {/* Progress bar during compression */}
                      {compressionProgress > 0 && (
                        <div className="mt-3">
                          <Progress value={compressionProgress} className="w-full" />
                        </div>
                      )}
                    </div>
                  ) : photos.length >= 5 ? (
                    <div>
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Maximum photos reached</p>
                      <p className="text-sm text-gray-500 mt-1">Remove a photo to add more</p>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600 mb-4">Add photos of your harvest</p>
                      
                      {/* Mobile-first buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={photos.length >= 5}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </Button>
                        
                        <div className="relative">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                            disabled={photos.length >= 5}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            disabled={photos.length >= 5}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Files
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-3">
                        Up to 5 photos • Auto-compressed for faster upload
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Compression Error */}
                {compressionError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Compression failed: {compressionError}
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo) || "/placeholder.svg"}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-1 rounded-b">
                          <div className="truncate">{photo.name}</div>
                          {compressionStats[index] && (
                            <div className="text-green-300 text-[10px]">
                              {getReadableFileSize(compressionStats[index].compressedSize)}
                              {compressionStats[index].compressionRatio !== '0%' && (
                                <span className="ml-1">(-{compressionStats[index].compressionRatio})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any notes about this harvest? (taste, quality, growing conditions, etc.)"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isSubmitting || isCompressing || !formData.fruit || !formData.quantity}
              >
                {isCompressing ? (
                  `Compressing ${photos.length + 1} image${photos.length > 0 ? 's' : ''}...`
                ) : isSubmitting ? (
                  photos.length > 0 ? "Saving harvest and uploading photos..." : "Saving harvest..."
                ) : (
                  `Log Harvest${photos.length > 0 ? ` & Upload ${photos.length} Photo${photos.length > 1 ? 's' : ''}` : ''}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {isLoadingStats ? "..." : stats.total_harvests}
              </div>
              <div className="text-sm text-gray-600">Total Harvests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {isLoadingStats ? "..." : stats.this_month}
              </div>
              <div className="text-sm text-gray-600">This Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {isLoadingStats ? "..." : stats.this_week}
              </div>
              <div className="text-sm text-gray-600">This Week</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Harvest Logged Successfully!"
        description={`Your harvest has been recorded${photos.length > 0 ? ` with ${photos.length} photo${photos.length > 1 ? 's' : ''}` : ''} and added to your log.`}
        actionLabel="Continue Logging"
        onAction={() => {
          setShowSuccessDialog(false)
        }}
      />

      {/* Error Dialog */}
      <ErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title="Failed to Log Harvest"
        description={errorMessage}
        actionLabel="Try Again"
        onAction={() => {
          setShowErrorDialog(false)
        }}
      />

      {/* Camera Capture */}
      <CameraCapture
        isOpen={showCamera}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    </div>
  )
}
