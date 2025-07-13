-- =========================
-- REQUIRED TABLES FOR MEDICINE EXPLAINER
-- =========================
-- 
-- Instructions:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query and paste this code
-- 4. Run the query to create the tables
-- 

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create prescription_analyses table
CREATE TABLE IF NOT EXISTS prescription_analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prescription_text TEXT NOT NULL,
    analysis_result JSONB NOT NULL,
    user_profile JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medication_searches table
CREATE TABLE IF NOT EXISTS medication_searches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    medication_info JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_reports table
CREATE TABLE IF NOT EXISTS health_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    report_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prescription_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prescription_analyses
CREATE POLICY "Users can view their own prescription analyses" 
    ON prescription_analyses FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prescription analyses" 
    ON prescription_analyses FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prescription analyses" 
    ON prescription_analyses FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prescription analyses" 
    ON prescription_analyses FOR DELETE 
    USING (auth.uid() = user_id);

-- Create RLS policies for medication_searches
CREATE POLICY "Users can view their own medication searches" 
    ON medication_searches FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medication searches" 
    ON medication_searches FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication searches" 
    ON medication_searches FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication searches" 
    ON medication_searches FOR DELETE 
    USING (auth.uid() = user_id);

-- Create RLS policies for health_reports
CREATE POLICY "Users can view their own health reports" 
    ON health_reports FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health reports" 
    ON health_reports FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health reports" 
    ON health_reports FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health reports" 
    ON health_reports FOR DELETE 
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS prescription_analyses_user_id_idx ON prescription_analyses(user_id);
CREATE INDEX IF NOT EXISTS prescription_analyses_created_at_idx ON prescription_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS medication_searches_user_id_idx ON medication_searches(user_id);
CREATE INDEX IF NOT EXISTS medication_searches_created_at_idx ON medication_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS health_reports_user_id_idx ON health_reports(user_id);
CREATE INDEX IF NOT EXISTS health_reports_created_at_idx ON health_reports(created_at DESC);

-- Success message
SELECT 'All tables created successfully!' as message;
