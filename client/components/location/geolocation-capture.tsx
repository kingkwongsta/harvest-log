"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Loader2, AlertCircle } from "lucide-react"
import { weatherApi, type Coordinates, type WeatherData } from "@/lib/api"

interface GeolocationCaptureProps {
  location: string
  onLocationChange: (location: string) => void
  coordinates: Coordinates | null
  onCoordinatesChange: (coordinates: Coordinates | null) => void
  onWeatherData?: (weather: WeatherData) => void
  eventDate?: string
  disabled?: boolean
  className?: string
}

export function GeolocationCapture({
  location,
  onLocationChange,
  coordinates,
  onCoordinatesChange,
  onWeatherData,
  eventDate,
  disabled = false,
  className = ""
}: GeolocationCaptureProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isGettingWeather, setIsGettingWeather] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationGranted, setLocationGranted] = useState(false)

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    setError(null)

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser")
      }

      // Request location with high accuracy
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error("Location access denied. Please allow location access and try again."))
                break
              case error.POSITION_UNAVAILABLE:
                reject(new Error("Location information unavailable"))
                break
              case error.TIMEOUT:
                reject(new Error("Location request timed out. Please try again."))
                break
              default:
                reject(new Error("An unknown error occurred while getting location"))
                break
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // Cache for 1 minute
          }
        )
      })

      const { latitude, longitude } = position.coords
      const newCoordinates = { latitude, longitude }
      
      // Update coordinates
      onCoordinatesChange(newCoordinates)
      setLocationGranted(true)
      
      // Format location display with accuracy info
      const accuracy = position.coords.accuracy
      const locationText = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`
      onLocationChange(locationText)

      // Auto-fetch weather data if callback provided
      if (onWeatherData) {
        await fetchWeatherData(newCoordinates)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get location"
      setError(errorMessage)
      console.error("Geolocation error:", err)
    } finally {
      setIsGettingLocation(false)
    }
  }

  const fetchWeatherData = async (coords: Coordinates) => {
    if (!onWeatherData) return

    setIsGettingWeather(true)
    setError(null)

    try {
      const response = await weatherApi.getCurrentWeather(coords, eventDate)
      
      if (response.success && response.data) {
        onWeatherData(response.data)
      } else {
        setError("Failed to fetch weather data")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch weather data"
      setError(`Weather: ${errorMessage}`)
      console.error("Weather fetch error:", err)
    } finally {
      setIsGettingWeather(false)
    }
  }

  const clearLocation = () => {
    onLocationChange("")
    onCoordinatesChange(null)
    setLocationGranted(false)
    setError(null)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <div className="flex gap-2">
          <Input
            id="location"
            placeholder="Enter location manually or use GPS..."
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={disabled || isGettingLocation || isGettingWeather}
            className="shrink-0"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span className="ml-1 hidden sm:inline">
              {isGettingLocation ? "Getting..." : "GPS"}
            </span>
          </Button>
          {coordinates && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearLocation}
              disabled={disabled}
              className="shrink-0"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Status indicators */}
      {coordinates && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <MapPin className="w-4 h-4" />
          <span>GPS location captured</span>
          {onWeatherData && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => fetchWeatherData(coordinates)}
              disabled={disabled || isGettingWeather}
              className="h-auto p-0 text-blue-600 hover:text-blue-800"
            >
              {isGettingWeather ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Getting weather...
                </>
              ) : (
                "Get weather"
              )}
            </Button>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Location permissions help */}
      {!locationGranted && !coordinates && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Tip:</strong> GPS location enables automatic weather data</p>
          <p>🔒 Your location is only used temporarily to fetch weather conditions</p>
        </div>
      )}
    </div>
  )
}