'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, X, Plus, Minus } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface SnapshotFormProps {
  onSubmit: (data: {
    metrics: Record<string, number | string | boolean>
    images?: File[]
  }) => void
  isSubmitting: boolean
  onReset?: () => void
}

export interface SnapshotFormRef {
  reset: () => void
}

export const SnapshotForm = forwardRef<SnapshotFormRef, SnapshotFormProps>(
  ({ onSubmit, isSubmitting, onReset }, ref) => {
    const [images, setImages] = useState<File[]>([])
    
    // Growth measurements
    const [height, setHeight] = useState('')
    const [width, setWidth] = useState('')
    const [leafCount, setLeafCount] = useState('')
    const [healthScore, setHealthScore] = useState([7])
    
    // Health indicators
    const [newGrowth, setNewGrowth] = useState(false)
    const [pestIssues, setPestIssues] = useState(false)
    const [diseaseSignsPresent, setDiseaseSignsPresent] = useState(false)
    const [floweringStatus, setFloweringStatus] = useState(false)
    const [fruitingStatus, setFruitingStatus] = useState(false)
    
    // Custom metrics
    const [customMetrics, setCustomMetrics] = useState<{ key: string; value: string; type: 'number' | 'text' | 'boolean' }[]>([])

    const resetForm = () => {
      setImages([])
      setHeight('')
      setWidth('')
      setLeafCount('')
      setHealthScore([7])
      setNewGrowth(false)
      setPestIssues(false)
      setDiseaseSignsPresent(false)
      setFloweringStatus(false)
      setFruitingStatus(false)
      setCustomMetrics([])
      onReset?.()
    }

    useImperativeHandle(ref, () => ({
      reset: resetForm
    }))

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate metric ranges
    if (height && (parseFloat(height) <= 0 || parseFloat(height) > 10000)) {
      toast({
        title: 'Validation Error',
        description: 'Height must be between 0.1 and 10000 cm.',
        variant: 'destructive',
      })
      return
    }

    if (width && (parseFloat(width) <= 0 || parseFloat(width) > 10000)) {
      toast({
        title: 'Validation Error',
        description: 'Width must be between 0.1 and 10000 cm.',
        variant: 'destructive',
      })
      return
    }

    if (leafCount && (parseInt(leafCount) < 0 || parseInt(leafCount) > 10000)) {
      toast({
        title: 'Validation Error',
        description: 'Leaf count must be between 0 and 10000.',
        variant: 'destructive',
      })
      return
    }

    // Build metrics object
    const metrics: Record<string, number | string | boolean> = {}
    
    // Growth measurements
    if (height && parseFloat(height) > 0) {
      metrics.height_cm = parseFloat(height)
    }
    
    if (width && parseFloat(width) > 0) {
      metrics.width_cm = parseFloat(width)
    }
    
    if (leafCount && parseInt(leafCount) >= 0) {
      metrics.leaf_count = parseInt(leafCount)
    }
    
    // Health score (always include as it has a default)
    metrics.health_score = healthScore[0]
    
    // Health indicators
    metrics.new_growth = newGrowth
    metrics.pest_issues = pestIssues
    metrics.disease_signs = diseaseSignsPresent
    metrics.flowering = floweringStatus
    metrics.fruiting = fruitingStatus

    // Add custom metrics
    customMetrics.forEach(({ key, value, type }) => {
      if (key.trim() && value.trim()) {
        const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_')
        
        if (type === 'number') {
          const numValue = parseFloat(value)
          if (!isNaN(numValue)) {
            metrics[cleanKey] = numValue
          }
        } else if (type === 'boolean') {
          metrics[cleanKey] = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes'
        } else {
          metrics[cleanKey] = value.trim()
        }
      }
    })

    onSubmit({
      metrics,
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
    setCustomMetrics(prev => [...prev, { key: '', value: '', type: 'text' }])
  }

  const removeCustomMetric = (index: number) => {
    setCustomMetrics(prev => prev.filter((_, i) => i !== index))
  }

  const updateCustomMetric = (index: number, field: 'key' | 'value' | 'type', value: string) => {
    setCustomMetrics(prev => prev.map((metric, i) => 
      i === index ? { ...metric, [field]: value } : metric
    ))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center">
            📏 Growth Measurements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                min="0.1"
                max="10000"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="25.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">Width/Spread (cm)</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                min="0.1"
                max="10000"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="15.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaf-count">Leaf Count</Label>
              <Input
                id="leaf-count"
                type="number"
                min="0"
                max="10000"
                value={leafCount}
                onChange={(e) => setLeafCount(e.target.value)}
                placeholder="12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center">
            💚 Health Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Overall Health Score: {healthScore[0]}/10</Label>
              <Slider
                value={healthScore}
                onValueChange={setHealthScore}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-gray-500 flex justify-between">
                <span>Poor (1)</span>
                <span>Good (5)</span>
                <span>Excellent (10)</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-sm font-medium">Health Indicators</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="new-growth"
                  checked={newGrowth}
                  onCheckedChange={(checked) => setNewGrowth(checked === true)}
                />
                <Label htmlFor="new-growth" className="text-sm">
                  New growth visible
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flowering"
                  checked={floweringStatus}
                  onCheckedChange={(checked) => setFloweringStatus(checked === true)}
                />
                <Label htmlFor="flowering" className="text-sm">
                  Currently flowering
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pest-issues"
                  checked={pestIssues}
                  onCheckedChange={(checked) => setPestIssues(checked === true)}
                />
                <Label htmlFor="pest-issues" className="text-sm text-orange-700">
                  Pest issues present
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fruiting"
                  checked={fruitingStatus}
                  onCheckedChange={(checked) => setFruitingStatus(checked === true)}
                />
                <Label htmlFor="fruiting" className="text-sm">
                  Producing fruit/vegetables
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="disease-signs"
                  checked={diseaseSignsPresent}
                  onCheckedChange={(checked) => setDiseaseSignsPresent(checked === true)}
                />
                <Label htmlFor="disease-signs" className="text-sm text-red-700">
                  Disease signs present
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Additional Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Custom Metrics</Label>
            <Button type="button" variant="outline" size="sm" onClick={addCustomMetric}>
              <Plus className="h-4 w-4 mr-1" />
              Add Metric
            </Button>
          </div>

          {customMetrics.map((metric, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                placeholder="Metric name (e.g., 'stem diameter')"
                value={metric.key}
                onChange={(e) => updateCustomMetric(index, 'key', e.target.value)}
                className="flex-1"
              />
              <select
                value={metric.type}
                onChange={(e) => updateCustomMetric(index, 'type', e.target.value as 'number' | 'text' | 'boolean')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Yes/No</option>
              </select>
              <Input
                placeholder={
                  metric.type === 'number' ? '5.2' : 
                  metric.type === 'boolean' ? 'yes/no' : 'Value'
                }
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

          {customMetrics.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Add custom measurements like stem diameter, number of branches, soil moisture, etc.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Progress Photos (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="snapshot-images" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload progress photos
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB each (max 5 photos)
                  </span>
                </label>
                <input
                  id="snapshot-images"
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
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`Progress ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                    width={200}
                    height={96}
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
        <Button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-600 text-white" size="lg">
          {isSubmitting ? 'Recording Snapshot...' : 'Record Snapshot Event'}
        </Button>
      </div>
    </form>
  )
})

SnapshotForm.displayName = 'SnapshotForm'