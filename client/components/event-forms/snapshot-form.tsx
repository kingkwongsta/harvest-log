'use client'

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
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
import type { Plant, PlantVariety, Coordinates, WeatherData } from '@/lib/api'
import { plantsApi } from '@/lib/api'

export interface SnapshotFormData {
  plant_id?: string
  plant_variety_id?: string
  event_date: string
  description?: string
  location?: string
  coordinates?: Coordinates
  images?: File[]
}

interface SnapshotFormProps {
  plants: Plant[]
  onSubmit: (data: SnapshotFormData) => void
  isSubmitting: boolean
  onReset?: () => void
}

export interface SnapshotFormRef {
  reset: () => void
}

export const SnapshotForm = forwardRef<SnapshotFormRef, SnapshotFormProps>(
  ({ plants, onSubmit, isSubmitting, onReset }, ref) => {
    // Common event fields
    const [selectedPlant, setSelectedPlant] = useState('')
    const [selectedPlantVariety, setSelectedPlantVariety] = useState('')
    const [eventDate, setEventDate] = useState(new Date())
    const [description, setDescription] = useState('')
    
    // Plant varieties
    const [plantVarieties, setPlantVarieties] = useState<PlantVariety[]>([])
    const [varietiesLoading, setVarietiesLoading] = useState(false)
    
    // Snapshot-specific fields
    const [images, setImages] = useState<File[]>([])
    
    // Location and weather fields
    const [location, setLocation] = useState('')
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)

    // Fetch plant varieties on component mount
    useEffect(() => {
      const fetchPlantVarieties = async () => {
        try {
          setVarietiesLoading(true)
          const response = await plantsApi.getVarieties()
          if (response.success && response.data) {
            setPlantVarieties(response.data)
          }
        } catch (error) {
          console.error('Failed to fetch plant varieties:', error)
          toast({
            title: 'Error',
            description: 'Failed to load plant varieties. Please try again.',
            variant: 'destructive',
          })
        } finally {
          setVarietiesLoading(false)
        }
      }

      fetchPlantVarieties()
    }, [])

    const resetForm = () => {
      console.log('🧹 SnapshotForm resetForm called')
      // Reset common fields
      setSelectedPlant('')
      setSelectedPlantVariety('')
      setEventDate(new Date())
      setDescription('')
      // Reset snapshot-specific fields
      setImages([])
      // Reset location and weather fields
      setLocation('')
      setCoordinates(null)
      setWeatherData(null)
      onReset?.()
      console.log('✅ SnapshotForm reset completed')
    }

    useImperativeHandle(ref, () => ({
      reset: resetForm
    }))

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      onSubmit({
        plant_id: selectedPlant || undefined,
        plant_variety_id: selectedPlantVariety || undefined,
        event_date: eventDate.toISOString(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        coordinates: coordinates || undefined,
        images: images.length > 0 ? images : undefined,
      })
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center">
              📸 Plant Snapshot Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Details Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-blue-700">Event Information</Label>
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
                  <Label htmlFor="plant-variety">Plant Variety</Label>
                  <Select value={selectedPlantVariety} onValueChange={setSelectedPlantVariety} disabled={varietiesLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={varietiesLoading ? "Loading varieties..." : "Select a plant variety..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {plantVarieties.map((variety) => (
                        <SelectItem key={variety.id} value={variety.id}>
                          {variety.name} ({variety.category})
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
                <Label htmlFor="description">Description/Notes</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description of this snapshot event and any additional observations..."
                  rows={3}
                  maxLength={2500}
                />
              </div>
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
                <Label className="text-sm font-medium text-blue-700">Weather Conditions</Label>
                <WeatherDisplay weather={weatherData} compact />
              </div>
            )}

            <Separator />

            {/* Photo Upload Section */}
            <PhotoUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
              label="Progress Photos"
              description="Capture or upload progress photos"
              themeColor="blue"
              isProcessing={isSubmitting}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-600 text-white" size="lg">
          {isSubmitting ? 'Recording Snapshot...' : 'Record Snapshot Event'}
        </Button>
      </div>
    </form>
  )
})

SnapshotForm.displayName = 'SnapshotForm'