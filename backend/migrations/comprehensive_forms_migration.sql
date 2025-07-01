-- Comprehensive Migration: Simplify all event forms
-- This migration updates the plant_events table to support simplified form structures:
-- - Harvest: Keep only produce + quantity (remove unit and quality)
-- - Bloom: Replace flower_type + bloom_stage with plant_variety  
-- - Snapshot: Keep only basic fields + photos (metrics become optional)

-- Start transaction for safety
BEGIN;

-- ============================================
-- HARVEST EVENTS CHANGES
-- ============================================

-- Remove quality column if it exists (we added it earlier but now removing it)
ALTER TABLE plant_events 
DROP COLUMN IF EXISTS quality;

-- Remove unit column (backup data first if needed)
-- Uncomment the next line after backing up data:
-- ALTER TABLE plant_events DROP COLUMN IF EXISTS unit;

-- Update harvest constraint to only require produce and quantity
ALTER TABLE plant_events 
DROP CONSTRAINT IF EXISTS harvest_fields_check;

ALTER TABLE plant_events 
ADD CONSTRAINT harvest_fields_check CHECK (
    CASE 
        WHEN event_type = 'harvest' THEN (produce IS NOT NULL AND quantity IS NOT NULL)
        ELSE TRUE
    END
);

-- ============================================
-- BLOOM EVENTS CHANGES  
-- ============================================

-- Add plant_variety column for bloom events
ALTER TABLE plant_events 
ADD COLUMN IF NOT EXISTS plant_variety VARCHAR(100);

-- Migrate existing flower_type data to plant_variety (if you want to preserve it)
UPDATE plant_events 
SET plant_variety = flower_type 
WHERE event_type = 'bloom' AND flower_type IS NOT NULL AND plant_variety IS NULL;

-- Remove old bloom fields (backup data first if needed)
-- Uncomment the next lines after backing up data:
-- ALTER TABLE plant_events DROP COLUMN IF EXISTS flower_type;
-- ALTER TABLE plant_events DROP COLUMN IF EXISTS bloom_stage;

-- Update bloom constraint to require plant_variety
ALTER TABLE plant_events 
DROP CONSTRAINT IF EXISTS bloom_fields_check;

ALTER TABLE plant_events 
ADD CONSTRAINT bloom_fields_check CHECK (
    CASE 
        WHEN event_type = 'bloom' THEN (plant_variety IS NOT NULL)
        ELSE TRUE
    END
);

-- ============================================
-- SNAPSHOT EVENTS CHANGES
-- ============================================

-- For snapshot events, we keep the metrics column but make it optional
-- No constraint changes needed as snapshots are already flexible

-- ============================================
-- UPDATE DATABASE VIEWS
-- ============================================

-- Update plant_timeline view to include new fields
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
    pe.plant_variety,
    pe.metrics,
    pe.created_at
FROM plants p
LEFT JOIN plant_varieties pv ON p.variety_id = pv.id
LEFT JOIN plant_events pe ON p.id = pe.plant_id
ORDER BY pe.event_date DESC;

-- Grant permissions for updated view
GRANT SELECT ON plant_timeline TO authenticated;

-- Update harvest_summary view to remove unit references
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
    AVG(pe.quantity) as avg_quantity
FROM plants p
LEFT JOIN plant_varieties pv ON p.variety_id = pv.id
LEFT JOIN plant_events pe ON p.id = pe.plant_id AND pe.event_type = 'harvest'
WHERE pe.id IS NOT NULL
GROUP BY p.id, p.name, pv.name, pv.category
ORDER BY total_quantity DESC;

-- Grant permissions for updated view
GRANT SELECT ON harvest_summary TO authenticated;

-- ============================================
-- UPDATE INDEXES
-- ============================================

-- Add index for new plant_variety column
CREATE INDEX IF NOT EXISTS idx_plant_events_plant_variety ON plant_events(plant_variety) 
WHERE event_type = 'bloom';

-- Remove old indexes if columns are dropped
-- Uncomment after dropping columns:
-- DROP INDEX IF EXISTS idx_plant_events_flower_type;
-- DROP INDEX IF EXISTS idx_plant_events_bloom_stage;

-- ============================================
-- COMMIT CHANGES
-- ============================================

COMMIT;

-- ============================================
-- POST-MIGRATION NOTES
-- ============================================

-- After running this migration:
-- 1. Test the application with the new form structures
-- 2. Verify data integrity in all event types
-- 3. Once confirmed working, uncomment the DROP COLUMN statements above and run again to fully remove old columns
-- 4. Update any remaining application code that references the old fields

COMMENT ON COLUMN plant_events.plant_variety IS 'Plant variety name for bloom events (replaces flower_type and bloom_stage)';

-- Migration completed successfully!
SELECT 'Migration completed! Harvest, bloom, and snapshot forms have been simplified.' as status;