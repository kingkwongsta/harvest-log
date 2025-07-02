'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { Plant, PlantVariety, PlantStatus } from '@/lib/api'

export interface PlantFormData {
  name: string
  variety_id?: string
  planted_date?: string
  status: PlantStatus
  notes?: string
}

interface PlantFormProps {
  varieties: PlantVariety[]
  initialData?: Plant
  onSubmit: (data: PlantFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

export interface PlantFormRef {
  reset: () => void
}

const statusOptions: { value: PlantStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'harvested', label: 'Harvested' },
  { value: 'deceased', label: 'Deceased' },
  { value: 'dormant', label: 'Dormant' }
]

export const PlantForm = forwardRef<PlantFormRef, PlantFormProps>(
  ({ varieties, initialData, onSubmit, onCancel, isSubmitting }, ref) => {
    const [name, setName] = useState(initialData?.name || '')
    const [varietyId, setVarietyId] = useState(initialData?.variety_id || '')
    const [plantedDate, setPlantedDate] = useState(
      initialData?.planted_date ? initialData.planted_date.split('T')[0] : ''
    )
    const [status, setStatus] = useState<PlantStatus>(initialData?.status || 'active')
    const [notes, setNotes] = useState(initialData?.notes || '')

    const resetForm = () => {
      setName('')
      setVarietyId('')
      setPlantedDate('')
      setStatus('active')
      setNotes('')
    }

    useImperativeHandle(ref, () => ({
      reset: resetForm
    }))

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      if (!name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Plant name is required.',
          variant: 'destructive',
        })
        return
      }

      if (name.trim().length > 100) {
        toast({
          title: 'Validation Error',
          description: 'Plant name must be 100 characters or less.',
          variant: 'destructive',
        })
        return
      }

      onSubmit({
        name: name.trim(),
        variety_id: varietyId || undefined,
        planted_date: plantedDate || undefined,
        status,
        notes: notes.trim() || undefined,
      })
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center">
              🌱 {initialData ? 'Edit Plant' : 'Add New Plant'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plant Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter plant name..."
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variety">Plant Variety (Optional)</Label>
              <Select value={varietyId} onValueChange={setVarietyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a variety..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No variety selected</SelectItem>
                  {varieties.map((variety) => (
                    <SelectItem key={variety.id} value={variety.id}>
                      {variety.name} ({variety.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planted-date">Planted Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="planted-date"
                  type="date"
                  value={plantedDate}
                  onChange={(e) => setPlantedDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PlantStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this plant..."
                rows={3}
                maxLength={2000}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} variant="default">
            {isSubmitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Plant' : 'Create Plant')}
          </Button>
        </div>
      </form>
    )
  }
)

PlantForm.displayName = 'PlantForm'