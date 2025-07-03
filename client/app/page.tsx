"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sprout, TrendingUp, Clock } from "lucide-react"
import { eventsApi, EventStats, plantsApi, type Plant, type PlantEventCreateData } from "@/lib/api"
import { type EventType } from "@/components/event-logging-modal"
import { HarvestForm, HarvestFormRef } from "@/components/event-forms/harvest-form"
import { BloomForm, BloomFormRef } from "@/components/event-forms/bloom-form"
import { SnapshotForm, SnapshotFormRef } from "@/components/event-forms/snapshot-form"
import { toast } from "@/components/ui/use-toast"
import { EventConfirmationDialog } from "@/components/dialogs/event-confirmation-dialog"



export default function HomePage() {
  const [stats, setStats] = useState<EventStats>({
    total_events: 0,
    this_month: 0,
    this_week: 0,
    harvest_events: 0,
    bloom_events: 0,
    snapshot_events: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  
  // Plant and Event Form State
  const [plants, setPlants] = useState<Plant[]>([])
  const [isLoadingPlants, setIsLoadingPlants] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>('harvest')
  const [isEventSubmitting, setIsEventSubmitting] = useState(false)

  // Form refs for resetting
  const harvestFormRef = useRef<HarvestFormRef>(null)
  const bloomFormRef = useRef<BloomFormRef>(null)
  const snapshotFormRef = useRef<SnapshotFormRef>(null)

  // Confirmation dialog state
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationData, setConfirmationData] = useState<{
    type: 'success' | 'error'
    message: string
    imageCount?: number
  }>({ type: 'success', message: '' })


  // Load plants function
  const loadPlants = useCallback(async () => {
    if (isLoadingPlants) return
    
    try {
      setIsLoadingPlants(true)
      const response = await plantsApi.getPlants()
      if (response.success && response.data) {
        setPlants(response.data)
      }
    } catch (error) {
      console.error('Error loading plants:', error)
    } finally {
      setIsLoadingPlants(false)
    }
  }, [isLoadingPlants])

  // Fetch event statistics and load plants on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true)
        const eventResponse = await eventsApi.getStats()
        if (eventResponse.success && eventResponse.data) {
          setStats(eventResponse.data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        // Keep default values if API fails
      } finally {
        setIsLoadingStats(false)
      }
    }

    const loadInitialPlants = async () => {
      if (isLoadingPlants) return
      
      try {
        setIsLoadingPlants(true)
        const response = await plantsApi.getPlants()
        if (response.success && response.data) {
          setPlants(response.data)
        }
      } catch (error) {
        console.error('Error loading plants:', error)
      } finally {
        setIsLoadingPlants(false)
      }
    }

    // Load plants since harvest form is selected by default
    const fetchInitialData = async () => {
      await fetchStats()
      await loadInitialPlants()
    }

    fetchInitialData()
  }, [])

  // Load plants when inline event form needs them
  const ensurePlantsLoaded = async () => {
    if (plants.length === 0 && !isLoadingPlants) {
      await loadPlants()
    }
  }

  // Load plants when event type is selected
  const handleEventTypeSelect = (eventType: EventType) => {
    setSelectedEventType(eventType)
    ensurePlantsLoaded()
  }


  // Handle inline event form submission
  const handleEventSubmit = async (eventData: PlantEventCreateData, images?: File[]) => {
    setIsEventSubmitting(true)
    try {
      // Call the events API
      const response = await eventsApi.create(eventData)
      
      if (response.success && response.data) {
        const createdEvent = response.data
        
        // Upload images if any were provided
        if (images && images.length > 0) {
          console.log('🔍 Debug: About to upload images:', {
            eventId: createdEvent.id,
            imageCount: images.length,
            images: images.map(img => ({
              name: img.name,
              size: img.size,
              type: img.type,
              constructor: img.constructor.name
            }))
          });
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
              setConfirmationData({
                type: 'success',
                message: `${eventData.event_type} event and ${images.length} image(s) have been saved.`,
                imageCount: images.length
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
          setConfirmationData({
            type: 'success',
            message: `${eventData.event_type} event has been logged.`,
            imageCount: 0
          })
        }
        
        // Reset the appropriate form
        console.log('🧹 Resetting form after successful submission')
        if (selectedEventType === 'harvest') {
          harvestFormRef.current?.reset()
        } else if (selectedEventType === 'bloom') {
          bloomFormRef.current?.reset()
        } else if (selectedEventType === 'snapshot') {
          snapshotFormRef.current?.reset()
        }
        
        // Show confirmation dialog
        setShowConfirmation(true)
        
        // Refresh stats but keep the selected event type
        await refetchStats()
      } else {
        throw new Error(response.message || 'Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      setConfirmationData({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create event'
      })
      setShowConfirmation(true)
    } finally {
      setIsEventSubmitting(false)
    }
  }

  // Handle confirmation dialog close
  const handleConfirmationClose = () => {
    setShowConfirmation(false)
    // No additional reset needed here since form is already reset after successful submission
  }

  // Refetch stats after successful event creation
  const refetchStats = async () => {
    try {
      // Try to get event stats first (new system)
      try {
        const eventResponse = await eventsApi.getStats()
        if (eventResponse.success && eventResponse.data) {
          setStats(eventResponse.data)
          return
        }
      } catch {
        console.log('Event stats not available, using default values')
      }
    } catch (error) {
      console.error('Error refetching stats:', error)
    }
  }






  return (
    <div className="min-h-screen bg-background">


      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        {/* Event Type Selection - Persistent Buttons */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card 
              className={`cursor-pointer transition-all duration-200 border-2 ${
                selectedEventType === 'harvest' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-green-100 hover:border-green-200 hover:shadow-sm'
              }`}
              onClick={() => handleEventTypeSelect('harvest')}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  selectedEventType === 'harvest' ? 'harvest-gradient' : 'bg-green-100'
                }`}>
                  <span className="text-2xl">🌾</span>
                </div>
                <h3 className="font-medium text-green-700">Harvest</h3>
                <p className="text-xs text-gray-600 mt-1">Log crop yields</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-200 border-2 ${
                selectedEventType === 'bloom' 
                  ? 'border-pink-500 bg-pink-50 shadow-md' 
                  : 'border-pink-100 hover:border-pink-200 hover:shadow-sm'
              }`}
              onClick={() => handleEventTypeSelect('bloom')}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  selectedEventType === 'bloom' ? 'bg-pink-500' : 'bg-pink-100'
                }`}>
                  <span className="text-2xl">🌸</span>
                </div>
                <h3 className="font-medium text-pink-700">Bloom</h3>
                <p className="text-xs text-gray-600 mt-1">Track flowering</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-200 border-2 ${
                selectedEventType === 'snapshot' 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-blue-100 hover:border-blue-200 hover:shadow-sm'
              }`}
              onClick={() => handleEventTypeSelect('snapshot')}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  selectedEventType === 'snapshot' ? 'bg-blue-500' : 'bg-blue-100'
                }`}>
                  <span className="text-2xl">📸</span>
                </div>
                <h3 className="font-medium text-blue-700">Snapshot</h3>
                <p className="text-xs text-gray-600 mt-1">Record growth</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dynamic Event Form */}
        {selectedEventType && (
          <DynamicEventForm
            eventType={selectedEventType}
            plants={plants}
            onSubmit={handleEventSubmit}
            isSubmitting={isEventSubmitting}
            formRefs={{
              harvestFormRef,
              bloomFormRef,
              snapshotFormRef
            }}
          />
        )}

        {/* Plant Journey Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 harvest-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {isLoadingStats ? "..." : stats.total_events}
              </div>
                              <p className="text-sm text-organic">Total Events</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {isLoadingStats ? "..." : stats.this_month}
              </div>
              <p className="text-sm text-organic">This Month</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {isLoadingStats ? "..." : stats.this_week}
              </div>
              <p className="text-sm text-organic">This Week</p>
            </CardContent>
          </Card>
        </div>

      </div>
      
      {/* Confirmation Dialog */}
      <EventConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        type={confirmationData.type}
        eventType={selectedEventType || undefined}
        message={confirmationData.message}
        imageCount={confirmationData.imageCount}
        onClose={handleConfirmationClose}
      />

    </div>
  )
}

// Dynamic Event Form Component
interface DynamicEventFormProps {
  eventType: EventType
  plants: Plant[]
  onSubmit: (data: PlantEventCreateData, images?: File[]) => void
  isSubmitting: boolean
  formRefs: {
    harvestFormRef: React.RefObject<HarvestFormRef | null>
    bloomFormRef: React.RefObject<BloomFormRef | null>
    snapshotFormRef: React.RefObject<SnapshotFormRef | null>
  }
}

function DynamicEventForm({ eventType, plants, onSubmit, isSubmitting, formRefs }: DynamicEventFormProps) {
  const handleSubmit = (eventSpecificData: any) => {
    const { images, ...eventDataWithoutImages } = eventSpecificData
    const baseEventData: PlantEventCreateData = {
      ...eventDataWithoutImages,
      event_type: eventType,
    }

    onSubmit(baseEventData, images)
  }

  return (
    <div>
      {eventType === 'harvest' && (
        <HarvestForm 
          ref={formRefs.harvestFormRef} 
          plants={plants}
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
        />
      )}
      
      {eventType === 'bloom' && (
        <BloomForm 
          ref={formRefs.bloomFormRef} 
          plants={plants}
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
        />
      )}
      
      {eventType === 'snapshot' && (
        <SnapshotForm 
          ref={formRefs.snapshotFormRef} 
          plants={plants}
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
        />
      )}
    </div>
  )
}
