-- Fix missing coordinate columns in plant_events table
-- This script safely adds the missing latitude and longitude columns

-- Add location and coordinate columns if they don't exist
DO $$ 
BEGIN
    -- Add latitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'plant_events' AND column_name = 'latitude') THEN
        ALTER TABLE plant_events ADD COLUMN latitude DOUBLE PRECISION;
        RAISE NOTICE 'Added latitude column to plant_events table';
    ELSE
        RAISE NOTICE 'latitude column already exists in plant_events table';
    END IF;

    -- Add longitude column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'plant_events' AND column_name = 'longitude') THEN
        ALTER TABLE plant_events ADD COLUMN longitude DOUBLE PRECISION;
        RAISE NOTICE 'Added longitude column to plant_events table';
    ELSE
        RAISE NOTICE 'longitude column already exists in plant_events table';
    END IF;

    -- Add location text column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'plant_events' AND column_name = 'location') THEN
        ALTER TABLE plant_events ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column to plant_events table';
    ELSE
        RAISE NOTICE 'location column already exists in plant_events table';
    END IF;

    -- Add weather JSONB column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'plant_events' AND column_name = 'weather') THEN
        ALTER TABLE plant_events ADD COLUMN weather JSONB;
        RAISE NOTICE 'Added weather column to plant_events table';
    ELSE
        RAISE NOTICE 'weather column already exists in plant_events table';
    END IF;
END $$;

-- Add indexes for coordinate queries (only if columns exist and indexes don't exist)
DO $$
BEGIN
    -- Add coordinate index if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'plant_events' AND indexname = 'idx_plant_events_coordinates') THEN
        CREATE INDEX idx_plant_events_coordinates ON plant_events(latitude, longitude) 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
        RAISE NOTICE 'Created coordinate index on plant_events table';
    ELSE
        RAISE NOTICE 'Coordinate index already exists on plant_events table';
    END IF;

    -- Add location text index if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'plant_events' AND indexname = 'idx_plant_events_location') THEN
        CREATE INDEX idx_plant_events_location ON plant_events(location) 
        WHERE location IS NOT NULL;
        RAISE NOTICE 'Created location index on plant_events table';
    ELSE
        RAISE NOTICE 'Location index already exists on plant_events table';
    END IF;
END $$;

-- Add constraints for coordinate validation
DO $$
BEGIN
    -- Add latitude range constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'plant_events' AND constraint_name = 'check_latitude_range') THEN
        ALTER TABLE plant_events 
        ADD CONSTRAINT check_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
        RAISE NOTICE 'Added latitude range constraint to plant_events table';
    ELSE
        RAISE NOTICE 'Latitude range constraint already exists on plant_events table';
    END IF;

    -- Add longitude range constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'plant_events' AND constraint_name = 'check_longitude_range') THEN
        ALTER TABLE plant_events 
        ADD CONSTRAINT check_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
        RAISE NOTICE 'Added longitude range constraint to plant_events table';
    ELSE
        RAISE NOTICE 'Longitude range constraint already exists on plant_events table';
    END IF;

    -- Add coordinates together constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'plant_events' AND constraint_name = 'check_coordinates_together') THEN
        ALTER TABLE plant_events 
        ADD CONSTRAINT check_coordinates_together CHECK (
            (latitude IS NULL AND longitude IS NULL) OR 
            (latitude IS NOT NULL AND longitude IS NOT NULL)
        );
        RAISE NOTICE 'Added coordinates together constraint to plant_events table';
    ELSE
        RAISE NOTICE 'Coordinates together constraint already exists on plant_events table';
    END IF;
END $$;

-- Add column comments
COMMENT ON COLUMN plant_events.location IS 'Text description of event location (e.g., "Garden bed 3", "Greenhouse")';
COMMENT ON COLUMN plant_events.latitude IS 'GPS latitude coordinate for weather data (-90 to 90)';
COMMENT ON COLUMN plant_events.longitude IS 'GPS longitude coordinate for weather data (-180 to 180)';
COMMENT ON COLUMN plant_events.weather IS 'Weather data at time of event (temperature, humidity, conditions, etc.)';

-- Verify the schema changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'plant_events' 
  AND column_name IN ('latitude', 'longitude', 'location', 'weather')
ORDER BY column_name; 