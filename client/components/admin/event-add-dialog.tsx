'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EventForm, EventFormData, EventCreateData } from './event-form'
import type { Plant } from '@/lib/api'

interface EventAddDialogProps {
  isOpen: boolean
  onClose: () => void
  plants: Plant[]
  onSubmit: (data: EventFormData | EventCreateData) => void
  isSubmitting: boolean
}

export const EventAddDialog = ({
  isOpen,
  onClose,
  plants,
  onSubmit,
  isSubmitting
}: EventAddDialogProps) => {
  const handleSubmit = (data: EventFormData) => {
    onSubmit(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Create a new event to track your plant journey activities. Choose from harvest, bloom, or snapshot events.
          </DialogDescription>
        </DialogHeader>
        <EventForm
          plants={plants}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
} 