"use client"

import { useState, useEffect } from "react"
import { eventsApi, plantsApi, PlantEvent, Plant, PlantVariety } from "@/lib/api"
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
import type { PlantFormData } from "@/components/admin/plant-form"
import type { PlantVarietyFormData } from "@/components/admin/plant-variety-form"


export default function AdminPage() {
  const [events, setEvents] = useState<PlantEvent[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [varieties, setVarieties] = useState<PlantVariety[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<PlantEvent | null>(null)
  const [deleteConfirmationNumber, setDeleteConfirmationNumber] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  
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
      event.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.plant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.produce?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = eventTypeFilter === "all" || event.event_type === eventTypeFilter
    
    return matchesSearch && matchesType
  })

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId)
  }

  const handleDeleteClick = (event: PlantEvent) => {
    setEventToDelete(event)
    setDeleteConfirmationNumber("")
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirmationNumber !== "8" || !eventToDelete) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await eventsApi.delete(eventToDelete.id)
      if (response.success) {
        setEvents(prev => prev.filter(e => e.id !== eventToDelete.id))
        setDeleteDialogOpen(false)
        setEventToDelete(null)
        setDeleteConfirmationNumber("")
      } else {
        console.error('Failed to delete event:', response.message)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setEventToDelete(null)
    setDeleteConfirmationNumber("")
  }

  // Plant management functions
  const handleAddPlant = async (data: PlantFormData) => {
    setIsPlantSubmitting(true)
    try {
      const response = await plantsApi.createPlant(data)
      if (response.success) {
        setPlants(prev => [...prev, response.data!])
        setAddPlantDialogOpen(false)
        toast({
          title: 'Success',
          description: 'Plant created successfully!',
        })
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create plant',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating plant:', error)
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
    
    setIsPlantSubmitting(true)
    try {
      const response = await plantsApi.updatePlant(plantToEdit.id, data)
      if (response.success) {
        setPlants(prev => prev.map(p => p.id === plantToEdit.id ? response.data! : p))
        setEditPlantDialogOpen(false)
        setPlantToEdit(null)
        toast({
          title: 'Success',
          description: 'Plant updated successfully!',
        })
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update plant',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating plant:', error)
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
    
    setIsDeletingPlant(true)
    try {
      const response = await plantsApi.deletePlant(plantToDelete.id)
      if (response.success) {
        setPlants(prev => prev.filter(p => p.id !== plantToDelete.id))
        setDeletePlantDialogOpen(false)
        setPlantToDelete(null)
        toast({
          title: 'Success',
          description: 'Plant deleted successfully!',
        })
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete plant',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting plant:', error)
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
    setIsVarietySubmitting(true)
    try {
      const response = await plantsApi.createVariety(data)
      if (response.success) {
        setVarieties(prev => [...prev, response.data!])
        setAddVarietyDialogOpen(false)
        toast({
          title: 'Success',
          description: 'Plant variety created successfully!',
        })
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create plant variety',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating plant variety:', error)
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
    
    setIsVarietySubmitting(true)
    try {
      const response = await plantsApi.updateVariety(varietyToEdit.id, data)
      if (response.success) {
        setVarieties(prev => prev.map(v => v.id === varietyToEdit.id ? response.data! : v))
        setEditVarietyDialogOpen(false)
        setVarietyToEdit(null)
        toast({
          title: 'Success',
          description: 'Plant variety updated successfully!',
        })
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update plant variety',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating plant variety:', error)
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
    
    setIsDeletingVariety(true)
    try {
      const response = await plantsApi.deleteVariety(varietyToDelete.id)
      if (response.success) {
        setVarieties(prev => prev.filter(v => v.id !== varietyToDelete.id))
        setDeleteVarietyDialogOpen(false)
        setVarietyToDelete(null)
        toast({
          title: 'Success',
          description: 'Plant variety deleted successfully!',
        })
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete plant variety',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting plant variety:', error)
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
              <CardTitle>Event Filters</CardTitle>
              <CardDescription>Filter and search through all logged events</CardDescription>
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
                        {event.plant?.name || event.produce || `${event.event_type} Event`}
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
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(event)}
                      >
                        Delete
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
                        <EventField label="Notes" value={event.notes} />
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
                            <EventField label="Produce" value={event.produce} />
                            <EventField label="Quantity" value={event.quantity} />
                            {/* Plant Variety field removed - using Plant field instead */}
                            <EventField label="Metrics" value={event.metrics} />
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
                      
                      {event.images && event.images.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Images ({event.images.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {event.images.map((image) => (
                              <div key={image.id} className="bg-gray-50 p-2 rounded text-sm">
                                <div className="font-medium">{image.original_filename}</div>
                                <div className="text-gray-600">
                                  {image.width}x{image.height} • {(image.file_size / 1024).toFixed(1)}KB • {image.mime_type}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
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
                    <EventField label="Growing Season" value={variety.growing_season} />
                    <EventField label="Days to Harvest" value={variety.harvest_time_days} />
                    <EventField label="Typical Yield" value={variety.typical_yield} />
                    <EventField label="Care Instructions" value={variety.care_instructions} />
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {eventToDelete && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={eventToDelete.event_type === 'harvest' ? 'default' : eventToDelete.event_type === 'bloom' ? 'secondary' : 'outline'}>
                    {eventToDelete.event_type}
                  </Badge>
                  <span className="font-medium">
                    {eventToDelete.plant?.name || eventToDelete.produce || `${eventToDelete.event_type} Event`}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Event ID: {eventToDelete.id}</div>
                  <div>Date: {new Date(eventToDelete.event_date).toLocaleDateString()}</div>
                  <div>Created: {formatDistanceToNow(new Date(eventToDelete.created_at), { addSuffix: true })}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="delete-confirmation" className="block text-sm font-medium">
                  Enter the confirmation code to delete:
                </label>
                <Input
                  id="delete-confirmation"
                  type="number"
                  value={deleteConfirmationNumber}
                  onChange={(e) => setDeleteConfirmationNumber(e.target.value)}
                  placeholder="Confirmation code"
                  className={deleteConfirmationNumber === "8" ? "border-green-500" : ""}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmationNumber !== "8" || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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