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
import { Apple, Calendar, MapPin, Camera, List, X } from "lucide-react"
import Link from "next/link"
import { harvestLogsApi, imagesApi, ApiError, HarvestStats } from "@/lib/api"

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [stats, setStats] = useState<HarvestStats>({
    total_harvests: 0,
    this_month: 0,
    this_week: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos((prev) => [...prev, ...files].slice(0, 5))
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
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
            // Upload multiple photos at once
            const imageResult = await imagesApi.uploadMultiple(newHarvestId, photos)
            
            if (imageResult.success && imageResult.data) {
              const { total_uploaded, total_failed, failed_uploads } = imageResult.data
              
              if (total_failed > 0) {
                photoUploadSuccess = false
                photoErrors = failed_uploads.map(f => `${f.filename}: ${f.error}`)
                console.warn('Some photos failed to upload:', failed_uploads)
              }
              
              console.log(`Successfully uploaded ${total_uploaded} photos`)
            } else {
              photoUploadSuccess = false
              photoErrors.push(imageResult.message || 'Unknown photo upload error')
            }
          } catch (photoError) {
            photoUploadSuccess = false
            photoErrors.push(photoError instanceof Error ? photoError.message : 'Photo upload failed')
            console.error('Photo upload error:', photoError)
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
                  {photos.length > 0 && (
                    <span className="text-sm text-gray-500">{photos.length}/5 photos</span>
                  )}
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={photos.length >= 5}
                  />
                  <label htmlFor="photo-upload" className={`cursor-pointer ${photos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">
                      {photos.length >= 5 ? 'Maximum photos reached' : 'Click to add photos'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Up to 5 photos</p>
                  </label>
                </div>

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
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-b">
                          {photo.name}
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
                disabled={isSubmitting || !formData.fruit || !formData.quantity}
              >
                {isSubmitting ? (
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
    </div>
  )
}
