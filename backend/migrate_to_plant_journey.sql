-- Data Migration Script: Harvest Logs to Plant Journey System
-- This script migrates existing harvest_logs and harvest_images to the new plant journey schema

-- IMPORTANT: Run setup_plant_journey.sql first to create the new schema
-- IMPORTANT: Backup your database before running this migration

BEGIN;

-- Step 1: Create plant varieties from existing harvest data
-- Extract unique crop names and categorize them
WITH crop_categories AS (
    SELECT DISTINCT 
        crop_name,
        CASE 
            -- Vegetables
            WHEN LOWER(crop_name) LIKE '%tomato%' OR LOWER(crop_name) LIKE '%pepper%' 
                OR LOWER(crop_name) LIKE '%cucumber%' OR LOWER(crop_name) LIKE '%zucchini%' 
                OR LOWER(crop_name) LIKE '%squash%' OR LOWER(crop_name) LIKE '%carrot%'
                OR LOWER(crop_name) LIKE '%lettuce%' OR LOWER(crop_name) LIKE '%spinach%'
                OR LOWER(crop_name) LIKE '%kale%' OR LOWER(crop_name) LIKE '%broccoli%'
                OR LOWER(crop_name) LIKE '%cabbage%' OR LOWER(crop_name) LIKE '%onion%'
                OR LOWER(crop_name) LIKE '%garlic%' OR LOWER(crop_name) LIKE '%bean%'
                OR LOWER(crop_name) LIKE '%pea%' OR LOWER(crop_name) LIKE '%corn%' THEN 'vegetable'
            -- Fruits
            WHEN LOWER(crop_name) LIKE '%apple%' OR LOWER(crop_name) LIKE '%orange%' 
                OR LOWER(crop_name) LIKE '%berry%' OR LOWER(crop_name) LIKE '%grape%'
                OR LOWER(crop_name) LIKE '%melon%' OR LOWER(crop_name) LIKE '%peach%'
                OR LOWER(crop_name) LIKE '%pear%' OR LOWER(crop_name) LIKE '%cherry%'
                OR LOWER(crop_name) LIKE '%plum%' OR LOWER(crop_name) LIKE '%strawberry%' THEN 'fruit'
            -- Herbs
            WHEN LOWER(crop_name) LIKE '%basil%' OR LOWER(crop_name) LIKE '%mint%' 
                OR LOWER(crop_name) LIKE '%parsley%' OR LOWER(crop_name) LIKE '%cilantro%'
                OR LOWER(crop_name) LIKE '%thyme%' OR LOWER(crop_name) LIKE '%rosemary%'
                OR LOWER(crop_name) LIKE '%sage%' OR LOWER(crop_name) LIKE '%oregano%' THEN 'herb'
            -- Flowers
            WHEN LOWER(crop_name) LIKE '%flower%' OR LOWER(crop_name) LIKE '%sunflower%'
                OR LOWER(crop_name) LIKE '%marigold%' OR LOWER(crop_name) LIKE '%zinnia%' THEN 'flower'
            -- Default to vegetable for unknown crops
            ELSE 'vegetable'
        END as category,
        -- Estimate harvest time based on crop type
        CASE 
            WHEN LOWER(crop_name) LIKE '%lettuce%' OR LOWER(crop_name) LIKE '%spinach%' THEN 45
            WHEN LOWER(crop_name) LIKE '%carrot%' OR LOWER(crop_name) LIKE '%bean%' THEN 70
            WHEN LOWER(crop_name) LIKE '%tomato%' OR LOWER(crop_name) LIKE '%pepper%' THEN 75
            WHEN LOWER(crop_name) LIKE '%cucumber%' OR LOWER(crop_name) LIKE '%zucchini%' THEN 55
            WHEN LOWER(crop_name) LIKE '%basil%' OR LOWER(crop_name) LIKE '%herbs%' THEN 60
            ELSE 70 -- Default
        END as harvest_time_days
    FROM harvest_logs
)
INSERT INTO plant_varieties (name, category, description, harvest_time_days)
SELECT 
    crop_name,
    category,
    'Migrated from harvest logs - ' || crop_name || ' (' || category || ')',
    harvest_time_days
FROM crop_categories
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    harvest_time_days = EXCLUDED.harvest_time_days;

-- Step 2: Create individual plants from harvest data
-- Group harvest logs by crop and location to create distinct plants
WITH plant_groupings AS (
    SELECT 
        hl.crop_name,
        COALESCE(hl.location, 'Unknown Location') as location,
        MIN(hl.harvest_date) as first_harvest_date,
        COUNT(*) as harvest_count,
        pv.id as variety_id
    FROM harvest_logs hl
    JOIN plant_varieties pv ON pv.name = hl.crop_name
    GROUP BY hl.crop_name, COALESCE(hl.location, 'Unknown Location'), pv.id
)
INSERT INTO plants (name, variety_id, planted_date, location, status, notes)
SELECT 
    pg.crop_name || ' Plant (' || pg.location || ')',
    pg.variety_id,
    -- Estimate planting date as 90 days before first harvest
    (pg.first_harvest_date - INTERVAL '90 days')::date,
    pg.location,
    CASE 
        WHEN pg.first_harvest_date > NOW() - INTERVAL '6 months' THEN 'active'
        ELSE 'harvested'
    END,
    'Migrated from harvest logs - ' || pg.harvest_count || ' recorded harvests'
FROM plant_groupings pg;

-- Step 3: Migrate harvest logs to plant events
-- Match harvest logs to plants based on crop name and location
INSERT INTO plant_events (
    plant_id, 
    event_type, 
    event_date, 
    produce, 
    quantity, 
    unit, 
    description, 
    notes, 
    location, 
    created_at, 
    updated_at
)
SELECT 
    p.id as plant_id,
    'harvest' as event_type,
    hl.harvest_date,
    hl.crop_name,
    hl.quantity,
    hl.unit,
    'Harvested ' || hl.quantity || ' ' || hl.unit || ' of ' || hl.crop_name,
    hl.notes,
    hl.location,
    hl.created_at,
    hl.updated_at
FROM harvest_logs hl
JOIN plant_varieties pv ON pv.name = hl.crop_name
JOIN plants p ON p.variety_id = pv.id 
    AND COALESCE(p.location, 'Unknown Location') = COALESCE(hl.location, 'Unknown Location')
    AND p.name LIKE hl.crop_name || '%';

-- Step 4: Migrate harvest images to event images
-- Match images to the corresponding plant events
INSERT INTO event_images (
    event_id,
    filename,
    original_filename,
    file_path,
    file_size,
    mime_type,
    width,
    height,
    upload_order,
    public_url,
    created_at,
    updated_at
)
SELECT 
    pe.id as event_id,
    hi.filename,
    hi.original_filename,
    hi.file_path,
    hi.file_size,
    hi.mime_type,
    hi.width,
    hi.height,
    hi.upload_order,
    hi.public_url,
    hi.created_at,
    hi.updated_at
FROM harvest_images hi
JOIN harvest_logs hl ON hi.harvest_log_id = hl.id
JOIN plant_varieties pv ON pv.name = hl.crop_name
JOIN plants p ON p.variety_id = pv.id 
    AND COALESCE(p.location, 'Unknown Location') = COALESCE(hl.location, 'Unknown Location')
    AND p.name LIKE hl.crop_name || '%'
JOIN plant_events pe ON pe.plant_id = p.id 
    AND pe.event_date = hl.harvest_date 
    AND pe.quantity = hl.quantity 
    AND pe.event_type = 'harvest';

-- Step 5: Data validation and integrity checks
-- Verify that all harvest logs were migrated
DO $$
DECLARE
    harvest_log_count INTEGER;
    plant_event_count INTEGER;
    harvest_image_count INTEGER;
    event_image_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO harvest_log_count FROM harvest_logs;
    SELECT COUNT(*) INTO plant_event_count FROM plant_events WHERE event_type = 'harvest';
    SELECT COUNT(*) INTO harvest_image_count FROM harvest_images;
    SELECT COUNT(*) INTO event_image_count FROM event_images;
    
    RAISE NOTICE 'Migration Validation Results:';
    RAISE NOTICE '- Original harvest logs: %', harvest_log_count;
    RAISE NOTICE '- Migrated harvest events: %', plant_event_count;
    RAISE NOTICE '- Original harvest images: %', harvest_image_count;
    RAISE NOTICE '- Migrated event images: %', event_image_count;
    
    IF harvest_log_count != plant_event_count THEN
        RAISE WARNING 'Harvest log count mismatch: % original vs % migrated', harvest_log_count, plant_event_count;
    END IF;
    
    IF harvest_image_count != event_image_count THEN
        RAISE WARNING 'Image count mismatch: % original vs % migrated', harvest_image_count, event_image_count;
    END IF;
    
    IF harvest_log_count = plant_event_count AND harvest_image_count = event_image_count THEN
        RAISE NOTICE 'Migration completed successfully! All data migrated correctly.';
    END IF;
END $$;

-- Step 6: Create migration tracking table for rollback capability
CREATE TABLE IF NOT EXISTS migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(100) NOT NULL,
    execution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    original_counts JSONB,
    migrated_counts JSONB
);

-- Record this migration
INSERT INTO migration_log (migration_name, notes, original_counts, migrated_counts)
SELECT 
    'harvest_to_plant_journey',
    'Migration from harvest_logs system to plant journey system',
    jsonb_build_object(
        'harvest_logs', (SELECT COUNT(*) FROM harvest_logs),
        'harvest_images', (SELECT COUNT(*) FROM harvest_images)
    ),
    jsonb_build_object(
        'plant_varieties', (SELECT COUNT(*) FROM plant_varieties),
        'plants', (SELECT COUNT(*) FROM plants),
        'plant_events', (SELECT COUNT(*) FROM plant_events),
        'event_images', (SELECT COUNT(*) FROM event_images)
    );

-- Create indices for better performance on the migrated data
ANALYZE plant_varieties;
ANALYZE plants;
ANALYZE plant_events;
ANALYZE event_images;

-- Final summary query to show migration results
SELECT 
    'Migration Summary' as section,
    jsonb_pretty(jsonb_build_object(
        'plant_varieties_created', (SELECT COUNT(*) FROM plant_varieties),
        'plants_created', (SELECT COUNT(*) FROM plants),
        'harvest_events_migrated', (SELECT COUNT(*) FROM plant_events WHERE event_type = 'harvest'),
        'images_migrated', (SELECT COUNT(*) FROM event_images),
        'earliest_event', (SELECT MIN(event_date) FROM plant_events),
        'latest_event', (SELECT MAX(event_date) FROM plant_events)
    )) as details;

COMMIT;

-- Instructions for rollback (run these commands if rollback is needed)
/*
ROLLBACK INSTRUCTIONS:
If you need to rollback this migration, run these commands:

BEGIN;
-- Delete migrated data
DELETE FROM event_images;
DELETE FROM plant_events;
DELETE FROM plants;
-- Optionally keep plant_varieties as they might be useful
-- DELETE FROM plant_varieties WHERE description LIKE 'Migrated from harvest logs%';
DELETE FROM migration_log WHERE migration_name = 'harvest_to_plant_journey';
COMMIT;

-- The original harvest_logs and harvest_images tables remain unchanged
*/