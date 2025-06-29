'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CalendarIcon, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/components/ui/use-toast'
import { eventsApi, type Plant as ApiPlant, type PlantEventCreateData, type PlantEvent as ApiPlantEvent } from '@/lib/api'

import { HarvestForm } from './event-forms/harvest-form'
import { BloomForm } from './event-forms/bloom-form'
import { SnapshotForm } from './event-forms/snapshot-form'

export type EventType = 'harvest' | 'bloom' | 'snapshot'

// Use API types but alias for component compatibility
export type Plant = ApiPlant
export type PlantEvent = ApiPlantEvent

interface EventLoggingModalProps {
  isOpen: boolean
  onClose: () => void
  onEventCreated: (event: PlantEvent) => void
  plants: Plant[]
}

export function EventLoggingModal({ isOpen, onClose, onEventCreated, plants }: EventLoggingModalProps) {
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEventType(null)
    }
  }, [isOpen])

  const handleEventTypeSelect = (eventType: EventType) => {
    setSelectedEventType(eventType)
  }

  const handleBack = () => {
    setSelectedEventType(null)
  }

  const handleEventSubmit = async (eventData: PlantEventCreateData) => {
    setIsSubmitting(true)
    try {
      // Call the new events API
      const response = await eventsApi.create(eventData)
      
      if (response.success && response.data) {
        toast({
          title: 'Event created successfully!',
          description: `${eventData.event_type} event has been logged.`,
        })
        onEventCreated(response.data)
        onClose()
      } else {
        throw new Error(response.message || 'Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create event',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {!selectedEventType ? 'Log New Plant Event' : `Log ${selectedEventType} Event`}
          </DialogTitle>
        </DialogHeader>

        {!selectedEventType ? (
          <EventTypeSelector onSelect={handleEventTypeSelect} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleBack}>
                ← Back
              </Button>
              <span className="text-sm text-muted-foreground">
                Selected: {selectedEventType}
              </span>
            </div>

            <EventForm
              eventType={selectedEventType}
              plants={plants}
              onSubmit={handleEventSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EventTypeSelector({ onSelect }: { onSelect: (type: EventType) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-200"
        onClick={() => onSelect('harvest')}
      >
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🌾</div>
          <CardTitle className="text-green-700">Log Harvest</CardTitle>
          <CardDescription>
            Record crop yields and quantities harvested from your plants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Track quantity and units</li>
            <li>• Record produce type</li>
            <li>• Add harvest photos</li>
            <li>• Note harvest conditions</li>
          </ul>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-pink-200"
        onClick={() => onSelect('bloom')}
      >
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🌸</div>
          <CardTitle className="text-pink-700">Record Bloom</CardTitle>
          <CardDescription>
            Track flowering stages and blooming cycles of your plants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Document flower types</li>
            <li>• Track bloom stages</li>
            <li>• Record bloom timing</li>
            <li>• Capture bloom photos</li>
          </ul>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
        onClick={() => onSelect('snapshot')}
      >
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">📸</div>
          <CardTitle className="text-blue-700">Plant Snapshot</CardTitle>
          <CardDescription>
            Document growth progress and health metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Measure plant growth</li>
            <li>• Track health indicators</li>
            <li>• Record observations</li>
            <li>• Document progress photos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

interface EventFormProps {
  eventType: EventType
  plants: Plant[]
  onSubmit: (data: PlantEventCreateData) => void
  isSubmitting: boolean
}

function EventForm({ eventType, plants, onSubmit, isSubmitting }: EventFormProps) {
  const [selectedPlant, setSelectedPlant] = useState<string>('')
  const [eventDate, setEventDate] = useState<Date>(new Date())
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = (eventSpecificData: Partial<PlantEventCreateData>) => {
    const baseEventData: PlantEventCreateData = {
      plant_id: selectedPlant || undefined,
      event_type: eventType,
      event_date: eventDate.toISOString(),
      description: description || undefined,
      notes: notes || undefined,
      location: location || undefined,
      ...eventSpecificData,
    }

    onSubmit(baseEventData)
  }

  return (
    <div className="space-y-6">
      {/* Common fields for all event types */}
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
          <Label htmlFor="event-date">Event Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !eventDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {eventDate ? format(eventDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={eventDate}
                onSelect={(date) => date && setEventDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Brief description of this ${eventType} event...`}
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location (Optional)</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Garden bed, greenhouse, container..."
          maxLength={200}
        />
      </div>

      {/* Event-specific form components */}
      {eventType === 'harvest' && (
        <HarvestForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}
      
      {eventType === 'bloom' && (
        <BloomForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}
      
      {eventType === 'snapshot' && (
        <SnapshotForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}

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
  )
}