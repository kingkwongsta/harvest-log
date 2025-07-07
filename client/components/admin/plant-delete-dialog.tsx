'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import type { Plant } from '@/lib/api'

interface PlantDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  plant: Plant | null
  onConfirm: () => void
  isDeleting: boolean
}

export const PlantDeleteDialog = ({
  isOpen,
  onClose,
  plant,
  onConfirm,
  isDeleting
}: PlantDeleteDialogProps) => {
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
          <DialogTitle>Delete Plant</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this plant? This action cannot be undone.
            <br />
            <strong>Note:</strong> All associated events will also be deleted.
          </DialogDescription>
        </DialogHeader>
        
        {plant && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{plant.status}</Badge>
                <span className="font-medium">{plant.name}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Plant ID: {plant.id}</div>
                {plant.variety && <div>Variety: {plant.variety.name} ({plant.variety.category})</div>}
                {plant.planted_date && <div>Planted: {new Date(plant.planted_date).toLocaleDateString()}</div>}
                <div>Created: {formatDistanceToNow(new Date(plant.created_at), { addSuffix: true })}</div>
                {plant.events && plant.events.length > 0 && (
                  <div className="text-red-600 font-medium">
                    ⚠️ This plant has {plant.events.length} associated events that will also be deleted
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
                placeholder="Enter code to delete"
                className={confirmationNumber === "8" ? "border-green-500" : ""}
              />
              <p className="text-xs text-gray-500">
                Enter the confirmation code to delete
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
            {isDeleting ? "Deleting..." : "Delete Plant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}