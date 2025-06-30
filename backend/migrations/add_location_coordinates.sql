-- Migration: Add location and coordinate fields to plant_events table
-- This adds support for storing location data and GPS coordinates for plant events

-- Add location and coordinate columns to plant_events table
ALTER TABLE plant_events 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS weather JSONB;

-- Add indexes for coordinate queries (for location-based searches)
CREATE INDEX IF NOT EXISTS idx_plant_events_coordinates ON plant_events(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add index for location text searches
CREATE INDEX IF NOT EXISTS idx_plant_events_location ON plant_events(location) WHERE location IS NOT NULL;

-- Add constraint to ensure coordinates are valid if provided
ALTER TABLE plant_events 
ADD CONSTRAINT check_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
ADD CONSTRAINT check_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Add constraint to ensure both coordinates are provided together (can't have one without the other)
ALTER TABLE plant_events 
ADD CONSTRAINT check_coordinates_together CHECK (
    (latitude IS NULL AND longitude IS NULL) OR 
    (latitude IS NOT NULL AND longitude IS NOT NULL)
);

-- Update comments
COMMENT ON COLUMN plant_events.location IS 'Text description of event location (e.g., "Garden bed 3", "Greenhouse")';
COMMENT ON COLUMN plant_events.latitude IS 'GPS latitude coordinate for weather data (-90 to 90)';
COMMENT ON COLUMN plant_events.longitude IS 'GPS longitude coordinate for weather data (-180 to 180)';
COMMENT ON COLUMN plant_events.weather IS 'Weather data at time of event (temperature, humidity, conditions, etc.)';

-- Update views to include location information
DROP VIEW IF EXISTS plant_timeline;
CREATE OR REPLACE VIEW plant_timeline AS
SELECT 
    p.id as plant_id,
    p.name as plant_name,
    pv.name as variety_name,
    pv.category as plant_category,
    pe.id as event_id,
    pe.event_type,
    pe.event_date,
    pe.description,
    pe.notes,
    pe.location,
    pe.latitude,
    pe.longitude,
    pe.weather,
    pe.produce,
    pe.quantity,
    pe.unit,
    pe.flower_type,
    pe.bloom_stage,
    pe.metrics,
    pe.created_at
FROM plants p
LEFT JOIN plant_varieties pv ON p.variety_id = pv.id
LEFT JOIN plant_events pe ON p.id = pe.plant_id
ORDER BY pe.event_date DESC;

-- Grant permissions for updated view
GRANT SELECT ON plant_timeline TO authenticated;