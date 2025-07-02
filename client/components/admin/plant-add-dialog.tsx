'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PlantForm, PlantFormData } from './plant-form'
import type { PlantVariety } from '@/lib/api'

interface PlantAddDialogProps {
  isOpen: boolean
  onClose: () => void
  varieties: PlantVariety[]
  onSubmit: (data: PlantFormData) => void
  isSubmitting: boolean
}

export const PlantAddDialog = ({
  isOpen,
  onClose,
  varieties,
  onSubmit,
  isSubmitting
}: PlantAddDialogProps) => {
  const handleSubmit = (data: PlantFormData) => {
    onSubmit(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Plant</DialogTitle>
          <DialogDescription>
            Add a new plant to your garden. Fill in the details below to track your plant's journey.
          </DialogDescription>
        </DialogHeader>
        <PlantForm
          varieties={varieties}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}