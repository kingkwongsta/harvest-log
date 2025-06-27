"use client"

import React, { useState } from "react"
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
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Garden</h1>
        <p className="text-gray-600 mb-8">
          Manage your plants and garden locations for optimal harvest tracking.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-green-800">
            Garden management features are being developed. Soon you'll be able to track plants, locations, and growing conditions!
          </p>
        </div>
      </div>
    </div>
  )
}
