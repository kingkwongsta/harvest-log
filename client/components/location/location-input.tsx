"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2, AlertCircle, Search } from "lucide-react"
import { weatherApi, type Coordinates, type WeatherData, type GeocodingResult } from "@/lib/api"

interface LocationInputProps {
  location: string
  onLocationChange: (location: string) => void
  coordinates: Coordinates | null
  onCoordinatesChange: (coordinates: Coordinates | null) => void
  onWeatherData?: (weather: WeatherData) => void
  eventDate?: string
  disabled?: boolean
  className?: string
  label?: string
  placeholder?: string
  defaultLocation?: string
}

export function LocationInput({
  location,
  onLocationChange,
  coordinates,
  onCoordinatesChange,
  onWeatherData,
  eventDate,
  disabled = false,
  className = "",
  label = "Location",
  placeholder = "Enter city, zip code, or address...",
  defaultLocation = "Torrance, CA"
}: LocationInputProps) {
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isGettingGPS, setIsGettingGPS] = useState(false)
  const [isGettingWeather, setIsGettingWeather] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Initialize with default location if empty
  useEffect(() => {
    if (!location && defaultLocation) {
      onLocationChange(defaultLocation)
    }
  }, [location, defaultLocation, onLocationChange])

  const fetchWeatherData = useCallback(async (coords: Coordinates) => {
    if (!onWeatherData) return

    setIsGettingWeather(true)
    setError(null)

    try {
      const response = await weatherApi.getCurrentWeather(coords, eventDate)
      
      if (response.success && response.data) {
        onWeatherData(response.data)
      } else {
        setError("Weather data temporarily unavailable. Location will still be saved.")
      }
    } catch (err) {
      let errorMessage = "Weather data unavailable"
      
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = "Network error. Weather data unavailable but location will still be saved."
        } else if (err.message.includes('timeout')) {
          errorMessage = "Weather request timed out. Location will still be saved."
        } else {
          errorMessage = `Weather: ${err.message}. Location will still be saved.`
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsGettingWeather(false)
    }
  }, [onWeatherData, eventDate])

  const handleGeocode = useCallback(async (locationText: string, showLoading: boolean = true) => {
    if (!locationText.trim()) return

    if (showLoading) setIsGeocoding(true)
    setError(null)

    try {
      const response = await weatherApi.geocodeLocation(locationText.trim())
      
      if (response.success && response.data) {
        const result = response.data
        setGeocodingResult(result)
        onCoordinatesChange(result.coordinates)
        
        // Auto-fetch weather data if callback provided
        if (onWeatherData) {
          await fetchWeatherData(result.coordinates)
        }
      } else {
        setError(`No results found for "${locationText}". Try a different format like "City, State" or zip code.`)
        setGeocodingResult(null)
        onCoordinatesChange(null)
      }
    } catch (err) {
      let errorMessage = "Failed to geocode location"
      
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (err.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again."
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      setGeocodingResult(null)
      onCoordinatesChange(null)
      setRetryCount(prev => prev + 1)
    } finally {
      if (showLoading) setIsGeocoding(false)
    }
  }, [onCoordinatesChange, onWeatherData, fetchWeatherData])

  // Auto-geocode when location changes (with debounce)
  useEffect(() => {
    if (!location || location.length < 3) {
      // Clear geocoding results if location is too short
      if (location.length > 0 && location.length < 3) {
        setGeocodingResult(null)
        onCoordinatesChange(null)
        setError(null)
      }
      return
    }

    const timeoutId = setTimeout(async () => {
      await handleGeocode(location, false) // false = don't show loading state for auto-geocoding
    }, 1000) // 1 second debounce

    return () => clearTimeout(timeoutId)
  }, [location, handleGeocode, onCoordinatesChange])

  const getCurrentLocation = async () => {
    setIsGettingGPS(true)
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
      
      // Format location display with accuracy info
      const accuracy = position.coords.accuracy
      const locationText = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`
      onLocationChange(locationText)
      setGeocodingResult({
        city: "GPS Location",
        country: "Current Position",
        coordinates: newCoordinates,
        display_name: locationText
      })

      // Auto-fetch weather data if callback provided
      if (onWeatherData) {
        await fetchWeatherData(newCoordinates)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get location"
      setError(errorMessage)
    } finally {
      setIsGettingGPS(false)
    }
  }


  const clearLocation = () => {
    onLocationChange("")
    onCoordinatesChange(null)
    setGeocodingResult(null)
    setError(null)
    setRetryCount(0)
  }

  const loadDefaultLocation = async () => {
    setIsGeocoding(true)
    setError(null)

    try {
      const response = await weatherApi.getDefaultLocation()
      
      if (response.success && response.data) {
        const result = response.data
        onLocationChange(defaultLocation)
        setGeocodingResult(result)
        onCoordinatesChange(result.coordinates)
        
        // Auto-fetch weather data if callback provided
        if (onWeatherData) {
          await fetchWeatherData(result.coordinates)
        }
      } else {
        setError("Failed to load default location")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load default location"
      setError(errorMessage)
    } finally {
      setIsGeocoding(false)
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="location">{label}</Label>
        <div className="flex gap-2">
          <Input
            id="location"
            placeholder={placeholder}
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            disabled={disabled || isGeocoding || isGettingGPS}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleGeocode(location, true)}
            disabled={disabled || isGeocoding || isGettingGPS || isGettingWeather || !location}
            className="shrink-0"
          >
            {isGeocoding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="ml-1 hidden sm:inline">
              {isGeocoding ? "Searching..." : "Search"}
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={disabled || isGeocoding || isGettingGPS || isGettingWeather}
            className="shrink-0"
          >
            {isGettingGPS ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span className="ml-1 hidden sm:inline">
              {isGettingGPS ? "Getting..." : "GPS"}
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
      {coordinates && geocodingResult && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <MapPin className="w-4 h-4" />
          <span>
            📍 {geocodingResult.city}
            {geocodingResult.state && `, ${geocodingResult.state}`}
            {geocodingResult.country && ` (${geocodingResult.country})`}
          </span>
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

      {/* Default location helper */}
      {!location && defaultLocation && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={loadDefaultLocation}
            disabled={disabled || isGeocoding}
            className="h-auto p-0"
          >
            Use default location ({defaultLocation})
          </Button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center justify-between gap-2 text-sm text-red-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          {retryCount > 0 && location && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => handleGeocode(location, true)}
              disabled={disabled || isGeocoding}
              className="h-auto p-0 text-blue-600 hover:text-blue-800"
            >
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 