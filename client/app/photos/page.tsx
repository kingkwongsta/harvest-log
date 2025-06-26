"use client"

import { useState, useEffect } from "react"
import { harvestLogsApi, imagesApi, ApiError, type HarvestLogResponse, type HarvestImage } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Camera, Search, Grid, List, Calendar, MapPin, Download, Share, Trash2, Upload, ArrowLeft, Eye } from "lucide-react"
import Link from "next/link"

interface PhotoWithHarvest extends HarvestImage {
  harvest?: HarvestLogResponse;
}

export default function PhotosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterFruit, setFilterFruit] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithHarvest | null>(null)
  const [photos, setPhotos] = useState<PhotoWithHarvest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllPhotos = async () => {
      try {
        setLoading(true)
        setError(null)

        // First, get all harvest logs with their images
        const harvestResponse = await harvestLogsApi.getAll()
        
        if (harvestResponse.success && harvestResponse.data) {
          // Flatten all images from all harvests
          const allPhotos: PhotoWithHarvest[] = []
          
          harvestResponse.data.forEach(harvest => {
            if (harvest.images && harvest.images.length > 0) {
              harvest.images.forEach(image => {
                allPhotos.push({
                  ...image,
                  harvest: harvest
                })
              })
            }
          })

          setPhotos(allPhotos)
        } else {
          setError(harvestResponse.message || "Failed to load photos")
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError("Failed to load photos")
        }
        console.error("Error fetching photos:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAllPhotos()
  }, [])

  const filteredPhotos = photos.filter((photo) => {
    const cropName = photo.harvest?.crop_name || ""
    const searchMatch = cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       photo.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
    
    const filterMatch = filterFruit === "all" || 
                       cropName.toLowerCase().includes(filterFruit.toLowerCase())
    
    return searchMatch && filterMatch
  })

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDimensions = (width?: number, height?: number): string => {
    if (width && height) {
      return `${width}x${height}`
    }
    return 'Unknown'
  }

  const deletePhoto = async (photoId: string) => {
    try {
      const response = await imagesApi.delete(photoId)
      if (response.success) {
        // Remove photo from local state
        setPhotos(prev => prev.filter(p => p.id !== photoId))
        setSelectedPhoto(null)
      } else {
        alert(`Failed to delete photo: ${response.message}`)
      }
    } catch (error) {
      console.error("Error deleting photo:", error)
      alert("Failed to delete photo")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
                <p className="text-gray-600">
                  {loading ? "Loading photos..." : `${photos.length} harvest photos`}
                </p>
              </div>
            </div>
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700">
                <Upload className="w-4 h-4 mr-2" />
                Add Harvest
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search photos by crop or filename..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterFruit} onValueChange={setFilterFruit}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  <SelectItem value="apples">Apples</SelectItem>
                  <SelectItem value="tomatoes">Tomatoes</SelectItem>
                  <SelectItem value="berries">Berries</SelectItem>
                  <SelectItem value="oranges">Oranges</SelectItem>
                  <SelectItem value="peppers">Peppers</SelectItem>
                  <SelectItem value="lettuce">Lettuce</SelectItem>
                  <SelectItem value="herbs">Herbs</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600">Loading photos...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-red-600">⚠️ {error}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && photos.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">No photos found</p>
                <p className="text-sm text-gray-500">Upload photos when logging harvests to see them here</p>
                <Link href="/">
                  <Button className="mt-4 bg-green-600 hover:bg-green-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Log First Harvest
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Grid */}
        {!loading && !error && filteredPhotos.length > 0 && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative group cursor-pointer">
                      <img
                        src={photo.public_url || "/placeholder.svg"}
                        alt={`${photo.harvest?.crop_name} harvest`}
                        className="w-full h-full object-cover"
                        onClick={() => setSelectedPhoto(photo)}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-black/50 text-white">
                          {photo.harvest?.crop_name || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          {photo.harvest ? new Date(photo.harvest.harvest_date).toLocaleDateString() : 'Unknown date'}
                        </div>
                        {photo.harvest?.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            {photo.harvest.location}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {formatDimensions(photo.width, photo.height)} • {formatFileSize(photo.file_size)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {filteredPhotos.map((photo) => (
                  <Card key={photo.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-4">
                        <img
                          src={photo.public_url || "/placeholder.svg"}
                          alt={`${photo.harvest?.crop_name} harvest`}
                          className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                          onClick={() => setSelectedPhoto(photo)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{photo.harvest?.crop_name || 'Unknown Crop'}</h3>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedPhoto(photo)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => deletePhoto(photo.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {photo.harvest ? new Date(photo.harvest.harvest_date).toLocaleDateString() : 'Unknown'}
                            </div>
                            {photo.harvest?.location && (
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {photo.harvest.location}
                              </div>
                            )}
                            <div>{formatDimensions(photo.width, photo.height)}</div>
                            <div>{formatFileSize(photo.file_size)}</div>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {photo.original_filename}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPhoto?.harvest?.crop_name || 'Photo'} - {selectedPhoto?.original_filename}
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedPhoto.public_url || "/placeholder.svg"}
                  alt={`${selectedPhoto.harvest?.crop_name} harvest`}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Crop:</strong> {selectedPhoto.harvest?.crop_name || 'Unknown'}
                </div>
                <div>
                  <strong>Harvest Date:</strong> {selectedPhoto.harvest ? new Date(selectedPhoto.harvest.harvest_date).toLocaleDateString() : 'Unknown'}
                </div>
                <div>
                  <strong>Dimensions:</strong> {formatDimensions(selectedPhoto.width, selectedPhoto.height)}
                </div>
                <div>
                  <strong>File Size:</strong> {formatFileSize(selectedPhoto.file_size)}
                </div>
                <div>
                  <strong>Upload Date:</strong> {new Date(selectedPhoto.created_at).toLocaleDateString()}
                </div>
                {selectedPhoto.harvest?.location && (
                  <div>
                    <strong>Location:</strong> {selectedPhoto.harvest.location}
                  </div>
                )}
              </div>
              {selectedPhoto.harvest?.notes && (
                <div>
                  <strong>Harvest Notes:</strong>
                  <p className="text-gray-600 mt-1">{selectedPhoto.harvest.notes}</p>
                </div>
              )}
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedPhoto.public_url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deletePhoto(selectedPhoto.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
