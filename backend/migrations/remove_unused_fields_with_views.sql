-- Migration: Remove unused fields from plant_events and plant_varieties tables
-- Created: 2024-01-XX
-- Description: Remove fields that are not used in the application to simplify the schema
-- Note: This migration handles dependent views by dropping and recreating them

-- Log this migration
INSERT INTO migration_log (migration_name, status, notes) 
VALUES ('remove_unused_fields_with_views', 'started', 'Removing unused fields from plant_events and plant_varieties tables and updating dependent views');

-- ==============================================
-- STEP 1: Drop dependent views
-- ==============================================

-- Drop views that depend on columns we're removing
DROP VIEW IF EXISTS plant_timeline;
DROP VIEW IF EXISTS harvest_summary;
DROP VIEW IF EXISTS plant_health_timeline;

-- ==============================================
-- STEP 2: Remove unused columns
-- ==============================================

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

-- ==============================================
-- STEP 3: Recreate views with remaining columns
-- ==============================================

-- Recreate plant_timeline view (simplified without removed fields)
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
    pe.location,
    pe.latitude,
    pe.longitude,
    pe.weather,
    pe.plant_variety,
    pe.quantity,
    pe.created_at,
    pe.updated_at
FROM plants p
LEFT JOIN plant_varieties pv ON p.variety_id = pv.id
LEFT JOIN plant_events pe ON p.id = pe.plant_id
ORDER BY pe.event_date DESC;

-- Recreate harvest_summary view (simplified without removed fields)
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
    AVG(pe.quantity) as avg_quantity
FROM plants p
LEFT JOIN plant_varieties pv ON p.variety_id = pv.id
LEFT JOIN plant_events pe ON p.id = pe.plant_id AND pe.event_type = 'harvest'
WHERE pe.id IS NOT NULL
GROUP BY p.id, p.name, pv.name, pv.category
ORDER BY total_quantity DESC;

-- Recreate plant_health_timeline view (now using description instead of metrics)
CREATE OR REPLACE VIEW plant_health_timeline AS
SELECT 
    p.id as plant_id,
    p.name as plant_name,
    pe.event_date,
    pe.description,
    pe.location,
    pe.weather,
    pe.created_at
FROM plants p
LEFT JOIN plant_events pe ON p.id = pe.plant_id AND pe.event_type = 'snapshot'
WHERE pe.id IS NOT NULL
ORDER BY p.id, pe.event_date DESC;

-- ==============================================
-- STEP 4: Grant permissions
-- ==============================================

-- Grant permissions for recreated views
GRANT SELECT ON plant_timeline TO authenticated;
GRANT SELECT ON harvest_summary TO authenticated;
GRANT SELECT ON plant_health_timeline TO authenticated;

-- ==============================================
-- STEP 5: Update migration log
-- ==============================================

-- Update migration log
UPDATE migration_log 
SET status = 'completed', 
    execution_date = NOW(),
    notes = 'Successfully removed unused fields: plant_events (produce, unit, flower_type, bloom_stage, notes, metrics), plant_varieties (growing_season, harvest_time_days, typical_yield, care_instructions). Updated dependent views: plant_timeline, harvest_summary, plant_health_timeline.'
WHERE migration_name = 'remove_unused_fields_with_views' AND status = 'started'; 