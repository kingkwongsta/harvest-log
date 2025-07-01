-- Migration: Add quality column and remove unit column from plant_events
-- This migration updates the plant_events table to support the new harvest form structure

-- Start transaction for safety
BEGIN;

-- Add quality column to plant_events table
ALTER TABLE plant_events 
ADD COLUMN IF NOT EXISTS quality VARCHAR(50);

-- Update the harvest constraint to include quality and remove unit requirement
ALTER TABLE plant_events 
DROP CONSTRAINT IF EXISTS harvest_fields_check;

-- Add new constraint that requires quality for harvest events (but not unit)
ALTER TABLE plant_events 
ADD CONSTRAINT harvest_fields_check CHECK (
    CASE 
        WHEN event_type = 'harvest' THEN (produce IS NOT NULL AND quantity IS NOT NULL AND quality IS NOT NULL)
        ELSE TRUE
    END
);

-- Optionally, set a default quality for existing harvest events that don't have one
-- This prevents constraint violations for existing data
UPDATE plant_events 
SET quality = 'Good' 
WHERE event_type = 'harvest' AND quality IS NULL;

-- Remove unit column (commented out for safety - uncomment after data backup)
-- WARNING: This will permanently delete the unit data
-- ALTER TABLE plant_events DROP COLUMN IF EXISTS unit;

-- Create index on quality column for better query performance
CREATE INDEX IF NOT EXISTS idx_plant_events_quality ON plant_events(quality) 
WHERE event_type = 'harvest';

-- Update the harvest_summary view to remove unit grouping
DROP VIEW IF EXISTS harvest_summary;

CREATE OR REPLACE VIEW harvest_summary AS
SELECT 
    p.id as plant_id,
    p.name as plant_name,
    pv.name as variety_name,
    pv.category as plant_category,
    COUNT(pe.id) as total_harvests,
    SUM(pe.quantity) as total_quantity,
    MIN(pe.event_date) as first_harvest,
    MAX(pe.event_date) as last_harvest,
    AVG(pe.quantity) as avg_quantity,
    -- Add quality breakdown
    COUNT(CASE WHEN pe.quality = 'Excellent' THEN 1 END) as excellent_count,
    COUNT(CASE WHEN pe.quality = 'Good' THEN 1 END) as good_count,
    COUNT(CASE WHEN pe.quality = 'Fair' THEN 1 END) as fair_count,
    COUNT(CASE WHEN pe.quality = 'Poor' THEN 1 END) as poor_count
FROM plants p
LEFT JOIN plant_varieties pv ON p.variety_id = pv.id
LEFT JOIN plant_events pe ON p.id = pe.plant_id AND pe.event_type = 'harvest'
WHERE pe.id IS NOT NULL
GROUP BY p.id, p.name, pv.name, pv.category
ORDER BY total_quantity DESC;

-- Grant permissions for updated view
GRANT SELECT ON harvest_summary TO authenticated;

-- Update plant_timeline view to include quality
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
    pe.produce,
    pe.quantity,
    pe.quality,
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

-- Commit transaction
COMMIT;

-- Instructions for completing the migration:
-- 1. Run this script in your Supabase SQL editor
-- 2. Verify that quality data has been added correctly
-- 3. Test the application with the new form structure
-- 4. Once everything is working, uncomment and run the unit column removal:
--    ALTER TABLE plant_events DROP COLUMN IF EXISTS unit;
-- 5. Update any application code that still references the unit field

COMMENT ON COLUMN plant_events.quality IS 'Quality rating of the harvest (Excellent, Good, Fair, Poor, or custom value)';