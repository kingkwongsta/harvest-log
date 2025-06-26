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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_harvest_logs_created_at ON harvest_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_harvest_logs_harvest_date ON harvest_logs(harvest_date DESC);
CREATE INDEX IF NOT EXISTS idx_harvest_logs_crop_name ON harvest_logs(crop_name);

-- Enable Row Level Security (RLS) for security
ALTER TABLE harvest_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- Note: You may want to customize this based on your authentication needs
CREATE POLICY "Allow all operations for authenticated users" ON harvest_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow all operations for service role
CREATE POLICY "Allow all operations for service role" ON harvest_logs
    FOR ALL USING (auth.role() = 'service_role'); 