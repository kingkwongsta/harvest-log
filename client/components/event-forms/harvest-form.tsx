'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface HarvestFormProps {
  onSubmit: (data: {
    produce: string
    quantity: number
    unit: string
    images?: File[]
  }) => void
  isSubmitting: boolean
}

const commonUnits = [
  'pounds',
  'kilograms',
  'ounces',
  'grams',
  'pieces',
  'bunches',
  'cups',
  'liters',
  'gallons',
  'baskets',
  'bags'
]

const commonProduce = [
  'Tomatoes',
  'Lettuce',
  'Carrots',
  'Peppers',
  'Cucumbers',
  'Zucchini',
  'Beans',
  'Peas',
  'Corn',
  'Squash',
  'Eggplant',
  'Broccoli',
  'Cabbage',
  'Spinach',
  'Kale',
  'Radishes',
  'Onions',
  'Potatoes',
  'Herbs',
  'Berries'
]

export function HarvestForm({ onSubmit, isSubmitting }: HarvestFormProps) {
  const [produce, setProduce] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [customUnit, setCustomUnit] = useState('')
  const [images, setImages] = useState<File[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!produce.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please specify what you harvested.',
        variant: 'destructive',
      })
      return
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid quantity.',
        variant: 'destructive',
      })
      return
    }

    const finalUnit = unit === 'custom' ? customUnit : unit
    if (!finalUnit.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please specify the unit of measurement.',
        variant: 'destructive',
      })
      return
    }

    onSubmit({
      produce: produce.trim(),
      quantity: parseFloat(quantity),
      unit: finalUnit.trim(),
      images: images.length > 0 ? images : undefined,
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      
      if (!isImage) {
        toast({
          title: 'Invalid File',
          description: `${file.name} is not an image file.`,
          variant: 'destructive',
        })
        return false
      }
      
      if (!isValidSize) {
        toast({
          title: 'File Too Large',
          description: `${file.name} is larger than 10MB.`,
          variant: 'destructive',
        })
        return false
      }
      
      return true
    })

    setImages(prev => [...prev, ...validFiles].slice(0, 5)) // Limit to 5 images
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-green-700 flex items-center">
            🌾 Harvest Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="produce">What did you harvest? *</Label>
              <Input
                id="produce"
                value={produce}
                onChange={(e) => setProduce(e.target.value)}
                placeholder="e.g., Tomatoes, Cherry Tomatoes..."
                list="produce-suggestions"
                required
              />
              <datalist id="produce-suggestions">
                {commonProduce.map(item => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="2.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={unit} onValueChange={setUnit} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit..." />
                </SelectTrigger>
                <SelectContent>
                  {commonUnits.map(unitOption => (
                    <SelectItem key={unitOption} value={unitOption}>
                      {unitOption}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom unit...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {unit === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom-unit">Custom Unit</Label>
              <Input
                id="custom-unit"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="Enter custom unit..."
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Harvest Photos (Optional)</Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <label htmlFor="harvest-images" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-foreground">
                      Upload harvest photos
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 10MB each (max 5 photos)
                    </span>
                  </label>
                  <input
                    id="harvest-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                {images.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Harvest ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting} variant="harvest" size="lg">
          {isSubmitting ? 'Logging Harvest...' : 'Log Harvest Event'}
        </Button>
      </div>
    </form>
  )
}