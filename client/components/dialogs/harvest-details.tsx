"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Calendar, Scale, StickyNote } from "lucide-react"
import { type HarvestLogResponse } from "@/lib/api"

interface HarvestDetailsProps {
  harvest: HarvestLogResponse
}

export const HarvestDetails = React.memo(function HarvestDetails({ harvest }: HarvestDetailsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Crop Info */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">{harvest.crop_name}</h3>
        <Badge variant="secondary" className="capitalize">
          {harvest.unit}
        </Badge>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Scale className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Amount:</span>
          <span>{harvest.quantity} {harvest.unit}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Harvested:</span>
          <span>{formatDate(harvest.harvest_date)}</span>
        </div>

        
      </div>

      {/* Notes */}
      {harvest.notes && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <StickyNote className="w-4 h-4 text-muted-foreground" />
            Notes:
          </div>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            {harvest.notes}
          </p>
        </div>
      )}
    </div>
  )
})