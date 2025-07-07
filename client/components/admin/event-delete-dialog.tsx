'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import type { PlantEvent } from '@/lib/api'

interface EventDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  event: PlantEvent | null
  onConfirm: () => void
  isDeleting: boolean
}

export const EventDeleteDialog = ({
  isOpen,
  onClose,
  event,
  onConfirm,
  isDeleting
}: EventDeleteDialogProps) => {
  const [confirmationNumber, setConfirmationNumber] = useState('')

  const handleClose = () => {
    setConfirmationNumber('')
    onClose()
  }

  const handleConfirm = () => {
    if (confirmationNumber === '8') {
      onConfirm()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this event? This action cannot be undone.
            <br />
            <strong>Note:</strong> All associated images will also be deleted.
          </DialogDescription>
        </DialogHeader>
        
        {event && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={
                  event.event_type === 'harvest' ? 'default' :
                  event.event_type === 'bloom' ? 'secondary' : 'outline'
                }>
                  {event.event_type}
                </Badge>
                <span className="font-medium">
                  {event.plant?.name || event.plant_variety || `${event.event_type} Event`}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Event ID: {event.id}</div>
                <div>Date: {new Date(event.event_date).toLocaleDateString()}</div>
                {event.description && <div>Description: {event.description}</div>}
                {event.plant && <div>Plant: {event.plant.name}</div>}
                {event.quantity && <div>Quantity: {event.quantity}</div>}
                <div>Created: {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</div>
                {event.images && event.images.length > 0 && (
                  <div className="text-red-600 font-medium">
                    ⚠️ This event has {event.images.length} associated images that will also be deleted
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation" className="block text-sm font-medium">
                Enter the confirmation code to delete:
              </Label>
              <Input
                id="delete-confirmation"
                type="number"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                placeholder="Confirmation code"
                className={confirmationNumber === "8" ? "border-green-500" : ""}
              />
              <p className="text-xs text-gray-500">
                Enter <strong>8</strong> to confirm deletion
              </p>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={confirmationNumber !== "8" || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 