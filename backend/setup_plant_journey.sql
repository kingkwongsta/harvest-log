-- Plant Journey Database Schema
-- Migration from harvest-only to complete plant management system

-- Create plant_varieties table for managing plant types
CREATE TABLE IF NOT EXISTS plant_varieties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('vegetable', 'fruit', 'flower', 'herb', 'tree', 'shrub', 'other')),
    description TEXT,
    growing_season VARCHAR(50),
    harvest_time_days INTEGER,
    typical_yield VARCHAR(100),
    care_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plants table for individual plant tracking
CREATE TABLE IF NOT EXISTS plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    variety_id UUID REFERENCES plant_varieties(id),
    planted_date DATE,
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'harvested', 'deceased', 'dormant')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plant_events table for unified event logging
CREATE TABLE IF NOT EXISTS plant_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- For future multi-user support
    plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('harvest', 'bloom', 'snapshot')),
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Harvest-specific fields (nullable for other event types)
    produce VARCHAR(100),
    quantity FLOAT CHECK (quantity > 0),
    unit VARCHAR(50),
    
    -- Bloom-specific fields (nullable for other event types)
    flower_type VARCHAR(100),
    bloom_stage VARCHAR(20) CHECK (bloom_stage IN ('bud', 'opening', 'full_bloom', 'fading', 'seed_set')),
    
    -- Common fields for all event types
    description TEXT,
    notes TEXT,
    location VARCHAR(200),
    
    -- Flexible metrics storage (JSONB for extensibility)
    metrics JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints to ensure required fields based on event type
    CONSTRAINT harvest_fields_check CHECK (
        CASE 
            WHEN event_type = 'harvest' THEN (produce IS NOT NULL AND quantity IS NOT NULL AND unit IS NOT NULL)
            ELSE TRUE
        END
    ),
    CONSTRAINT bloom_fields_check CHECK (
        CASE 
            WHEN event_type = 'bloom' THEN (flower_type IS NOT NULL)
            ELSE TRUE
        END
    )
);

-- Create event_images table (replaces harvest_images)
CREATE TABLE IF NOT EXISTS event_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES plant_events(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    upload_order INTEGER DEFAULT 0,
    public_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_plant_varieties_updated_at 
    BEFORE UPDATE ON plant_varieties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_updated_at 
    BEFORE UPDATE ON plants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plant_events_updated_at 
    BEFORE UPDATE ON plant_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_images_updated_at 
    BEFORE UPDATE ON event_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plant_varieties_category ON plant_varieties(category);
CREATE INDEX IF NOT EXISTS idx_plant_varieties_name ON plant_varieties(name);

CREATE INDEX IF NOT EXISTS idx_plants_variety_id ON plants(variety_id);
CREATE INDEX IF NOT EXISTS idx_plants_status ON plants(status);
CREATE INDEX IF NOT EXISTS idx_plants_planted_date ON plants(planted_date DESC);

CREATE INDEX IF NOT EXISTS idx_plant_events_plant_id ON plant_events(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_events_event_type ON plant_events(event_type);
CREATE INDEX IF NOT EXISTS idx_plant_events_event_date ON plant_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_plant_events_created_at ON plant_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plant_events_plant_type ON plant_events(plant_id, event_type);

-- JSONB indexes for metrics queries
CREATE INDEX IF NOT EXISTS idx_plant_events_metrics ON plant_events USING GIN (metrics);

CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_created_at ON event_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_images_upload_order ON event_images(event_id, upload_order);

-- Enable Row Level Security (RLS) for security
ALTER TABLE plant_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

-- Create policies for plant_varieties (public read, authenticated write)
CREATE POLICY "Allow public read access to plant varieties" ON plant_varieties
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage plant varieties" ON plant_varieties
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to plant varieties" ON plant_varieties
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for plants
CREATE POLICY "Allow authenticated users to manage plants" ON plants
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to plants" ON plants
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for plant_events
CREATE POLICY "Allow authenticated users to manage plant events" ON plant_events
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to plant events" ON plant_events
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for event_images
CREATE POLICY "Allow authenticated users to manage event images" ON event_images
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to event images" ON event_images
    FOR ALL USING (auth.role() = 'service_role');

-- Insert default plant varieties from common crops
INSERT INTO plant_varieties (name, category, description, growing_season, harvest_time_days, typical_yield, care_instructions)
VALUES 
    ('Tomato', 'vegetable', 'Versatile fruit vegetable with varieties for all climates', 'Spring-Summer', 75, '10-15 lbs per plant', 'Needs support, regular watering, full sun'),
    ('Lettuce', 'vegetable', 'Cool-season leafy green', 'Spring-Fall', 45, '1-2 lbs per plant', 'Prefers cooler weather, partial shade in summer'),
    ('Basil', 'herb', 'Aromatic herb perfect for cooking', 'Summer', 60, '2-4 oz per plant', 'Pinch flowers to encourage leaf growth, warm weather'),
    ('Carrot', 'vegetable', 'Root vegetable with long harvest period', 'Spring-Fall', 70, '1-2 lbs per sq ft', 'Deep, loose soil, consistent moisture'),
    ('Pepper', 'vegetable', 'Heat-loving fruit vegetable', 'Summer', 80, '5-10 lbs per plant', 'Warm soil, regular feeding, full sun'),
    ('Cucumber', 'vegetable', 'Vining crop with high yield', 'Summer', 55, '15-20 lbs per plant', 'Needs support, consistent watering, warm weather'),
    ('Zucchini', 'vegetable', 'Prolific summer squash', 'Summer', 50, '20-25 lbs per plant', 'Regular harvest encourages production, full sun'),
    ('Marigold', 'flower', 'Bright companion flower', 'Spring-Fall', 50, '20-30 flowers per plant', 'Drought tolerant, deadhead for continuous blooms'),
    ('Mint', 'herb', 'Perennial herb spreads readily', 'Spring-Fall', 40, '1-2 lbs per season', 'Contain growth, partial shade ok, moist soil'),
    ('Sunflower', 'flower', 'Tall flowering plant with edible seeds', 'Summer', 90, '1-2 large heads per plant', 'Full sun, deep watering, may need staking')
ON CONFLICT (name) DO NOTHING;

-- Create views for easier querying
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

-- Grant permissions for plant_timeline view
GRANT SELECT ON plant_timeline TO authenticated;

-- Create view for harvest summary
CREATE OR REPLACE VIEW harvest_summary AS
SELECT 
    p.id as plant_id,
    p.name as plant_name,
    pv.name as variety_name,
    pv.category as plant_category,
    COUNT(pe.id) as total_harvests,
    SUM(pe.quantity) as total_quantity,
    pe.unit,
    MIN(pe.event_date) as first_harvest,
    MAX(pe.event_date) as last_harvest,
    AVG(pe.quantity) as avg_quantity
FROM plants p
LEFT JOIN plant_varieties pv ON p.variety_id = pv.id
LEFT JOIN plant_events pe ON p.id = pe.plant_id AND pe.event_type = 'harvest'
WHERE pe.id IS NOT NULL
GROUP BY p.id, p.name, pv.name, pv.category, pe.unit
ORDER BY total_quantity DESC;

-- Grant permissions for harvest_summary view
GRANT SELECT ON harvest_summary TO authenticated;

-- Create view for plant health tracking
CREATE OR REPLACE VIEW plant_health_timeline AS
SELECT 
    p.id as plant_id,
    p.name as plant_name,
    pe.event_date,
    pe.metrics->'health_score' as health_score,
    pe.metrics->'height_cm' as height_cm,
    pe.metrics->'width_cm' as width_cm,
    pe.metrics->'pest_issues' as pest_issues,
    pe.metrics->'disease_signs' as disease_signs,
    pe.notes,
    pe.created_at
FROM plants p
LEFT JOIN plant_events pe ON p.id = pe.plant_id AND pe.event_type = 'snapshot'
WHERE pe.id IS NOT NULL
ORDER BY p.id, pe.event_date DESC;

-- Grant permissions for plant_health_timeline view
GRANT SELECT ON plant_health_timeline TO authenticated;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE plant_varieties IS 'Catalog of plant varieties with growing information';
COMMENT ON TABLE plants IS 'Individual plant instances with planting and status information';
COMMENT ON TABLE plant_events IS 'Unified event logging for harvest, bloom, and snapshot events';
COMMENT ON TABLE event_images IS 'Image metadata for plant events';
COMMENT ON VIEW plant_timeline IS 'Complete timeline view of all events for all plants';
COMMENT ON VIEW harvest_summary IS 'Summary statistics for harvest events by plant';
COMMENT ON VIEW plant_health_timeline IS 'Health and growth tracking over time for plants';