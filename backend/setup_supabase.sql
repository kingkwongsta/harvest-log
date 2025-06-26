-- Create harvest_logs table for storing harvest log data
CREATE TABLE IF NOT EXISTS harvest_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(100) NOT NULL,
    quantity FLOAT NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    harvest_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create harvest_images table for storing image metadata
CREATE TABLE IF NOT EXISTS harvest_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    harvest_log_id UUID NOT NULL REFERENCES harvest_logs(id) ON DELETE CASCADE,
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

-- Add public_url column if it doesn't exist (for existing databases)
ALTER TABLE harvest_images ADD COLUMN IF NOT EXISTS public_url TEXT;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_harvest_logs_updated_at 
    BEFORE UPDATE ON harvest_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for harvest_images updated_at
CREATE TRIGGER update_harvest_images_updated_at 
    BEFORE UPDATE ON harvest_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_harvest_logs_created_at ON harvest_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_harvest_logs_harvest_date ON harvest_logs(harvest_date DESC);
CREATE INDEX IF NOT EXISTS idx_harvest_logs_crop_name ON harvest_logs(crop_name);

-- Create indexes for harvest_images
CREATE INDEX IF NOT EXISTS idx_harvest_images_harvest_log_id ON harvest_images(harvest_log_id);
CREATE INDEX IF NOT EXISTS idx_harvest_images_created_at ON harvest_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_harvest_images_upload_order ON harvest_images(harvest_log_id, upload_order);

-- Enable Row Level Security (RLS) for security
ALTER TABLE harvest_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- Note: You may want to customize this based on your authentication needs
CREATE POLICY "Allow all operations for authenticated users" ON harvest_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow all operations for service role
CREATE POLICY "Allow all operations for service role" ON harvest_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for harvest_images
CREATE POLICY "Allow all operations for authenticated users" ON harvest_images
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for service role" ON harvest_images
    FOR ALL USING (auth.role() = 'service_role');

-- Create storage bucket for harvest images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'harvest-images',
    'harvest-images',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for harvest images bucket
CREATE POLICY "Allow authenticated users to upload harvest images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'harvest-images' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Allow public access to harvest images" ON storage.objects
    FOR SELECT USING (bucket_id = 'harvest-images');

CREATE POLICY "Allow authenticated users to update their harvest images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'harvest-images' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to delete their harvest images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'harvest-images' AND 
        auth.role() = 'authenticated'
    ); 