"use client"

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
              <p className="text-gray-600">Analyze your harvest patterns and optimize your garden</p>
            </div>
            <div className="flex items-center space-x-3">
              <Select defaultValue="2024">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Harvests</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">590</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +23% vs last year
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">219.8 lbs</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +18% vs last year
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
              <PieChart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2/5</div>
              <div className="flex items-center text-xs text-red-600">
                <TrendingDown className="w-3 h-3 mr-1" />
                -0.1 vs last year
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Month</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">June</div>
              <div className="text-xs text-gray-600">168 harvests</div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:grid-cols-4">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Harvest Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Harvest Trends</CardTitle>
                  <CardDescription>Track your harvest quantities over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="total" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Fruit Type Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Fruit Type Trends</CardTitle>
                  <CardDescription>Compare different fruit types over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="apples" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="berries" stroke="#8b5cf6" strokeWidth={2} />
                      <Line type="monotone" dataKey="oranges" stroke="#f97316" strokeWidth={2} />
                      <Line type="monotone" dataKey="pears" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Yearly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Year-over-Year Comparison</CardTitle>
                <CardDescription>Compare total harvests across years</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yearlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fruit Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Fruit Distribution</CardTitle>
                  <CardDescription>Breakdown of harvests by fruit type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={fruitDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                      >
                        {fruitDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribution Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Breakdown</CardTitle>
                  <CardDescription>Exact numbers and percentages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fruitDistribution.map((fruit) => (
                      <div key={fruit.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: fruit.color }} />
                          <span className="font-medium">{fruit.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{fruit.value}</div>
                          <div className="text-sm text-gray-500">{fruit.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Location Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Location Performance</CardTitle>
                <CardDescription>Compare harvest success across different garden areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {locationPerformance.map((location) => (
                    <div key={location.location} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{location.location}</h3>
                        <Badge className="bg-green-100 text-green-800">{location.avgQuality}/5 Quality</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Harvests:</span>
                          <div className="font-medium">{location.harvests}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Weight:</span>
                          <div className="font-medium">{location.weight} lbs</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg per Harvest:</span>
                          <div className="font-medium">{(location.weight / location.harvests).toFixed(1)} lbs</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weather Correlation */}
            <Card>
              <CardHeader>
                <CardTitle>Weather Impact</CardTitle>
                <CardDescription>How weather conditions affect your harvests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weatherCorrelation.map((weather) => (
                    <div key={weather.condition} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{weather.condition}</h3>
                        <Badge variant="outline">{weather.quality}/5 Quality</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Harvests:</span>
                          <div className="font-medium">{weather.harvests}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg Weight:</span>
                          <div className="font-medium">{weather.avgWeight} lbs</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Success Rate:</span>
                          <div className="font-medium">{((weather.harvests / 127) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>Data-driven observations about your garden</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Peak Season</span>
                    </div>
                    <p className="text-sm text-green-700">
                      June is your most productive month with 168 harvests. Consider expanding plantings for this
                      period.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <BarChart3 className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-800">Top Performer</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Berry Patch has the highest quality rating (4.5/5) despite lower volume. Great growing conditions
                      there.
                    </p>
                  </div>

                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calendar className="w-4 h-4 text-orange-600 mr-2" />
                      <span className="font-medium text-orange-800">Weather Pattern</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      Sunny days produce 25% more harvest weight on average. Plan harvesting around weather forecasts.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Suggestions to improve your harvest</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">🌱 Expand Berry Production</h4>
                    <p className="text-sm text-gray-600">
                      Your berries have the highest quality rating. Consider adding more berry plants to increase
                      overall yield.
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">📅 Optimize Timing</h4>
                    <p className="text-sm text-gray-600">
                      Focus harvesting efforts in May-June when conditions are optimal for both quantity and quality.
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">🌤️ Weather Tracking</h4>
                    <p className="text-sm text-gray-600">
                      Monitor weather patterns more closely. Sunny conditions consistently produce better results.
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">📍 Location Analysis</h4>
                    <p className="text-sm text-gray-600">
                      Apply Berry Patch growing techniques to other areas to improve overall garden quality.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
