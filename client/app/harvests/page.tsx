"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Apple, Search, Calendar, MapPin, Camera, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

const harvests = [
  {
    id: 1,
    fruit: "Tomatoes",
    quantity: 8,
    weight: "3.2 lbs",
    date: "2024-06-20",
    location: "Raised Bed #1",
    notes: "Perfect ripeness, great for salads",
    photos: 2,
  },
  {
    id: 2,
    fruit: "Apples",
    quantity: 12,
    weight: "4.5 lbs",
    date: "2024-06-18",
    location: "Apple Tree",
    notes: "Sweet and crispy, stored some for winter",
    photos: 1,
  },
  {
    id: 3,
    fruit: "Lettuce",
    quantity: 6,
    weight: "1.8 lbs",
    date: "2024-06-15",
    location: "Garden Bed",
    notes: "Fresh and tender leaves",
    photos: 0,
  },
  {
    id: 4,
    fruit: "Berries",
    quantity: 24,
    weight: "2.1 lbs",
    date: "2024-06-12",
    location: "Berry Patch",
    notes: "Very sweet this year, made jam",
    photos: 3,
  },
  {
    id: 5,
    fruit: "Herbs",
    quantity: 1,
    weight: "0.5 lbs",
    date: "2024-06-10",
    location: "Herb Garden",
    notes: "Basil, oregano, and thyme mix",
    photos: 1,
  },
  {
    id: 6,
    fruit: "Peppers",
    quantity: 5,
    weight: "1.2 lbs",
    date: "2024-06-08",
    location: "Greenhouse",
    notes: "Bell peppers, nice and colorful",
    photos: 2,
  },
]

export default function HarvestsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterFruit, setFilterFruit] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  const filteredHarvests = harvests
    .filter(
      (harvest) =>
        harvest.fruit.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterFruit === "all" || harvest.fruit.toLowerCase().includes(filterFruit.toLowerCase())),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "quantity":
          return b.quantity - a.quantity
        default:
          return 0
      }
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Apple className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">All Harvests</h1>
                  <p className="text-sm text-gray-600">{harvests.length} total entries</p>
                </div>
              </div>
            </div>
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search harvests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterFruit} onValueChange={setFilterFruit}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All fruits" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tomatoes">Tomatoes</SelectItem>
                  <SelectItem value="apples">Apples</SelectItem>
                  <SelectItem value="berries">Berries</SelectItem>
                  <SelectItem value="lettuce">Lettuce</SelectItem>
                  <SelectItem value="herbs">Herbs</SelectItem>
                  <SelectItem value="peppers">Peppers</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date (Newest)</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Harvest List */}
        <div className="space-y-4">
          {filteredHarvests.map((harvest) => (
            <Card key={harvest.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Apple className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{harvest.fruit}</h3>
                        {harvest.photos > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Camera className="w-3 h-3 mr-1" />
                            {harvest.photos}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Quantity:</span> {harvest.quantity}
                        </div>
                        {harvest.weight && (
                          <div>
                            <span className="font-medium">Weight:</span> {harvest.weight}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {harvest.date}
                        </div>
                        {harvest.location && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {harvest.location}
                          </div>
                        )}
                      </div>

                      {harvest.notes && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {harvest.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredHarvests.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Apple className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No harvests found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterFruit !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by logging your first harvest"}
              </p>
              <Link href="/">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Your First Harvest
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
