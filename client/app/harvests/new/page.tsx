"use client"

import type React from "react"

import { useState } from "react"
import { harvestLogsApi, ApiError, type HarvestLogData } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CameraCapture } from "@/components/camera/camera-capture"
import { Calendar, MapPin, Upload, X, Camera } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface HarvestForm {
  fruit: string
  variety: string
  quantity: string
  weight: string
  unit: string
  date: string
  location: string
  weather: string
  notes: string
  quality: string
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function NewHarvestPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [formData, setFormData] = useState<HarvestForm>({
    fruit: "",
    variety: "",
    quantity: "",
    weight: "",
    unit: "pieces",
    date: new Date().toISOString().split("T")[0],
    location: "",
    weather: "",
    notes: "",
    quality: "",
  })

  const handleInputChange = (field: keyof HarvestForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos((prev) => [...prev, ...files].slice(0, 10)) // Max 10 photos
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCameraCapture = (file: File) => {
    if (photos.length >= 10) return
    setPhotos((prev) => [...prev, file])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Prepare data for API call
      const harvestData: HarvestLogData = {
        crop_name: formData.fruit,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        harvest_date: new Date(formData.date).toISOString(),
        location: formData.location || undefined,
        notes: formData.notes || undefined,
        coordinates: coordinates || undefined,
      }

      // Call the API
      const response = await harvestLogsApi.create(harvestData)
      
      if (response.success) {
        router.push("/harvests")
      } else {
        setError(response.message || "Failed to save harvest log")
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ latitude, longitude });
          handleInputChange("location", `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
        },
        (error) => {
          setError("Error getting location: " + error.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Harvest</h1>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center text-red-800">
                  <div className="w-4 h-4 mr-2">⚠️</div>
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fruit">What?</Label>
                  <Select value={formData.fruit} onValueChange={(value) => handleInputChange("fruit", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apples">Apples</SelectItem>
                      <SelectItem value="oranges">Oranges</SelectItem>
                      <SelectItem value="berries">Berries</SelectItem>
                      <SelectItem value="pears">Pears</SelectItem>
                      <SelectItem value="peaches">Peaches</SelectItem>
                      <SelectItem value="plums">Plums</SelectItem>
                      <SelectItem value="cherries">Cherries</SelectItem>
                      <SelectItem value="grapes">Grapes</SelectItem>
                      <SelectItem value="strawberries">Strawberries</SelectItem>
                      <SelectItem value="blueberries">Blueberries</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variety">Variety</Label>
                  <Input
                    id="variety"
                    placeholder="Honeycrisp, Gala"
                    value={formData.variety}
                    onChange={(e) => handleInputChange("variety", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Amount</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    placeholder="12"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="pounds">Pounds</SelectItem>
                      <SelectItem value="kilograms">Kilograms</SelectItem>
                      <SelectItem value="ounces">Ounces</SelectItem>
                      <SelectItem value="grams">Grams</SelectItem>
                      <SelectItem value="bushels">Bushels</SelectItem>
                      <SelectItem value="baskets">Baskets</SelectItem>
                      <SelectItem value="cups">Cups</SelectItem>
                      <SelectItem value="pints">Pints</SelectItem>
                      <SelectItem value="quarts">Quarts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="5.2"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality">Quality</Label>
                <Select value={formData.quality} onValueChange={(value) => handleInputChange("quality", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location & Date */}
          <Card>
            <CardHeader>
              <CardTitle>When & Where</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="location"
                        placeholder="Garden area"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={getCurrentLocation}>
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Weather</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weather">Conditions</Label>
                <div className="flex gap-2">
                  <Input
                    id="weather"
                    placeholder="Sunny, 75°F"
                    value={formData.weather}
                    onChange={(e) => handleInputChange("weather", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={getCurrentWeather}>
                    Auto-fill
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photo Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                {photos.length >= 10 ? (
                  <div>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Maximum photos reached</p>
                    <p className="text-sm text-gray-500 mt-1">Remove a photo to add more</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600 mb-4">Add photos</p>
                    
                    {/* Mobile-first buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={photos.length >= 10}
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
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          disabled={photos.length >= 10}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Files
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-3">
                      Up to 10 photos
                    </p>
                  </div>
                )}
              </div>

              {/* Photo Preview */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={URL.createObjectURL(photo) || "/placeholder.svg"}
                        alt={`Harvest photo ${index + 1}`}
                        width={200}
                        height={96}
                        className="w-full h-24 object-cover rounded-lg"
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notes about taste, quality, conditions..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || !formData.fruit || !formData.quantity || !formData.unit}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>

      {/* Camera Capture */}
      <CameraCapture
        isOpen={showCamera}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    </div>
  )
}
