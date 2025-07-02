'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Calendar } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { PhotoUpload } from '@/components/shared/photo-upload'
import { LocationInput } from '@/components/location/location-input'
import { WeatherDisplay } from '@/components/location/weather-display'

import type { Plant, Coordinates, WeatherData } from '@/lib/api'

export interface BloomFormData {
  plant_id?: string
  event_date: string
  description?: string
  notes?: string
  location?: string
  coordinates?: Coordinates
  images?: File[]
}

interface BloomFormProps {
  plants: Plant[]
  onSubmit: (data: BloomFormData) => void
  isSubmitting: boolean
  onReset?: () => void
}

export interface BloomFormRef {
  reset: () => void
}

export const BloomForm = forwardRef<BloomFormRef, BloomFormProps>(
  ({ plants, onSubmit, isSubmitting, onReset }, ref) => {
    // Common event fields
    const [selectedPlant, setSelectedPlant] = useState('')
    const [eventDate, setEventDate] = useState(new Date())
    const [description, setDescription] = useState('')
    const [notes, setNotes] = useState('')
    
    // Image upload
    const [images, setImages] = useState<File[]>([])
    
    // Location and weather fields
    const [location, setLocation] = useState('')
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)

    const resetForm = () => {
      console.log('🧹 BloomForm resetForm called')
      // Reset common fields
      setSelectedPlant('')
      setEventDate(new Date())
      setDescription('')
      setNotes('')
      // Reset image upload
      setImages([])
      // Reset location and weather fields
      setLocation('')
      setCoordinates(null)
      setWeatherData(null)
      onReset?.()
      console.log('✅ BloomForm reset completed')
    }

    useImperativeHandle(ref, () => ({
      reset: resetForm
    }))

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      if (!selectedPlant) {
        toast({
          title: 'Validation Error',
          description: 'Please select a plant for this bloom event.',
          variant: 'destructive',
        })
        return
      }

      onSubmit({
        plant_id: selectedPlant,
        event_date: eventDate.toISOString(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        location: location.trim() || undefined,
        coordinates: coordinates || undefined,
        images: images.length > 0 ? images : undefined,
      })
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-pink-700 flex items-center">
              🌸 Bloom Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Details Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-pink-700">Event Information</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plant">Plant *</Label>
                  <Select value={selectedPlant} onValueChange={setSelectedPlant} required>
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
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this bloom event..."
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
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
                  <Label className="text-sm font-medium text-pink-700">Weather Conditions</Label>
                  <WeatherDisplay weather={weatherData} compact />
                </div>
              )}
            </div>

            <Separator />

            {/* Photo Upload Section */}
            <PhotoUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
              label="Bloom Photos (Optional)"
              description="Capture or upload bloom photos"
              themeColor="pink"
              isProcessing={isSubmitting}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting} className="bg-pink-500 hover:bg-pink-600 text-white" size="lg">
            {isSubmitting ? 'Recording Bloom...' : 'Record Bloom Event'}
          </Button>
        </div>
      </form>
    )
  })

BloomForm.displayName = 'BloomForm'