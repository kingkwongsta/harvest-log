"use client"

import { useState, useEffect } from "react"
import { harvestLogsApi, ApiError, type HarvestLogResponse } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Apple, Search, Calendar, MapPin, Camera, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function HarvestsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterFruit, setFilterFruit] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [harvests, setHarvests] = useState<HarvestLogResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHarvests = async () => {
      try {
        setLoading(true)
        const response = await harvestLogsApi.getAll()
        if (response.success && response.data) {
          setHarvests(response.data)
        } else {
          setError(response.message || "Failed to load harvests")
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError("Failed to load harvests")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchHarvests()
  }, [])

  const filteredHarvests = harvests
    .filter(
      (harvest) =>
        harvest.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterFruit === "all" || harvest.crop_name.toLowerCase().includes(filterFruit.toLowerCase())),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.harvest_date).getTime() - new Date(a.harvest_date).getTime()
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
            <Link href="/harvests/new">
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

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600">Loading harvests...</p>
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
        {!loading && !error && filteredHarvests.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Apple className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">No harvests found</p>
                <p className="text-sm text-gray-500">Start by adding your first harvest entry</p>
                <Link href="/harvests/new">
                  <Button className="mt-4 bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Harvest
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Harvest List */}
        {!loading && !error && (
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
                        <h3 className="text-lg font-semibold">{harvest.crop_name}</h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Quantity:</span> {harvest.quantity} {harvest.unit}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(harvest.harvest_date).toLocaleDateString()}
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
        )}
      </div>
    </div>
  )
}
