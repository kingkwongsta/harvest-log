"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, Search, Grid, List, Calendar, MapPin, Download, Share, Trash2, Upload } from "lucide-react"
import Link from "next/link"

const photos = [
  {
    id: 1,
    url: "/placeholder.svg?height=300&width=300",
    harvestId: 1,
    fruit: "Honeycrisp Apples",
    date: "2024-06-15",
    location: "North Orchard",
    size: "2.3 MB",
    dimensions: "1920x1080",
    tags: ["apples", "red", "ripe"],
  },
  {
    id: 2,
    url: "/placeholder.svg?height=300&width=300",
    harvestId: 2,
    fruit: "Blueberries",
    date: "2024-06-14",
    location: "Berry Patch",
    size: "1.8 MB",
    dimensions: "1600x1200",
    tags: ["berries", "blue", "cluster"],
  },
  {
    id: 3,
    url: "/placeholder.svg?height=300&width=300",
    harvestId: 1,
    fruit: "Honeycrisp Apples",
    date: "2024-06-15",
    location: "North Orchard",
    size: "2.1 MB",
    dimensions: "1920x1080",
    tags: ["apples", "tree", "harvest"],
  },
  {
    id: 4,
    url: "/placeholder.svg?height=300&width=300",
    harvestId: 3,
    fruit: "Valencia Oranges",
    date: "2024-06-13",
    location: "South Grove",
    size: "2.5 MB",
    dimensions: "2048x1536",
    tags: ["oranges", "citrus", "bright"],
  },
  {
    id: 5,
    url: "/placeholder.svg?height=300&width=300",
    harvestId: 4,
    fruit: "Strawberries",
    date: "2024-06-12",
    location: "Raised Beds",
    size: "1.9 MB",
    dimensions: "1800x1200",
    tags: ["strawberries", "red", "fresh"],
  },
  {
    id: 6,
    url: "/placeholder.svg?height=300&width=300",
    harvestId: 2,
    fruit: "Blueberries",
    date: "2024-06-14",
    location: "Berry Patch",
    size: "2.0 MB",
    dimensions: "1920x1280",
    tags: ["berries", "bush", "leaves"],
  },
]

export default function PhotosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterFruit, setFilterFruit] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedPhoto, setSelectedPhoto] = useState<(typeof photos)[0] | null>(null)

  const filteredPhotos = photos.filter(
    (photo) =>
      photo.fruit.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterFruit === "all" || photo.fruit.toLowerCase().includes(filterFruit.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
              <p className="text-gray-600">Browse and manage your harvest photos</p>
            </div>
            <Link href="/photos/upload">
              <Button className="bg-green-600 hover:bg-green-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Photos
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
                    placeholder="Search photos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterFruit} onValueChange={setFilterFruit}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by fruit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fruits</SelectItem>
                  <SelectItem value="apple">Apples</SelectItem>
                  <SelectItem value="berry">Berries</SelectItem>
                  <SelectItem value="orange">Oranges</SelectItem>
                  <SelectItem value="strawberry">Strawberries</SelectItem>
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

        {/* Photo Grid */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-square relative" onClick={() => setSelectedPhoto(photo)}>
                  <img
                    src={photo.url || "/placeholder.svg"}
                    alt={`${photo.fruit} harvest`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-black/50 text-white">{photo.fruit}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      {photo.date}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      {photo.location}
                    </div>
                    <div className="text-xs text-gray-500">
                      {photo.dimensions} • {photo.size}
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
                    <div
                      className="w-20 h-20 rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={photo.url || "/placeholder.svg"}
                        alt={`${photo.fruit} harvest`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{photo.fruit}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {photo.date}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {photo.location}
                        </div>
                        <div>Size: {photo.size}</div>
                        <div>{photo.dimensions}</div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {photo.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredPhotos.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterFruit !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by uploading your first harvest photos"}
              </p>
              <Link href="/photos/upload">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photos
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photo Detail Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPhoto.fruit}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="aspect-video relative rounded-lg overflow-hidden">
                  <img
                    src={selectedPhoto.url || "/placeholder.svg"}
                    alt={`${selectedPhoto.fruit} harvest`}
                    className="w-full h-full object-contain bg-gray-100"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Date:</span>
                    <div className="text-gray-600">{selectedPhoto.date}</div>
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>
                    <div className="text-gray-600">{selectedPhoto.location}</div>
                  </div>
                  <div>
                    <span className="font-medium">Size:</span>
                    <div className="text-gray-600">{selectedPhoto.size}</div>
                  </div>
                  <div>
                    <span className="font-medium">Dimensions:</span>
                    <div className="text-gray-600">{selectedPhoto.dimensions}</div>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPhoto.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
