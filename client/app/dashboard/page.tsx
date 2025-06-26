"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Apple, Camera, TrendingUp, MapPin, Droplets } from "lucide-react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const monthlyData = [
  { month: "Jan", apples: 12, oranges: 8, berries: 15 },
  { month: "Feb", apples: 18, oranges: 12, berries: 22 },
  { month: "Mar", apples: 25, oranges: 18, berries: 28 },
  { month: "Apr", apples: 32, oranges: 25, berries: 35 },
  { month: "May", apples: 45, oranges: 38, berries: 42 },
  { month: "Jun", apples: 52, oranges: 45, berries: 48 },
]

const fruitDistribution = [
  { name: "Apples", value: 184, color: "#ef4444" },
  { name: "Oranges", value: 146, color: "#f97316" },
  { name: "Berries", value: 190, color: "#8b5cf6" },
  { name: "Pears", value: 89, color: "#10b981" },
]

const recentHarvests = [
  { id: 1, fruit: "Honeycrisp Apples", quantity: 12, weight: "8.5 lbs", date: "2024-06-15", location: "North Orchard" },
  { id: 2, fruit: "Blueberries", quantity: 45, weight: "2.3 lbs", date: "2024-06-14", location: "Berry Patch" },
  { id: 3, fruit: "Valencia Oranges", quantity: 8, weight: "6.2 lbs", date: "2024-06-13", location: "South Grove" },
  { id: 4, fruit: "Strawberries", quantity: 28, weight: "1.8 lbs", date: "2024-06-12", location: "Raised Beds" },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your harvest overview.</p>
            </div>
            <Link href="/harvests/new">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                New Harvest
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Harvests</CardTitle>
              <Apple className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">284 lbs</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photos Taken</CardTitle>
              <Camera className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">+23% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plants</CardTitle>
              <Droplets className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 new this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Harvest Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Harvest Trends</CardTitle>
              <CardDescription>Harvest quantities by fruit type over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="apples" fill="#ef4444" name="Apples" />
                  <Bar dataKey="oranges" fill="#f97316" name="Oranges" />
                  <Bar dataKey="berries" fill="#8b5cf6" name="Berries" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fruit Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Fruit Distribution</CardTitle>
              <CardDescription>Total harvest distribution by fruit type this year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fruitDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {fruitDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Harvests */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Harvests</CardTitle>
                  <CardDescription>Your latest harvest entries</CardDescription>
                </div>
                <Link href="/harvests">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentHarvests.map((harvest) => (
                  <div key={harvest.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Apple className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{harvest.fruit}</div>
                        <div className="text-sm text-gray-500">
                          {harvest.quantity} items • {harvest.weight}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{harvest.date}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {harvest.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Weather */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/harvests/new">
                  <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Log New Harvest
                  </Button>
                </Link>
                <Link href="/photos/upload">
                  <Button variant="outline" className="w-full justify-start">
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                </Link>
                <Link href="/garden/plants/new">
                  <Button variant="outline" className="w-full justify-start">
                    <Droplets className="w-4 h-4 mr-2" />
                    Add New Plant
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Weather Widget */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Weather</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">72°F</div>
                  <div className="text-gray-600">Partly Cloudy</div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Humidity</div>
                      <div className="font-medium">65%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Wind</div>
                      <div className="font-medium">8 mph</div>
                    </div>
                  </div>
                  <Badge className="mt-3 bg-green-100 text-green-800">Perfect for harvesting</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
