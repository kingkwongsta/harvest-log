'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { PlantEvent, PlantEventCreateData, PlantEventUpdateData, Plant, EventType } from '@/lib/api'

// This matches the backend PlantEventUpdateData structure
export interface EventFormData {
  plant_id?: string
  event_date: string
  description?: string
  location?: string
  quantity?: number
  plant_variety?: string
  metrics?: Record<string, unknown>
}

// For creating events, we need to include event_type
export interface EventCreateData extends EventFormData {
  event_type: EventType
}

interface EventFormProps {
  plants: Plant[]
  initialData?: PlantEvent
  onSubmit: (data: EventFormData | EventCreateData) => void
  onCancel: () => void
  isSubmitting: boolean
}

export interface EventFormRef {
  reset: () => void
}

const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: 'harvest', label: 'Harvest' },
  { value: 'bloom', label: 'Bloom' },
  { value: 'snapshot', label: 'Snapshot' }
]

export const EventForm = forwardRef<EventFormRef, EventFormProps>(
  ({ plants, initialData, onSubmit, onCancel, isSubmitting }, ref) => {
    const [plantId, setPlantId] = useState(initialData?.plant_id || '')
    const [eventType, setEventType] = useState<EventType>(initialData?.event_type || 'harvest')
    const [eventDate, setEventDate] = useState(
      initialData?.event_date ? initialData.event_date.split('T')[0] : ''
    )
    const [description, setDescription] = useState(initialData?.description || '')
    const [location, setLocation] = useState('')
    const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '')
    const [plantVarietyId, setPlantVarietyId] = useState(initialData?.plant_variety || '')
    const [metrics, setMetrics] = useState(
      initialData?.metrics ? JSON.stringify(initialData.metrics, null, 2) : ''
    )

    const resetForm = () => {
      setPlantId('')
      setEventType('harvest')
      setEventDate('')
      setDescription('')
      setLocation('')
      setQuantity('')
      setPlantVarietyId('')
      setMetrics('')
    }

    useImperativeHandle(ref, () => ({
      reset: resetForm
    }))

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      if (!eventType) {
        toast({
          title: 'Validation Error',
          description: 'Event type is required.',
          variant: 'destructive',
        })
        return
      }

      if (!eventDate) {
        toast({
          title: 'Validation Error',
          description: 'Event date is required.',
          variant: 'destructive',
        })
        return
      }

      // Parse metrics if provided
      let parsedMetrics: Record<string, unknown> | undefined
      if (metrics.trim()) {
        try {
          parsedMetrics = JSON.parse(metrics)
        } catch (error) {
          toast({
            title: 'Validation Error',
            description: 'Invalid JSON format in metrics field.',
            variant: 'destructive',
          })
          return
        }
      }

      const baseFormData: EventFormData = {
        plant_id: plantId || undefined,
        event_date: eventDate,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        quantity: quantity ? parseFloat(quantity) : undefined,
        plant_variety: plantVarietyId || undefined,
        metrics: parsedMetrics,
      }

      // For creating new events, include event_type. For updates, exclude it.
      if (initialData) {
        onSubmit(baseFormData)
      } else {
        const createData: EventCreateData = {
          ...baseFormData,
          event_type: eventType,
        }
        onSubmit(createData)
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center">
              📅 {initialData ? 'Edit Event' : 'Add New Event'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plant">Plant (Optional)</Label>
                <Select value={plantId} onValueChange={setPlantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plants.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id}>
                        {plant.name} ({plant.variety?.name || 'No variety'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type *</Label>
                <Select value={eventType} onValueChange={(value) => setEventType(value as EventType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">Event Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the event..."
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location description..."
                maxLength={100}
              />
            </div>

            {/* Event-specific fields */}
            {eventType === 'harvest' && (
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (Optional)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Harvest quantity..."
                />
              </div>
            )}

            {eventType === 'bloom' && (
              <div className="space-y-2">
                <Label htmlFor="plant-variety">Plant Variety (Optional)</Label>
                <Input
                  id="plant-variety"
                  value={plantVarietyId}
                  onChange={(e) => setPlantVarietyId(e.target.value)}
                  placeholder="Plant variety information..."
                  maxLength={100}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="metrics">Metrics (Optional JSON)</Label>
              <Textarea
                id="metrics"
                value={metrics}
                onChange={(e) => setMetrics(e.target.value)}
                placeholder='{"temperature": 75, "humidity": 60, "notes": "example"}'
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Optional JSON data for measurements and observations. Must be valid JSON format.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} variant="default">
            {isSubmitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Event' : 'Create Event')}
          </Button>
        </div>
      </form>
    )
  }
)

EventForm.displayName = 'EventForm' 