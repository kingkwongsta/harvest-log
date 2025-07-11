"use client"

import { useState, useEffect } from "react"
import { eventsApi, plantsApi, PlantEvent, Plant, PlantVariety } from "@/lib/api"
import { cleanImageUrl } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDistanceToNow } from "date-fns"
import { Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { PlantAddDialog } from "@/components/admin/plant-add-dialog"
import { PlantEditDialog } from "@/components/admin/plant-edit-dialog"
import { PlantDeleteDialog } from "@/components/admin/plant-delete-dialog"
import { PlantVarietyAddDialog } from "@/components/admin/plant-variety-add-dialog"
import { PlantVarietyEditDialog } from "@/components/admin/plant-variety-edit-dialog"
import { PlantVarietyDeleteDialog } from "@/components/admin/plant-variety-delete-dialog"
import { EventAddDialog } from "@/components/admin/event-add-dialog"
import { EventEditDialog } from "@/components/admin/event-edit-dialog"
import { EventDeleteDialog } from "@/components/admin/event-delete-dialog"
import type { PlantFormData } from "@/components/admin/plant-form"
import type { PlantVarietyFormData } from "@/components/admin/plant-variety-form"
import type { EventFormData, EventCreateData } from "@/components/admin/event-form"
import type { PlantEventUpdateData } from "@/lib/api"
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'


export default function AdminPage() {
  const [events, setEvents] = useState<PlantEvent[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [varieties, setVarieties] = useState<PlantVariety[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  
  // Plant management state
  const [addPlantDialogOpen, setAddPlantDialogOpen] = useState(false)
  const [editPlantDialogOpen, setEditPlantDialogOpen] = useState(false)
  const [deletePlantDialogOpen, setDeletePlantDialogOpen] = useState(false)
  const [plantToEdit, setPlantToEdit] = useState<Plant | null>(null)
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null)
  const [isPlantSubmitting, setIsPlantSubmitting] = useState(false)
  const [isDeletingPlant, setIsDeletingPlant] = useState(false)

  // Plant variety management state
  const [addVarietyDialogOpen, setAddVarietyDialogOpen] = useState(false)
  const [editVarietyDialogOpen, setEditVarietyDialogOpen] = useState(false)
  const [deleteVarietyDialogOpen, setDeleteVarietyDialogOpen] = useState(false)
  const [varietyToEdit, setVarietyToEdit] = useState<PlantVariety | null>(null)
  const [varietyToDelete, setVarietyToDelete] = useState<PlantVariety | null>(null)
  const [isVarietySubmitting, setIsVarietySubmitting] = useState(false)
  const [isDeletingVariety, setIsDeletingVariety] = useState(false)

  // Event management state
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false)
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false)
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<PlantEvent | null>(null)
  const [eventToDelete, setEventToDelete] = useState<PlantEvent | null>(null)
  const [isEventSubmitting, setIsEventSubmitting] = useState(false)
  const [isDeletingEvent, setIsDeletingEvent] = useState(false)
  

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [eventsResponse, plantsResponse, varietiesResponse] = await Promise.all([
        eventsApi.getAll(),
        plantsApi.getPlants(),
        plantsApi.getVarieties()
      ])

      if (eventsResponse.success) {
        setEvents(eventsResponse.data || [])
      }
      if (plantsResponse.success) {
        setPlants(plantsResponse.data || [])
      }
      if (varietiesResponse.success) {
        setVarieties(varietiesResponse.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.plant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              event.plant_variety?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = eventTypeFilter === "all" || event.event_type === eventTypeFilter
    
    return matchesSearch && matchesType
  })

  const toggleEventExpansion = (eventId: string) => {
    const isExpanding = expandedEvent !== eventId
    setExpandedEvent(expandedEvent === eventId ? null : eventId)
    
    if (isExpanding) {
      const event = events.find(e => e.id === eventId)
      console.log('Expanding event with images data:', event?.images)
    }
  }

  const handleDeleteEventClick = (event: PlantEvent) => {
    setEventToDelete(event)
    setDeleteEventDialogOpen(true)
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    console.log('🗑️ [ADMIN] Starting event deletion:', { eventId: eventToDelete.id, eventType: eventToDelete.event_type })
    setIsDeletingEvent(true)
    try {
      const response = await eventsApi.delete(eventToDelete.id)
      if (response.success) {
        console.log('✅ [ADMIN] Event deleted successfully:', { eventId: eventToDelete.id, eventType: eventToDelete.event_type })
        setEvents(prev => prev.filter(e => e.id !== eventToDelete.id))
        setDeleteEventDialogOpen(false)
        setEventToDelete(null)
        toast({
          title: 'Success',
          description: 'Event deleted successfully!',
        })
      } else {
        console.error('❌ [ADMIN] Failed to delete event:', { eventId: eventToDelete.id, error: response.message })
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete event',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error deleting event:', { eventId: eventToDelete.id, error })
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete event'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsDeletingEvent(false)
    }
  }

  const handleEditEventClick = (event: PlantEvent) => {
    setEventToEdit(event)
    setEditEventDialogOpen(true)
  }

  const handleCloseEventDialogs = () => {
    setAddEventDialogOpen(false)
    setEditEventDialogOpen(false)
    setDeleteEventDialogOpen(false)
    setEventToEdit(null)
    setEventToDelete(null)
  }

  // Event management functions
  const handleEventSubmit = async (data: EventFormData | EventCreateData) => {
    if ('event_type' in data) {
      // This is a create operation
      await handleAddEvent(data as EventCreateData)
    } else {
      // This is an update operation
      await handleEditEvent(data as EventFormData)
    }
  }

  const handleAddEvent = async (data: EventCreateData) => {
    console.log('📅 [ADMIN] Starting event creation:', { eventData: data })
    setIsEventSubmitting(true)
    try {
      const response = await eventsApi.create(data)
      if (response.success) {
        console.log('✅ [ADMIN] Event created successfully:', { eventId: response.data?.id, eventType: response.data?.event_type })
        setEvents(prev => [...prev, response.data!])
        setAddEventDialogOpen(false)
        toast({
          title: 'Success',
          description: 'Event created successfully!',
        })
      } else {
        console.error('❌ [ADMIN] Failed to create event:', { data, error: response.message })
        toast({
          title: 'Error',
          description: response.message || 'Failed to create event',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error creating event:', { data, error })
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsEventSubmitting(false)
    }
  }

  const handleEditEvent = async (data: EventFormData) => {
    if (!eventToEdit) return

    console.log('📅 [ADMIN] Starting event update:', { eventId: eventToEdit.id, eventData: data })
    setIsEventSubmitting(true)
    try {
      // Convert EventFormData to PlantEventUpdateData
      const updateData: PlantEventUpdateData = {
        plant_id: data.plant_id || undefined,
        event_date: data.event_date,
        description: data.description || undefined,
        location: data.location || undefined,
        quantity: data.quantity || undefined,
        plant_variety: data.plant_variety || undefined,
      }

      const response = await eventsApi.update(eventToEdit.id, updateData)
      if (response.success) {
        console.log('✅ [ADMIN] Event updated successfully:', { eventId: eventToEdit.id, eventType: response.data?.event_type })
        setEvents(prev => prev.map(e => e.id === eventToEdit.id ? response.data! : e))
        setEditEventDialogOpen(false)
        setEventToEdit(null)
        toast({
          title: 'Success',
          description: 'Event updated successfully!',
        })
      } else {
        console.error('❌ [ADMIN] Failed to update event:', { eventId: eventToEdit.id, data: updateData, error: response.message })
        toast({
          title: 'Error',
          description: response.message || 'Failed to update event',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error updating event:', { eventId: eventToEdit.id, data, error })
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsEventSubmitting(false)
    }
  }

  // Plant management functions
  const handleAddPlant = async (data: PlantFormData) => {
    console.log('🌱 [ADMIN] Starting plant creation:', { plantData: data })
    setIsPlantSubmitting(true)
    try {
      const response = await plantsApi.createPlant(data)
      if (response.success) {
        console.log('✅ [ADMIN] Plant created successfully:', { plantId: response.data?.id, name: response.data?.name })
        setPlants(prev => [...prev, response.data!])
        setAddPlantDialogOpen(false)
        toast({
          title: 'Success',
          description: 'Plant created successfully!',
        })
      } else {
        console.error('❌ [ADMIN] Failed to create plant:', { data, error: response.message })
        toast({
          title: 'Error',
          description: response.message || 'Failed to create plant',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error creating plant:', { data, error })
      const errorMessage = error instanceof Error ? error.message : 'Failed to create plant'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsPlantSubmitting(false)
    }
  }

  const handleEditPlant = async (data: PlantFormData) => {
    if (!plantToEdit) return
    
    console.log('✏️ [ADMIN] Starting plant edit:', { plantId: plantToEdit.id, plantName: plantToEdit.name, updateData: data })
    setIsPlantSubmitting(true)
    try {
      const response = await plantsApi.updatePlant(plantToEdit.id, data)
      if (response.success) {
        console.log('✅ [ADMIN] Plant updated successfully:', { plantId: plantToEdit.id, updatedName: response.data?.name })
        setPlants(prev => prev.map(p => p.id === plantToEdit.id ? response.data! : p))
        setEditPlantDialogOpen(false)
        setPlantToEdit(null)
        toast({
          title: 'Success',
          description: 'Plant updated successfully!',
        })
      } else {
        console.error('❌ [ADMIN] Failed to update plant:', { plantId: plantToEdit.id, data, error: response.message })
        toast({
          title: 'Error',
          description: response.message || 'Failed to update plant',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error updating plant:', { plantId: plantToEdit.id, data, error })
      toast({
        title: 'Error',
        description: 'Failed to update plant',
        variant: 'destructive',
      })
    } finally {
      setIsPlantSubmitting(false)
    }
  }

  const handleDeletePlant = async () => {
    if (!plantToDelete) return
    
    console.log('🗑️ [ADMIN] Starting plant deletion:', { plantId: plantToDelete.id, plantName: plantToDelete.name })
    setIsDeletingPlant(true)
    try {
      const response = await plantsApi.deletePlant(plantToDelete.id)
      if (response.success) {
        console.log('✅ [ADMIN] Plant deleted successfully:', { plantId: plantToDelete.id, plantName: plantToDelete.name })
        setPlants(prev => prev.filter(p => p.id !== plantToDelete.id))
        setDeletePlantDialogOpen(false)
        setPlantToDelete(null)
        toast({
          title: 'Success',
          description: 'Plant deleted successfully!',
        })
      } else {
        console.error('❌ [ADMIN] Failed to delete plant:', { plantId: plantToDelete.id, error: response.message })
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete plant',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error deleting plant:', { plantId: plantToDelete.id, error })
      toast({
        title: 'Error',
        description: 'Failed to delete plant',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingPlant(false)
    }
  }

  const handleEditPlantClick = (plant: Plant) => {
    setPlantToEdit(plant)
    setEditPlantDialogOpen(true)
  }

  const handleDeletePlantClick = (plant: Plant) => {
    setPlantToDelete(plant)
    setDeletePlantDialogOpen(true)
  }

  const handleClosePlantDialogs = () => {
    setAddPlantDialogOpen(false)
    setEditPlantDialogOpen(false)
    setDeletePlantDialogOpen(false)
    setPlantToEdit(null)
    setPlantToDelete(null)
  }

  // Plant variety management functions
  const handleAddVariety = async (data: PlantVarietyFormData) => {
    console.log('🌿 [ADMIN] Starting plant variety creation:', { varietyData: data })
    setIsVarietySubmitting(true)
    try {
      const response = await plantsApi.createVariety(data)
      if (response.success) {
        console.log('✅ [ADMIN] Plant variety created successfully:', { varietyId: response.data?.id, varietyName: response.data?.name })
        setVarieties(prev => [...prev, response.data!])
        setAddVarietyDialogOpen(false)
        toast({
          title: 'Success',
          description: 'Plant variety created successfully!',
        })
      } else {
        console.error('❌ [ADMIN] Failed to create plant variety:', { data, error: response.message })
        toast({
          title: 'Error',
          description: response.message || 'Failed to create plant variety',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error creating plant variety:', { data, error })
      const errorMessage = error instanceof Error ? error.message : 'Failed to create plant variety'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsVarietySubmitting(false)
    }
  }

  const handleEditVariety = async (data: PlantVarietyFormData) => {
    if (!varietyToEdit) return
    
    console.log('✏️ [ADMIN] Starting plant variety edit:', { varietyId: varietyToEdit.id, varietyName: varietyToEdit.name, updateData: data })
    setIsVarietySubmitting(true)
    try {
      const response = await plantsApi.updateVariety(varietyToEdit.id, data)
      if (response.success) {
        console.log('✅ [ADMIN] Plant variety updated successfully:', { varietyId: varietyToEdit.id, updatedName: response.data?.name })
        setVarieties(prev => prev.map(v => v.id === varietyToEdit.id ? response.data! : v))
        setEditVarietyDialogOpen(false)
        setVarietyToEdit(null)
        toast({
          title: 'Success',
          description: 'Plant variety updated successfully!',
        })
      } else {
        console.error('❌ [ADMIN] Failed to update plant variety:', { varietyId: varietyToEdit.id, data, error: response.message })
        toast({
          title: 'Error',
          description: response.message || 'Failed to update plant variety',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error updating plant variety:', { varietyId: varietyToEdit.id, data, error })
      toast({
        title: 'Error',
        description: 'Failed to update plant variety',
        variant: 'destructive',
      })
    } finally {
      setIsVarietySubmitting(false)
    }
  }

  const handleDeleteVariety = async () => {
    if (!varietyToDelete) return
    
    console.log('🗑️ [ADMIN] Starting plant variety deletion:', { varietyId: varietyToDelete.id, varietyName: varietyToDelete.name })
    setIsDeletingVariety(true)
    try {
      const response = await plantsApi.deleteVariety(varietyToDelete.id)
      if (response.success) {
        console.log('✅ [ADMIN] Plant variety deleted successfully:', { varietyId: varietyToDelete.id, varietyName: varietyToDelete.name })
        setVarieties(prev => prev.filter(v => v.id !== varietyToDelete.id))
        setDeleteVarietyDialogOpen(false)
        setVarietyToDelete(null)
        toast({
          title: 'Success',
          description: 'Plant variety deleted successfully!',
        })
      } else {
        console.error('❌ [ADMIN] Failed to delete plant variety:', { varietyId: varietyToDelete.id, error: response.message })
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete plant variety',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error deleting plant variety:', { varietyId: varietyToDelete.id, error })
      toast({
        title: 'Error',
        description: 'Failed to delete plant variety',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingVariety(false)
    }
  }

  const handleEditVarietyClick = (variety: PlantVariety) => {
    setVarietyToEdit(variety)
    setEditVarietyDialogOpen(true)
  }

  const handleDeleteVarietyClick = (variety: PlantVariety) => {
    setVarietyToDelete(variety)
    setDeleteVarietyDialogOpen(true)
  }

  const handleCloseVarietyDialogs = () => {
    setAddVarietyDialogOpen(false)
    setEditVarietyDialogOpen(false)
    setDeleteVarietyDialogOpen(false)
    setVarietyToEdit(null)
    setVarietyToDelete(null)
  }

  

  const EventField = ({ label, value, highlight = false }: { label: string, value: unknown, highlight?: boolean }) => {
    if (value === null || value === undefined || value === '') return null
    
    const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    
    return (
      <div className={`grid grid-cols-3 gap-2 py-1 ${highlight ? 'bg-yellow-50' : ''}`}>
        <div className="font-medium text-sm text-gray-600">{label}:</div>
        <div className="col-span-2 text-sm font-mono break-all">
          {typeof value === 'object' ? (
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {displayValue}
            </pre>
          ) : (
            displayValue
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading admin data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadAllData} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Review all logged events and their data</p>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
          <TabsTrigger value="plants">Plants ({plants.length})</TabsTrigger>
          <TabsTrigger value="varieties">Varieties ({varieties.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Event Management</CardTitle>
                  <CardDescription>Manage all events in your plant journey</CardDescription>
                </div>
                <Button 
                  onClick={() => setAddEventDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="harvest">Harvest</SelectItem>
                    <SelectItem value="bloom">Bloom</SelectItem>
                    <SelectItem value="snapshot">Snapshot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        event.event_type === 'harvest' ? 'default' :
                        event.event_type === 'bloom' ? 'secondary' : 'outline'
                      }>
                        {event.event_type}
                      </Badge>
                      <CardTitle className="text-lg">
                        {event.plant?.name || event.plant_variety || `${event.event_type} Event`}
                      </CardTitle>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(event.event_date), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEventExpansion(event.id)}
                      >
                        {expandedEvent === event.id ? 'Collapse' : 'Expand'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEventClick(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEventClick(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Event ID: {event.id} | Created: {new Date(event.created_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Basic Info</h4>
                      <div className="space-y-1">
                        <EventField label="Event Type" value={event.event_type} highlight />
                        <EventField label="Event Date" value={event.event_date} />
                        <EventField label="Description" value={event.description} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">References</h4>
                      <div className="space-y-1">
                        <EventField label="User ID" value={event.user_id} />
                        <EventField label="Plant ID" value={event.plant_id} />
                        <EventField label="Plant Name" value={event.plant?.name} />
                      </div>
                    </div>
                  </div>

                  {expandedEvent === event.id && (
                    <div className="mt-6 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2">Event-Specific Data</h4>
                          <div className="space-y-1">
                            <EventField label="Plant Variety" value={event.plant_variety} />
                            <EventField label="Quantity" value={event.quantity} />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Location & Environment</h4>
                          <div className="space-y-1">
                            <EventField label="Coordinates" value={event.coordinates} />
                            <EventField label="Weather" value={event.weather} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">
                          Images ({event.images?.length || 0})
                        </h4>
                        {event.images && event.images.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {event.images.map((image) => (
                              <div key={image.id} className="bg-gray-50 p-3 rounded-lg border">
                                {image.public_url && (
                                  <div className="mb-2">
                                    <img
                                      src={cleanImageUrl(image.public_url)}
                                      alt={image.original_filename || 'Event image'}
                                      className="w-full h-48 object-cover rounded-md border"
                                      loading="lazy"
                                      onError={(e) => {
                                        console.error('Failed to load image:', cleanImageUrl(image.public_url));
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="text-sm space-y-1">
                                  <div className="font-medium text-gray-900 truncate" title={image.original_filename}>
                                    {image.original_filename}
                                  </div>
                                  <div className="text-gray-600">
                                    {image.width && image.height && `${image.width}x${image.height} • `}
                                    {(image.file_size / 1024).toFixed(1)}KB
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {image.mime_type}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-lg border border-dashed">
                            <p className="text-gray-500 text-sm">
                              No images found for this event.
                              {event.images === undefined && ' (Images data not loaded from API)'}
                              {event.images && event.images.length === 0 && ' (Images array is empty)'}
                            </p>
                            <div className="text-xs text-gray-400 mt-2">
                              Debug: images = {JSON.stringify(event.images)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">System Data</h4>
                        <div className="space-y-1">
                          <EventField label="Event ID" value={event.id} />
                          <EventField label="Created At" value={event.created_at} />
                          <EventField label="Updated At" value={event.updated_at} />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No events found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plant Management</CardTitle>
                  <CardDescription>Manage all plants in your garden</CardDescription>
                </div>
                <Button 
                  onClick={() => setAddPlantDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Plant
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            {plants.map((plant) => (
              <Card key={plant.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plant.name}
                        <Badge variant="outline">{plant.status}</Badge>
                      </CardTitle>
                      <CardDescription>Plant ID: {plant.id}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlantClick(plant)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePlantClick(plant)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <EventField label="Variety ID" value={plant.variety_id} />
                    <EventField label="Variety Name" value={plant.variety?.name} />
                    <EventField label="Category" value={plant.variety?.category} />
                    <EventField label="Planted Date" value={plant.planted_date} />
                    <EventField label="Status" value={plant.status} />
                    <EventField label="Notes" value={plant.notes} />
                    <EventField label="Created At" value={plant.created_at} />
                    <EventField label="Updated At" value={plant.updated_at} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {plants.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No plants found. Add your first plant to get started!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="varieties" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plant Variety Management</CardTitle>
                  <CardDescription>Manage all plant varieties in your system</CardDescription>
                </div>
                <Button 
                  onClick={() => setAddVarietyDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Variety
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            {varieties.map((variety) => (
              <Card key={variety.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {variety.name}
                        <Badge variant="outline">{variety.category}</Badge>
                      </CardTitle>
                      <CardDescription>Variety ID: {variety.id}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVarietyClick(variety)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteVarietyClick(variety)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <EventField label="Category" value={variety.category} />
                    <EventField label="Description" value={variety.description} />
                    <EventField label="Created At" value={variety.created_at} />
                    <EventField label="Updated At" value={variety.updated_at} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {varieties.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No plant varieties found. Add your first variety to get started!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Management Dialogs */}
      <EventAddDialog
        isOpen={addEventDialogOpen}
        onClose={handleCloseEventDialogs}
        plants={plants}
        onSubmit={handleEventSubmit}
        isSubmitting={isEventSubmitting}
      />

      <EventEditDialog
        isOpen={editEventDialogOpen}
        onClose={handleCloseEventDialogs}
        event={eventToEdit}
        plants={plants}
        onSubmit={handleEventSubmit}
        isSubmitting={isEventSubmitting}
      />

      <EventDeleteDialog
        isOpen={deleteEventDialogOpen}
        onClose={handleCloseEventDialogs}
        event={eventToDelete}
        onConfirm={handleDeleteEvent}
        isDeleting={isDeletingEvent}
      />

      {/* Plant Management Dialogs */}
      <PlantAddDialog
        isOpen={addPlantDialogOpen}
        onClose={handleClosePlantDialogs}
        varieties={varieties}
        onSubmit={handleAddPlant}
        isSubmitting={isPlantSubmitting}
      />

      <PlantEditDialog
        isOpen={editPlantDialogOpen}
        onClose={handleClosePlantDialogs}
        plant={plantToEdit}
        varieties={varieties}
        onSubmit={handleEditPlant}
        isSubmitting={isPlantSubmitting}
      />

      <PlantDeleteDialog
        isOpen={deletePlantDialogOpen}
        onClose={handleClosePlantDialogs}
        plant={plantToDelete}
        onConfirm={handleDeletePlant}
        isDeleting={isDeletingPlant}
      />

      {/* Plant Variety Management Dialogs */}
      <PlantVarietyAddDialog
        open={addVarietyDialogOpen}
        onOpenChange={handleCloseVarietyDialogs}
        onSubmit={handleAddVariety}
        isSubmitting={isVarietySubmitting}
      />

      <PlantVarietyEditDialog
        open={editVarietyDialogOpen}
        onOpenChange={handleCloseVarietyDialogs}
        variety={varietyToEdit}
        onSubmit={handleEditVariety}
        isSubmitting={isVarietySubmitting}
      />

      <PlantVarietyDeleteDialog
        open={deleteVarietyDialogOpen}
        onOpenChange={handleCloseVarietyDialogs}
        variety={varietyToDelete}
        onConfirm={handleDeleteVariety}
        isDeleting={isDeletingVariety}
      />
    </div>
  )
}