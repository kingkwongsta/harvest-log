'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import type { PlantVariety } from '@/lib/api'

interface PlantVarietyDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variety: PlantVariety | null
  onConfirm: () => void
  isDeleting: boolean
}

export function PlantVarietyDeleteDialog({
  open,
  onOpenChange,
  variety,
  onConfirm,
  isDeleting
}: PlantVarietyDeleteDialogProps) {
  const [confirmationNumber, setConfirmationNumber] = useState('')

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmationNumber('')
    }
    onOpenChange(newOpen)
  }

  const handleConfirm = () => {
    if (confirmationNumber === '8') {
      onConfirm()
    }
  }

  const handleCancel = () => {
    setConfirmationNumber('')
    onOpenChange(false)
  }

  const isConfirmationValid = confirmationNumber === '8'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Plant Variety
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the plant variety
            <span className="font-semibold"> "{variety?.name}"</span> and remove it from the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Warning</h4>
            <p className="text-sm text-red-700">
              Deleting this plant variety will prevent it from being selected when creating new plants.
              However, existing plants that use this variety will keep their variety information.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type the number <span className="font-mono font-bold">8</span> to confirm deletion:
            </Label>
            <Input
              id="confirmation"
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
              placeholder="Enter 8 to confirm"
              className="font-mono"
              disabled={isDeleting}
            />
          </div>

          {variety && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-semibold text-gray-800 mb-1">Variety Details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Name:</span> {variety.name}</p>
                <p><span className="font-medium">Category:</span> {variety.category}</p>
                {variety.description && (
                  <p><span className="font-medium">Description:</span> {variety.description}</p>
                )}

              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Variety'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 