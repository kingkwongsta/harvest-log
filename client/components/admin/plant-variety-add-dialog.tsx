'use client'

import { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlantVarietyForm, PlantVarietyFormData, PlantVarietyFormRef } from './plant-variety-form'

interface PlantVarietyAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PlantVarietyFormData) => void
  isSubmitting: boolean
}

export function PlantVarietyAddDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: PlantVarietyAddDialogProps) {
  const formRef = useRef<PlantVarietyFormRef>(null)

  const handleSubmit = (data: PlantVarietyFormData) => {
    onSubmit(data)
  }

  const handleCancel = () => {
    formRef.current?.reset()
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      formRef.current?.reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Plant Variety</DialogTitle>
        </DialogHeader>
        
        <PlantVarietyForm
          ref={formRef}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
} 