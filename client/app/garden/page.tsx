"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, MapPin, Calendar, Thermometer, Edit, Trash2, Leaf } from "lucide-react"
import Link from "next/link"

const plants = [
  {
    id: 1,
    name: "Honeycrisp Apple Tree",
    type: "Apple",
    variety: "Honeycrisp",
    plantingDate: "2022-03-15",
    location: "North Orchard",
    status: "Healthy",
    lastHarvest: "2024-06-15",
    totalHarvests: 23,
    notes: "Producing excellent fruit, needs pruning in winter",
  },
  {
    id: 2,
    name: "Blueberry Bush #1",
    type: "Blueberry",
    variety: "Bluecrop",
    plantingDate: "2023-04-20",
    location: "Berry Patch",
    status: "Excellent",
    lastHarvest: "2024-06-14",
    totalHarvests: 8,
    notes: "Young plant, very productive for its age",
  },
  {
    id: 3,
    name: "Valencia Orange Tree",
    type: "Orange",
    variety: "Valencia",
    plantingDate: "2021-11-10",
    location: "South Grove",
    status: "Good",
    lastHarvest: "2024-06-13",
    totalHarvests: 31,
    notes: "Mature tree, consistent producer",
  },
  {
    id: 4,
    name: "Strawberry Bed A",
    type: "Strawberry",
    variety: "Albion",
    plantingDate: "2024-02-28",
    location: "Raised Beds",
    status: "Good",
    lastHarvest: "2024-06-12",
    totalHarvests: 5,
    notes: "First year planting, establishing well",
  },
  {
    id: 5,
    name: "Gala Apple Tree",
    type: "Apple",
    variety: "Gala",
    plantingDate: "2022-03-15",
    location: "North Orchard",
    status: "Needs Attention",
    lastHarvest: "2024-06-11",
    totalHarvests: 19,
    notes: "Some leaf curl noticed, may need treatment",
  },
]

const locations = [
  {
    id: 1,
    name: "North Orchard",
    area: "1,200 sq ft",
    plants: 8,
    soilType: "Loamy",
    sunlight: "Full Sun",
    irrigation: "Drip System",
  },
  {
    id: 2,
    name: "South Grove",
    area: "800 sq ft",
    plants: 5,
    soilType: "Sandy Loam",
    sunlight: "Full Sun",
    irrigation: "Sprinkler",
  },
  {
    id: 3,
    name: "Berry Patch",
    area: "400 sq ft",
    plants: 12,
    soilType: "Acidic",
    sunlight: "Partial Sun",
    irrigation: "Hand Watering",
  },
  {
    id: 4,
    name: "Raised Beds",
    area: "300 sq ft",
    plants: 6,
    soilType: "Compost Mix",
    sunlight: "Full Sun",
    irrigation: "Drip System",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Excellent":
      return "bg-green-100 text-green-800"
    case "Healthy":
      return "bg-blue-100 text-blue-800"
    case "Good":
      return "bg-yellow-100 text-yellow-800"
    case "Needs Attention":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function GardenPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredPlants = plants.filter(plant => 
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterType === 'all' || plant.type.toLowerCase() === filterType.toLowerCase()) &&
    (filterStatus === 'all' || plant.status.toLowerCase() === filterStatus.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Garden</h1>
              <p className="text-gray-600">Manage your plants and garden locations</p>
            </div>
            <Link href="/garden/plants/new">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Plant
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Garden Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
              <Leaf className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">31</div>
              <p className="text-xs text-muted-foreground">
                Across 4 locations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Garden Area</CardTitle>
              <MapPin className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,700</div>
              <p className="text-xs text-muted-foreground">
                Square feet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Harvests</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">86</div>
              <p className="text-xs text-muted-foreground">
                This season
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Thermometer className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2/5</div>
              <p className="text-xs text-muted-foreground">
                Average plant health
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Garden Management Tabs */}
        <Tabs defaultValue="plants" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:grid-cols-3">
            <TabsTrigger value="plants">Plants</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="schedule">Care Schedule</TabsTrigger>
          </TabsList>

          {/* Plants Tab */}
          <TabsContent value="plants" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search plants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="blueberry">Blueberry</SelectItem>
                      <SelectItem value="strawberry">Strawberry</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="needs attention">Needs Attention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Plants List */}
            <div className="space-y-4">
              {filteredPlants.map((plant) => (
                <Card key={plant.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Leaf className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{plant.name}</h3>
                            <Badge className={getStatusColor(plant.status)}>
                              {plant.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Type:</span> {plant.type}
                            </div>
                            <div>
                              <span className="font-medium">Variety:</span> {plant.variety}
                            </div>
                            <div>
                              <span className="font-medium">Planted:</span> {plant.plantingDate}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {plant.location}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Last Harvest:</span> {plant.lastHarvest}
                            </div>
                            <div>
                              <span className="font-medium">Total Harvests:</span> {plant.totalHarvests}
                            </div>
                          </div>
                          {plant.notes && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {plant.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
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
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {locations.map((location) => (
                <Card key={location.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{location.name}</CardTitle>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardDescription>{location.area} • {location.plants} plants</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Soil Type:</span>
                        <div className="text-gray-600">{location.soilType}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Sunlight:</span>
                        <div className="text-gray-600">{location.sunlight}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Irrigation:</span>
                        <div className="text-gray-600">{location.irrigation}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>\
