'use client'

import { useState, useImperativeHandle, forwardRef, useEffect } from 'react'
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

import type { Plant, PlantVariety } from '@/lib/api'
import { plantsApi } from '@/lib/api'

export interface BloomFormData {
  plant_id?: string
  event_date: string
  description?: string
  notes?: string
  plant_variety: string
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
    
    // Bloom-specific fields
    const [plantVariety, setPlantVariety] = useState('')
    const [customVariety, setCustomVariety] = useState('')
    const [images, setImages] = useState<File[]>([])
    
    // Plant varieties from API
    const [plantVarieties, setPlantVarieties] = useState<PlantVariety[]>([])
    const [loadingVarieties, setLoadingVarieties] = useState(false)

    // Load plant varieties on component mount
    useEffect(() => {
      const loadPlantVarieties = async () => {
        setLoadingVarieties(true)
        try {
          const response = await plantsApi.getVarieties()
          if (response.success && response.data) {
            setPlantVarieties(response.data)
          }
        } catch (error) {
          console.error('Failed to load plant varieties:', error)
        } finally {
          setLoadingVarieties(false)
        }
      }

      loadPlantVarieties()
    }, [])

    const resetForm = () => {
      console.log('🧹 BloomForm resetForm called')
      // Reset common fields
      setSelectedPlant('')
      setEventDate(new Date())
      setDescription('')
      setNotes('')
      // Reset bloom-specific fields
      setPlantVariety('')
      setCustomVariety('')
      setImages([])
      onReset?.()
      console.log('✅ BloomForm reset completed')
    }

    useImperativeHandle(ref, () => ({
      reset: resetForm
    }))

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const finalVariety = plantVariety === 'custom' ? customVariety : plantVariety
    if (!finalVariety.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please specify the plant variety.',
        variant: 'destructive',
      })
      return
    }

    if (finalVariety.trim().length > 100) {
      toast({
        title: 'Validation Error',
        description: 'Plant variety must be 100 characters or less.',
        variant: 'destructive',
      })
      return
    }

    onSubmit({
      plant_id: selectedPlant || undefined,
      event_date: eventDate.toISOString(),
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      plant_variety: finalVariety.trim(),
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
                <Label htmlFor="plant">Plant (Optional)</Label>
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
          </div>

          <Separator />

          {/* Plant Variety Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-pink-700">Plant Variety</Label>
            <div className="space-y-2">
              <Label htmlFor="plant-variety">Plant Variety *</Label>
              <Select value={plantVariety} onValueChange={setPlantVariety} required disabled={loadingVarieties}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingVarieties ? "Loading varieties..." : "Select plant variety..."} />
                </SelectTrigger>
                <SelectContent>
                  {plantVarieties.map((variety) => (
                    <SelectItem key={variety.id} value={variety.name}>
                      {variety.name} - {variety.category}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom variety...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {plantVariety === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-variety">Custom Plant Variety</Label>
                <Input
                  id="custom-variety"
                  value={customVariety}
                  onChange={(e) => setCustomVariety(e.target.value)}
                  placeholder="Enter custom plant variety..."
                  maxLength={100}
                  required
                />
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