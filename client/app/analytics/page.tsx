"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Calendar, BarChart3, PieChart, Download } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"

const monthlyTrends = [
  { month: "Jan", total: 45, apples: 12, oranges: 8, berries: 15, pears: 10 },
  { month: "Feb", total: 62, apples: 18, oranges: 12, berries: 22, pears: 10 },
  { month: "Mar", total: 78, apples: 25, oranges: 18, berries: 28, pears: 7 },
  { month: "Apr", total: 95, apples: 32, oranges: 25, berries: 35, pears: 3 },
  { month: "May", total: 142, apples: 45, oranges: 38, berries: 42, pears: 17 },
  { month: "Jun", total: 168, apples: 52, oranges: 45, berries: 48, pears: 23 },
]

const yearlyComparison = [
  { year: "2022", total: 890, average: 74.2 },
  { year: "2023", total: 1240, average: 103.3 },
  { year: "2024", total: 590, average: 98.3 }, // Partial year
]

const fruitDistribution = [
  { name: "Apples", value: 184, color: "#ef4444", percentage: 30.1 },
  { name: "Berries", value: 190, color: "#8b5cf6", percentage: 31.1 },
  { name: "Oranges", value: 146, color: "#f97316", percentage: 23.9 },
  { name: "Pears", value: 70, color: "#10b981", percentage: 11.5 },
  { name: "Other", value: 21, color: "#6b7280", percentage: 3.4 },
]

const locationPerformance = [
  { location: "North Orchard", harvests: 45, weight: 89.2, avgQuality: 4.2 },
  { location: "South Grove", harvests: 32, weight: 67.8, avgQuality: 4.0 },
  { location: "Berry Patch", harvests: 28, weight: 34.5, avgQuality: 4.5 },
  { location: "Raised Beds", harvests: 22, weight: 28.3, avgQuality: 4.1 },
]

const weatherCorrelation = [
  { condition: "Sunny", harvests: 78, avgWeight: 2.8, quality: 4.3 },
  { condition: "Partly Cloudy", harvests: 34, avgWeight: 2.5, quality: 4.1 },
  { condition: "Overcast", harvests: 15, avgWeight: 2.2, quality: 3.8 },
]

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics & Insights</h1>
        <p className="text-gray-600 mb-8">
          Analyze your harvest patterns and optimize your garden performance.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800">
            Advanced analytics features are being developed. Check back soon for detailed harvest insights!
          </p>
        </div>
      </div>
    </div>
  )
}
