"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  CloudSnow, 
  Zap, 
  Wind, 
  Droplets, 
  Thermometer,
  Eye
} from "lucide-react"
import type { WeatherData } from "@/lib/api"

interface WeatherDisplayProps {
  weather: WeatherData
  className?: string
  compact?: boolean
}

// WMO Weather interpretation codes to icons and descriptions
const getWeatherInfo = (code: number) => {
  switch (code) {
    case 0: return { icon: Sun, description: "Clear sky", color: "text-yellow-500" }
    case 1: case 2: case 3: return { icon: Cloud, description: "Partly cloudy", color: "text-gray-500" }
    case 45: case 48: return { icon: Eye, description: "Fog", color: "text-gray-400" }
    case 51: case 53: case 55: return { icon: CloudRain, description: "Drizzle", color: "text-blue-400" }
    case 56: case 57: return { icon: CloudSnow, description: "Freezing drizzle", color: "text-blue-300" }
    case 61: case 63: case 65: return { icon: CloudRain, description: "Rain", color: "text-blue-600" }
    case 66: case 67: return { icon: CloudSnow, description: "Freezing rain", color: "text-blue-300" }
    case 71: case 73: case 75: return { icon: CloudSnow, description: "Snow", color: "text-blue-200" }
    case 77: return { icon: CloudSnow, description: "Snow grains", color: "text-blue-200" }
    case 80: case 81: case 82: return { icon: CloudRain, description: "Rain showers", color: "text-blue-600" }
    case 85: case 86: return { icon: CloudSnow, description: "Snow showers", color: "text-blue-200" }
    case 95: return { icon: Zap, description: "Thunderstorm", color: "text-purple-600" }
    case 96: case 99: return { icon: Zap, description: "Thunderstorm with hail", color: "text-purple-700" }
    default: return { icon: Cloud, description: "Unknown", color: "text-gray-500" }
  }
}

const formatTemperature = (temp: number) => {
  return `${Math.round(temp)}°F`
}

export function WeatherDisplay({ weather, className = "", compact = false }: WeatherDisplayProps) {
  const { icon: WeatherIcon, description, color } = getWeatherInfo(weather.weather_code)
  const avgTemp = (weather.temperature_min + weather.temperature_max) / 2

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <WeatherIcon className={`w-4 h-4 ${color}`} />
        <span className="text-muted-foreground">
          {formatTemperature(avgTemp)} • {description}
        </span>
        {weather.precipitation > 0 && (
          <Badge variant="secondary" className="text-xs">
            {weather.precipitation}mm rain
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Weather condition and temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WeatherIcon className={`w-5 h-5 ${color}`} />
              <span className="font-medium">{description}</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {formatTemperature(avgTemp)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTemperature(weather.temperature_min)} - {formatTemperature(weather.temperature_max)}
              </div>
            </div>
          </div>

          {/* Weather details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <div>
                <div className="font-medium">{Math.round(weather.humidity)}%</div>
                <div className="text-muted-foreground">Humidity</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">{Math.round(weather.wind_speed)} km/h</div>
                <div className="text-muted-foreground">Wind</div>
              </div>
            </div>

            {weather.precipitation > 0 && (
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium">{weather.precipitation} mm</div>
                  <div className="text-muted-foreground">Rain</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              <div>
                <div className="font-medium">
                  {formatTemperature(weather.temperature_min)}/{formatTemperature(weather.temperature_max)}
                </div>
                <div className="text-muted-foreground">Min/Max</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}