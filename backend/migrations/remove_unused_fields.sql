-- Migration: Remove unused fields from plant_events and plant_varieties tables
-- Created: 2024-01-XX
-- Description: Remove fields that are not used in the application to simplify the schema

-- Log this migration
INSERT INTO migration_log (migration_name, status, notes) 
VALUES ('remove_unused_fields', 'started', 'Removing unused fields from plant_events and plant_varieties tables');

-- Remove unused fields from plant_events table
ALTER TABLE plant_events 
DROP COLUMN IF EXISTS produce,
DROP COLUMN IF EXISTS unit,
DROP COLUMN IF EXISTS flower_type,
DROP COLUMN IF EXISTS bloom_stage,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS metrics;

-- Remove unused fields from plant_varieties table
ALTER TABLE plant_varieties 
DROP COLUMN IF EXISTS growing_season,
DROP COLUMN IF EXISTS harvest_time_days,
DROP COLUMN IF EXISTS typical_yield,
DROP COLUMN IF EXISTS care_instructions;

-- Update migration log
UPDATE migration_log 
SET status = 'completed', 
    execution_date = NOW(),
    notes = 'Successfully removed unused fields: plant_events (produce, unit, flower_type, bloom_stage, notes, metrics), plant_varieties (growing_season, harvest_time_days, typical_yield, care_instructions)'
WHERE migration_name = 'remove_unused_fields' AND status = 'started'; 