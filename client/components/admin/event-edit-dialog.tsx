'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EventForm, EventFormData, EventCreateData } from './event-form'
import type { PlantEvent, Plant } from '@/lib/api'

interface EventEditDialogProps {
  isOpen: boolean
  onClose: () => void
  event: PlantEvent | null
  plants: Plant[]
  onSubmit: (data: EventFormData | EventCreateData) => void
  isSubmitting: boolean
}

export const EventEditDialog = ({
  isOpen,
  onClose,
  event,
  plants,
  onSubmit,
  isSubmitting
}: EventEditDialogProps) => {
  const handleSubmit = (data: EventFormData) => {
    onSubmit(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update the details of your event. Make changes to track your plant journey activities.
          </DialogDescription>
        </DialogHeader>
        {event && (
          <EventForm
            plants={plants}
            initialData={event}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )
} 