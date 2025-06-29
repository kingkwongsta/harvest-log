'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Upload, X, Plus, Minus } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

import type { BloomStage } from '@/lib/api'

interface BloomFormProps {
  onSubmit: (data: {
    flower_type: string
    bloom_stage?: BloomStage
    metrics?: Record<string, any>
    images?: File[]
  }) => void
  isSubmitting: boolean
}

const bloomStages = [
  { value: 'bud', label: 'Bud', description: 'Flower buds forming' },
  { value: 'opening', label: 'Opening', description: 'Buds beginning to open' },
  { value: 'full_bloom', label: 'Full Bloom', description: 'Flowers fully open' },
  { value: 'fading', label: 'Fading', description: 'Flowers past peak' },
  { value: 'seed_set', label: 'Seed Set', description: 'Seeds/fruit developing' },
]

const commonFlowerTypes = [
  'Sunflower',
  'Marigold',
  'Zinnia',
  'Rose',
  'Dahlia',
  'Petunia',
  'Tomato Flower',
  'Pepper Flower',
  'Bean Flower',
  'Cucumber Flower',
  'Squash Flower',
  'Herb Flowers',
  'Wildflowers'
]

export function BloomForm({ onSubmit, isSubmitting }: BloomFormProps) {
  const [flowerType, setFlowerType] = useState('')
  const [bloomStage, setBloomStage] = useState<BloomStage>('full_bloom')
  const [images, setImages] = useState<File[]>([])
  
  // Bloom metrics
  const [bloomCount, setBloomCount] = useState('')
  const [flowerSize, setFlowerSize] = useState('')
  const [flowerColor, setFlowerColor] = useState('')
  const [customMetrics, setCustomMetrics] = useState<{ key: string; value: string }[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!flowerType.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please specify the type of flower.',
        variant: 'destructive',
      })
      return
    }

    if (flowerType.trim().length > 100) {
      toast({
        title: 'Validation Error',
        description: 'Flower type must be 100 characters or less.',
        variant: 'destructive',
      })
      return
    }

    // Build metrics object
    const metrics: Record<string, any> = {}
    
    if (bloomCount && parseInt(bloomCount) > 0) {
      metrics.bloom_count = parseInt(bloomCount)
    }
    
    if (flowerSize && parseFloat(flowerSize) > 0) {
      metrics.flower_size_cm = parseFloat(flowerSize)
    }
    
    if (flowerColor.trim()) {
      metrics.flower_color = flowerColor.trim()
    }

    // Add custom metrics
    customMetrics.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        // Try to parse as number, otherwise store as string
        const numValue = parseFloat(value)
        metrics[key.trim().toLowerCase().replace(/\s+/g, '_')] = 
          !isNaN(numValue) ? numValue : value.trim()
      }
    })

    onSubmit({
      flower_type: flowerType.trim(),
      bloom_stage: bloomStage,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
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

  const addCustomMetric = () => {
    setCustomMetrics(prev => [...prev, { key: '', value: '' }])
  }

  const removeCustomMetric = (index: number) => {
    setCustomMetrics(prev => prev.filter((_, i) => i !== index))
  }

  const updateCustomMetric = (index: number, field: 'key' | 'value', value: string) => {
    setCustomMetrics(prev => prev.map((metric, i) => 
      i === index ? { ...metric, [field]: value } : metric
    ))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-pink-700 flex items-center">
            🌸 Bloom Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flower-type">Flower Type *</Label>
              <Input
                id="flower-type"
                value={flowerType}
                onChange={(e) => setFlowerType(e.target.value)}
                placeholder="e.g., Sunflower, Tomato Flower..."
                list="flower-suggestions"
                maxLength={100}
                required
              />
              <datalist id="flower-suggestions">
                {commonFlowerTypes.map(type => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloom-stage">Bloom Stage</Label>
              <Select value={bloomStage} onValueChange={(value) => setBloomStage(value as BloomStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bloomStages.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      <div>
                        <div className="font-medium">{stage.label}</div>
                        <div className="text-xs text-gray-500">{stage.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Bloom Measurements (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloom-count">Number of Blooms</Label>
              <Input
                id="bloom-count"
                type="number"
                min="1"
                value={bloomCount}
                onChange={(e) => setBloomCount(e.target.value)}
                placeholder="5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flower-size">Flower Size (cm)</Label>
              <Input
                id="flower-size"
                type="number"
                step="0.1"
                min="0.1"
                value={flowerSize}
                onChange={(e) => setFlowerSize(e.target.value)}
                placeholder="7.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flower-color">Flower Color</Label>
              <Input
                id="flower-color"
                value={flowerColor}
                onChange={(e) => setFlowerColor(e.target.value)}
                placeholder="Bright yellow"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Additional Measurements</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCustomMetric}>
                <Plus className="h-4 w-4 mr-1" />
                Add Metric
              </Button>
            </div>

            {customMetrics.map((metric, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="Metric name"
                  value={metric.key}
                  onChange={(e) => updateCustomMetric(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={metric.value}
                  onChange={(e) => updateCustomMetric(index, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCustomMetric(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Bloom Photos (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="bloom-images" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload bloom photos
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB each (max 5 photos)
                  </span>
                </label>
                <input
                  id="bloom-images"
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
                    alt={`Bloom ${index + 1}`}
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
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting} className="bg-pink-500 hover:bg-pink-600 text-white" size="lg">
          {isSubmitting ? 'Recording Bloom...' : 'Record Bloom Event'}
        </Button>
      </div>
    </form>
  )
}