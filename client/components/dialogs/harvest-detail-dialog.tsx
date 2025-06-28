"use client"

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { HarvestImageGallery } from "./harvest-image-gallery"
import { HarvestDetails } from "./harvest-details"
import { type HarvestLogResponse } from "@/lib/api"

interface HarvestDetailDialogProps {
  harvest: HarvestLogResponse | null
  isOpen: boolean
  onClose: () => void
}

export function HarvestDetailDialog({ harvest, isOpen, onClose }: HarvestDetailDialogProps) {
  if (!harvest) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Harvest Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          <HarvestImageGallery images={harvest.images || []} />

          {/* Harvest Details */}
          <HarvestDetails harvest={harvest} />
        </div>
      </DialogContent>
    </Dialog>
  )
}