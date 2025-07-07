-- Update harvest events to use plant_variety instead of produce
-- This migration changes harvest events to use the plant_variety field consistently
-- across all event types instead of the produce field

-- Start transaction for safety
BEGIN;

-- ============================================
-- HARVEST EVENTS CHANGES
-- ============================================

-- Update harvest constraint to use plant_variety instead of produce
ALTER TABLE plant_events 
DROP CONSTRAINT IF EXISTS harvest_fields_check;

ALTER TABLE plant_events 
ADD CONSTRAINT harvest_fields_check CHECK (
    CASE 
        WHEN event_type = 'harvest' THEN (plant_variety IS NOT NULL AND quantity IS NOT NULL)
        ELSE TRUE
    END
);

-- Migrate existing harvest data from produce to plant_variety
UPDATE plant_events 
SET plant_variety = produce 
WHERE event_type = 'harvest' AND produce IS NOT NULL AND plant_variety IS NULL;

-- ============================================
-- UPDATE DATABASE VIEWS
-- ============================================

-- Update harvest_summary view to use plant_variety instead of produce
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

-- Add index for plant_variety column for harvest events
CREATE INDEX IF NOT EXISTS idx_plant_events_plant_variety_harvest ON plant_events(plant_variety) 
WHERE event_type = 'harvest';

-- ============================================
-- COMMIT CHANGES
-- ============================================

COMMIT;

-- ============================================
-- POST-MIGRATION NOTES
-- ============================================

-- After running this migration:
-- 1. All harvest events will use plant_variety field instead of produce
-- 2. The produce field is still available but not required for harvest events
-- 3. Both harvest and bloom events now consistently use plant_variety
-- 4. Existing harvest data has been migrated to plant_variety field

COMMENT ON COLUMN plant_events.plant_variety IS 'Plant variety name for harvest and bloom events (replaces produce for harvests, flower_type for blooms)';

-- Migration completed successfully!
SELECT 'Migration completed! Harvest events now use plant_variety field consistently.' as status; 