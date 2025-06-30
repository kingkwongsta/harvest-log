"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  Line
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Scale,
  Camera,
  Award,
  Target,
  Activity,
  Leaf,
  Flower,
  Eye
} from "lucide-react"
import type { PlantEvent } from "@/lib/api"

interface DashboardViewProps {
  events: PlantEvent[]
  loading: boolean
  error: string | null
}

interface ChartData {
  name: string
  value: number
  quantity?: number
  events?: number
  photos?: number
  color?: string
}

interface TimeSeriesData {
  date: string
  quantity: number
  events: number
  cumulative: number
}

interface EventTypeData {
  date: string
  harvest: number
  bloom: number
  snapshot: number
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
  '#d084d0', '#87d068', '#ffb347', '#ff6b6b', '#4ecdc4'
]


const getMonthYear = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  })
}

const generateTimeSeriesData = (events: PlantEvent[]): TimeSeriesData[] => {
  const monthlyData: Record<string, { quantity: number; events: number }> = {}
  
  events.forEach(event => {
    const monthYear = getMonthYear(event.event_date)
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { quantity: 0, events: 0 }
    }
    monthlyData[monthYear].quantity += event.quantity || 0
    monthlyData[monthYear].events += 1
  })

  let cumulative = 0
  return Object.entries(monthlyData)
    .sort(([a], [b]) => new Date(a + ' 1').getTime() - new Date(b + ' 1').getTime())
    .map(([date, data]) => {
      cumulative += data.quantity
      return {
        date,
        quantity: data.quantity,
        events: data.events,
        cumulative
      }
    })
}

const generateEventTypeData = (events: PlantEvent[]): EventTypeData[] => {
  const monthlyData: Record<string, { harvest: number; bloom: number; snapshot: number }> = {}
  
  events.forEach(event => {
    const monthYear = getMonthYear(event.event_date)
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { harvest: 0, bloom: 0, snapshot: 0 }
    }
    monthlyData[monthYear][event.event_type] += 1
  })

  return Object.entries(monthlyData)
    .sort(([a], [b]) => new Date(a + ' 1').getTime() - new Date(b + ' 1').getTime())
    .map(([date, data]) => ({
      date,
      harvest: data.harvest,
      bloom: data.bloom,
      snapshot: data.snapshot
    }))
}

export function DashboardView({ events, loading, error }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Data to Visualize</h3>
        <p className="text-organic">Add some plant events to see charts and analytics</p>
      </div>
    )
  }

  // Aggregate data for different visualizations
  const cropData: ChartData[] = []
  const cropStats: Record<string, { quantity: number; events: number; photos: number }> = {}
  
  events.forEach(event => {
    const crop = event.plant?.variety?.name || event.produce || 'Unknown Plant'
    if (!cropStats[crop]) {
      cropStats[crop] = { quantity: 0, events: 0, photos: 0 }
    }
    cropStats[crop].quantity += event.quantity || 0
    cropStats[crop].events += 1
    cropStats[crop].photos += event.images?.length || 0
  })

  Object.entries(cropStats).forEach(([crop, stats], index) => {
    cropData.push({
      name: crop,
      value: stats.quantity,
      quantity: stats.quantity,
      events: stats.events,
      photos: stats.photos,
      color: COLORS[index % COLORS.length]
    })
  })

  cropData.sort((a, b) => b.value - a.value)

  // Time series data
  const timeSeriesData = generateTimeSeriesData(events)
  const eventTypeData = generateEventTypeData(events)

  // Calculate key metrics
  const totalEvents = events.length
  const totalQuantity = events.reduce((sum, e) => sum + (e.quantity || 0), 0)
  const totalPhotos = events.reduce((sum, e) => sum + (e.images?.length || 0), 0)
  const uniqueCrops = Object.keys(cropStats).length

  // Event type breakdown
  const eventCounts = {
    harvest: events.filter(e => e.event_type === 'harvest').length,
    bloom: events.filter(e => e.event_type === 'bloom').length,
    snapshot: events.filter(e => e.event_type === 'snapshot').length
  }

  // Find best and most active plants
  const bestCrop = cropData[0]
  const mostPhotographed = cropData.reduce((max, crop) => 
    (crop.photos || 0) > (max.photos || 0) ? crop : max
  )

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentEvents = events.filter(e => 
    new Date(e.event_date) >= thirtyDaysAgo
  )

  // Seasonal analysis (only for harvest events)
  const seasonalData = [
    { name: 'Spring', value: 0, color: '#8dd1e1' },
    { name: 'Summer', value: 0, color: '#ffc658' },
    { name: 'Autumn', value: 0, color: '#ff7300' },
    { name: 'Winter', value: 0, color: '#8884d8' }
  ]

  events.filter(e => e.event_type === 'harvest').forEach(event => {
    const month = new Date(event.event_date).getMonth()
    if (month >= 2 && month <= 4) seasonalData[0].value += event.quantity || 0
    else if (month >= 5 && month <= 7) seasonalData[1].value += event.quantity || 0
    else if (month >= 8 && month <= 10) seasonalData[2].value += event.quantity || 0
    else seasonalData[3].value += event.quantity || 0
  })

  // Event type pie chart data
  const eventTypeChartData = [
    { name: 'Harvest', value: eventCounts.harvest, color: '#82ca9d' },
    { name: 'Bloom', value: eventCounts.bloom, color: '#ffc658' },
    { name: 'Snapshot', value: eventCounts.snapshot, color: '#8884d8' }
  ].filter(item => item.value > 0)

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ name: string; value: number; color: string }>; 
    label?: string 
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: { name: string; value: number; color: string }, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-organic">Total Events</p>
                <p className="text-2xl font-bold">{totalEvents}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-organic">Total Quantity</p>
                <p className="text-2xl font-bold">{Math.round(totalQuantity)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-organic">Plant Varieties</p>
                <p className="text-2xl font-bold">{uniqueCrops}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-organic">Photos Taken</p>
                <p className="text-2xl font-bold">{totalPhotos}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xl font-semibold capitalize">{bestCrop.name}</p>
              <p className="text-sm text-organic">
                {bestCrop.quantity} harvested • {bestCrop.events} events
              </p>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Most Photographed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xl font-semibold capitalize">{mostPhotographed.name}</p>
              <p className="text-sm text-organic">
                {mostPhotographed.photos} photos • {mostPhotographed.events} events
              </p>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(mostPhotographed.photos! / totalPhotos) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xl font-semibold">{recentEvents.length}</p>
              <p className="text-sm text-organic">
                Events in last 30 days
              </p>
              <div className="flex items-center gap-2">
                {recentEvents.length > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm text-organic">
                  {recentEvents.length > 0 ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="plants">Plants</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={eventTypeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventTypeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plant Harvest Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cropData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Events Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={eventTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="harvest" 
                    stackId="1" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    name="Harvest Events"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bloom" 
                    stackId="1" 
                    stroke="#ffc658" 
                    fill="#ffc658" 
                    name="Bloom Events"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="snapshot" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Snapshot Events"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plant Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cropData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="quantity" fill="#8884d8" name="Total Harvested" />
                  <Bar yAxisId="right" dataKey="events" fill="#82ca9d" name="Number of Events" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="quantity" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Monthly Harvest Quantity"
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="events" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={{ fill: '#82ca9d' }}
                    name="Monthly Events"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={seasonalData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {seasonalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={seasonalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}