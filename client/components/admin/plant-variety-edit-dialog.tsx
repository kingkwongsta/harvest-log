'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlantVarietyForm, PlantVarietyFormData } from './plant-variety-form'
import type { PlantVariety } from '@/lib/api'

interface PlantVarietyEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variety: PlantVariety | null
  onSubmit: (data: PlantVarietyFormData) => void
  isSubmitting: boolean
}

export function PlantVarietyEditDialog({
  open,
  onOpenChange,
  variety,
  onSubmit,
  isSubmitting
}: PlantVarietyEditDialogProps) {
  const handleSubmit = (data: PlantVarietyFormData) => {
    onSubmit(data)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Plant Variety</DialogTitle>
        </DialogHeader>
        
        {variety && (
          <PlantVarietyForm
            initialData={variety}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )
} 