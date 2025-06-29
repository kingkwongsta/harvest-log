'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon } from 'lucide-react'
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

// Helper function to get event icon
function getEventIcon(eventType: EventType): string {
  switch (eventType) {
    case 'harvest': return '🌾'
    case 'bloom': return '🌸'
    case 'snapshot': return '📸'
    default: return '🌱'
  }
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

  const handleEventSubmit = async (eventData: PlantEventCreateData, images?: File[]) => {
    setIsSubmitting(true)
    try {
      // Call the new events API
      const response = await eventsApi.create(eventData)
      
      if (response.success && response.data) {
        const createdEvent = response.data
        
        // Upload images if any were provided
        if (images && images.length > 0) {
          try {
            const imageResponse = await eventsApi.uploadImages(createdEvent.id, images)
            if (!imageResponse.success) {
              console.warn('Some images failed to upload:', imageResponse.message)
              toast({
                title: 'Event created with image upload issues',
                description: `${eventData.event_type} event was saved, but some images failed to upload.`,
                variant: 'destructive',
              })
            } else {
              toast({
                title: 'Event created successfully!',
                description: `${eventData.event_type} event and ${images.length} image(s) have been saved.`,
              })
            }
          } catch (imageError) {
            console.error('Error uploading images:', imageError)
            toast({
              title: 'Event created with image upload error',
              description: `${eventData.event_type} event was saved, but images failed to upload.`,
              variant: 'destructive',
            })
          }
        } else {
          toast({
            title: 'Event created successfully!',
            description: `${eventData.event_type} event has been logged.`,
          })
        }
        
        onEventCreated(createdEvent)
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
          <DialogTitle className="text-2xl font-bold text-foreground">
            {!selectedEventType ? '🌱 Log New Plant Event' : `${getEventIcon(selectedEventType)} Log ${selectedEventType.charAt(0).toUpperCase() + selectedEventType.slice(1)} Event`}
          </DialogTitle>
          {!selectedEventType && (
            <p className="text-muted-foreground mt-2">Choose the type of event you want to record for your plant journey</p>
          )}
        </DialogHeader>

        {!selectedEventType ? (
          <EventTypeSelector onSelect={handleEventTypeSelect} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={handleBack} className="hover:bg-muted">
                  ← Back to Selection
                </Button>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedEventType === 'harvest' ? 'harvest-gradient' :
                    selectedEventType === 'bloom' ? 'bg-pink-500' : 'bg-blue-500'
                  }`}>
                    <span className="text-lg">{getEventIcon(selectedEventType)}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {selectedEventType.charAt(0).toUpperCase() + selectedEventType.slice(1)} Event
                  </span>
                </div>
              </div>
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card 
        className="cursor-pointer card-hover border-2 border-green-100 hover:border-green-200 transition-all duration-200 group"
        onClick={() => onSelect('harvest')}
      >
        <CardHeader className="text-center pb-3">
          <div className="w-16 h-16 mx-auto mb-3 harvest-gradient rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-2xl">🌾</span>
          </div>
          <CardTitle className="text-green-700 text-lg">Log Harvest</CardTitle>
          <CardDescription className="text-sm">
            Record crop yields and quantities harvested from your plants
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Track quantity and units</li>
            <li>• Record produce type</li>
            <li>• Add harvest photos</li>
            <li>• Note harvest conditions</li>
          </ul>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer card-hover border-2 border-pink-100 hover:border-pink-200 transition-all duration-200 group"
        onClick={() => onSelect('bloom')}
      >
        <CardHeader className="text-center pb-3">
          <div className="w-16 h-16 mx-auto mb-3 bg-pink-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-2xl">🌸</span>
          </div>
          <CardTitle className="text-pink-700 text-lg">Record Bloom</CardTitle>
          <CardDescription className="text-sm">
            Track flowering stages and blooming cycles of your plants
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Document flower types</li>
            <li>• Track bloom stages</li>
            <li>• Record bloom timing</li>
            <li>• Capture bloom photos</li>
          </ul>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer card-hover border-2 border-blue-100 hover:border-blue-200 transition-all duration-200 group"
        onClick={() => onSelect('snapshot')}
      >
        <CardHeader className="text-center pb-3">
          <div className="w-16 h-16 mx-auto mb-3 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-2xl">📸</span>
          </div>
          <CardTitle className="text-blue-700 text-lg">Plant Snapshot</CardTitle>
          <CardDescription className="text-sm">
            Document growth progress and health metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
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
  onSubmit: (data: PlantEventCreateData, images?: File[]) => void
  isSubmitting: boolean
}

function EventForm({ eventType, plants, onSubmit, isSubmitting }: EventFormProps) {
  const [selectedPlant, setSelectedPlant] = useState<string>('')
  const [eventDate, setEventDate] = useState<Date>(new Date())
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = (eventSpecificData: Partial<PlantEventCreateData> & { images?: File[] }) => {
    const { images, ...eventDataWithoutImages } = eventSpecificData
    const baseEventData: PlantEventCreateData = {
      plant_id: selectedPlant || undefined,
      event_type: eventType,
      event_date: eventDate.toISOString(),
      description: description || undefined,
      notes: notes || undefined,
      location: location || undefined,
      ...eventDataWithoutImages,
    }

    onSubmit(baseEventData, images)
  }

  return (
    <div className="space-y-6">
      {/* Common fields for all event types */}
      <Card className="border-muted">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Event Details</CardTitle>
          <CardDescription>Basic information about this plant event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant" className="text-sm font-medium">Plant (Optional)</Label>
              <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                <SelectTrigger className="focus-nature">
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
              <Label htmlFor="event-date" className="text-sm font-medium">Event Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal focus-nature',
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Brief description of this ${eventType} event...`}
                maxLength={500}
                className="focus-nature"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">Location (Optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Garden bed, greenhouse, container..."
                maxLength={200}
                className="focus-nature"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations, conditions, or details..."
              rows={3}
              maxLength={2000}
              className="focus-nature"
            />
          </div>
        </CardContent>
      </Card>

      {/* Event-specific form components */}
      <div className="mt-6">
        {eventType === 'harvest' && (
          <HarvestForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}
        
        {eventType === 'bloom' && (
          <BloomForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}
        
        {eventType === 'snapshot' && (
          <SnapshotForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}
      </div>
    </div>
  )
}