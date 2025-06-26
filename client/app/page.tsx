"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Apple, Calendar, MapPin, Camera, List } from "lucide-react"
import Link from "next/link"
import { harvestLogsApi, ApiError } from "@/lib/api"

interface HarvestForm {
  fruit: string
  quantity: string
  weight: string
  date: string
  notes: string
}

export default function HomePage() {
  const [formData, setFormData] = useState<HarvestForm>({
    fruit: "",
    quantity: "",
    weight: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])

  const handleInputChange = (field: keyof HarvestForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos((prev) => [...prev, ...files].slice(0, 5))
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
      
      if (result.success) {
        // Reset form on success
        setFormData({
          fruit: "",
          quantity: "",
          weight: "",
          date: new Date().toISOString().split("T")[0],
          notes: "",
        })
        setPhotos([])
        
        alert("Harvest logged successfully!")
      } else {
        throw new Error(result.message || 'Failed to create harvest log')
      }
      
    } catch (error) {
      console.error('Error submitting harvest log:', error)
      if (error instanceof ApiError) {
        alert(`Failed to log harvest: ${error.message}`)
      } else {
        alert(`Failed to log harvest: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
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
                      type="date"
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
                <Label>Photos (optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Click to add photos</p>
                    <p className="text-sm text-gray-500 mt-1">Up to 5 photos</p>
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo) || "/placeholder.svg"}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
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
                {isSubmitting ? "Saving..." : "Log Harvest"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">47</div>
              <div className="text-sm text-gray-600">Total Harvests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600">This Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Varieties</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
