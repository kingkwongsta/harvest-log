'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlantForm, PlantFormData } from './plant-form'
import type { Plant, PlantVariety } from '@/lib/api'

interface PlantEditDialogProps {
  isOpen: boolean
  onClose: () => void
  plant: Plant | null
  varieties: PlantVariety[]
  onSubmit: (data: PlantFormData) => void
  isSubmitting: boolean
}

export const PlantEditDialog = ({
  isOpen,
  onClose,
  plant,
  varieties,
  onSubmit,
  isSubmitting
}: PlantEditDialogProps) => {
  const handleSubmit = (data: PlantFormData) => {
    onSubmit(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Plant</DialogTitle>
        </DialogHeader>
        {plant && (
          <PlantForm
            varieties={varieties}
            initialData={plant}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}