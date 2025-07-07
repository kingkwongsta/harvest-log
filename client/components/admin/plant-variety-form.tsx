'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Sprout } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { PlantVariety, PlantCategory } from '@/lib/api'

export interface PlantVarietyFormData {
  name: string
  category: PlantCategory
  description?: string
}

interface PlantVarietyFormProps {
  initialData?: PlantVariety
  onSubmit: (data: PlantVarietyFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

export interface PlantVarietyFormRef {
  reset: () => void
}

const categoryOptions: { value: PlantCategory; label: string }[] = [
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'flower', label: 'Flower' },
  { value: 'herb', label: 'Herb' },
  { value: 'tree', label: 'Tree' },
  { value: 'shrub', label: 'Shrub' },
  { value: 'other', label: 'Other' }
]

export const PlantVarietyForm = forwardRef<PlantVarietyFormRef, PlantVarietyFormProps>(
  ({ initialData, onSubmit, onCancel, isSubmitting }, ref) => {
    const [name, setName] = useState(initialData?.name || '')
    const [category, setCategory] = useState<PlantCategory>(initialData?.category || 'vegetable')
    const [description, setDescription] = useState(initialData?.description || '')

    const resetForm = () => {
      setName('')
      setCategory('vegetable')
      setDescription('')
    }

    useImperativeHandle(ref, () => ({
      reset: resetForm
    }))

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      if (!name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Plant variety name is required.',
          variant: 'destructive',
        })
        return
      }

      if (name.trim().length > 100) {
        toast({
          title: 'Validation Error',
          description: 'Plant variety name must be 100 characters or less.',
          variant: 'destructive',
        })
        return
      }

      // Check for invalid characters (allow HTML entities for apostrophes)
      const validCharRegex = /^[a-zA-Z0-9\s\-_\'\.\&\,\(\);:/+"#x;]*$/
      if (!validCharRegex.test(name.trim())) {
        toast({
          title: 'Validation Error',
          description: 'Plant variety name contains invalid characters. Please use only letters, numbers, spaces, and allowed punctuation.',
          variant: 'destructive',
        })
        return
      }

      onSubmit({
        name: name.trim(),
        category,
        description: description.trim() || undefined,
      })
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center">
              <Sprout className="mr-2 h-5 w-5" />
              {initialData ? 'Edit Plant Variety' : 'Add New Plant Variety'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Variety Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter variety name..."
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Allowed: letters, numbers, spaces, and common punctuation (- _ &apos; . &amp; , ( ) ; : / + &quot;)
                  <br />
                  Not allowed: &lt; &gt; @ # $ % ^ * [ ] {'{}'} | \ ` ~ ! ?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as PlantCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this plant variety..."
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
            {isSubmitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Variety' : 'Create Variety')}
          </Button>
        </div>
      </form>
    )
  }
)

PlantVarietyForm.displayName = 'PlantVarietyForm' 