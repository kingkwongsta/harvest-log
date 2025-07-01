-- Add weather data column to plant_events table
-- This column will store JSONB data from the Open-Meteo API, giving us flexibility to add more weather metrics in the future without further schema changes.

ALTER TABLE public.plant_events
ADD COLUMN weather JSONB NULL;

COMMENT ON COLUMN public.plant_events.weather IS 'Stores weather data as a JSON object, e.g., { "temperature": 25.5, "humidity": 60, "weather_code": 3, "wind_speed": 15.2 }';
