-- =========================
-- HEALTHCARE APP DATABASE SETUP
-- =========================

-- Drop all existing tables (CAUTION: this deletes all data!)
DROP TABLE IF EXISTS mood_entries CASCADE;
DROP TABLE IF EXISTS mood_settings CASCADE;
DROP TABLE IF EXISTS symptom_reports CASCADE;
DROP TABLE IF EXISTS diagnosis_logs CASCADE;

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- MOOD TRACKING TABLES
-- =========================

CREATE TABLE mood_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
    emotions TEXT[] DEFAULT '{}',
    activities TEXT[] DEFAULT '{}',
    notes TEXT,
    tags TEXT[] DEFAULT '{}',              -- Tags/triggers (NEW)
    sleep_hours FLOAT,                     -- Sleep hours (NEW)
    energy_level INTEGER,                  -- Energy level (NEW)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE mood_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    reminder_enabled BOOLEAN DEFAULT FALSE,
    reminder_time TIME DEFAULT '20:00',
    privacy_level VARCHAR(20) DEFAULT 'private',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================
-- SYMPTOM TRACKING TABLES
-- =========================

CREATE TABLE symptom_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symptoms TEXT[] NOT NULL,
    symptom_details JSONB DEFAULT '{}',
    user_profile JSONB DEFAULT '{}',
    follow_up_answers JSONB DEFAULT '{}',
    severity_level VARCHAR(20) DEFAULT 'moderate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE diagnosis_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symptom_report_id UUID REFERENCES symptom_reports(id) ON DELETE CASCADE,
    analysis_result JSONB NOT NULL,
    possible_conditions TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    urgency_level VARCHAR(20) DEFAULT 'low',
    follow_up_questions JSONB DEFAULT '{}',
    ai_confidence DECIMAL(3,2) DEFAULT 0.50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================
-- ENABLE ROW LEVEL SECURITY
-- =========================

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_logs ENABLE ROW LEVEL SECURITY;

-- =========================
-- MOOD POLICIES
-- =========================

CREATE POLICY "Users can view their own mood entries" 
ON mood_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood entries" 
ON mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood entries" 
ON mood_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood entries" 
ON mood_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own mood settings" 
ON mood_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood settings" 
ON mood_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood settings" 
ON mood_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood settings" 
ON mood_settings FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- SYMPTOM POLICIES
-- =========================

CREATE POLICY "Users can view their own symptom reports" 
ON symptom_reports FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own symptom reports" 
ON symptom_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptom reports" 
ON symptom_reports FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptom reports" 
ON symptom_reports FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own diagnosis logs" 
ON diagnosis_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagnosis logs" 
ON diagnosis_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagnosis logs" 
ON diagnosis_logs FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- INDEXES FOR PERFORMANCE
-- =========================

CREATE INDEX mood_entries_user_id_idx ON mood_entries(user_id);
CREATE INDEX mood_entries_date_idx ON mood_entries(date);
CREATE INDEX symptom_reports_user_id_idx ON symptom_reports(user_id);
CREATE INDEX diagnosis_logs_user_id_idx ON diagnosis_logs(user_id);
CREATE INDEX diagnosis_logs_symptom_report_idx ON diagnosis_logs(symptom_report_id);

-- =========================
-- SAMPLE DATA (OPTIONAL)
-- =========================
/*
-- Replace 'your-user-id-here' with a real user ID from auth.users
INSERT INTO mood_entries (user_id, date, mood, emotions, activities, notes, tags, sleep_hours, energy_level) VALUES
('your-user-id-here', CURRENT_DATE - INTERVAL '7 days', 3, ARRAY['calm', 'content'], ARRAY['work', 'exercise'], 'Had a productive day at work', ARRAY['Work', 'Exercise'], 7.5, 6),
('your-user-id-here', CURRENT_DATE - INTERVAL '6 days', 4, ARRAY['happy', 'energetic'], ARRAY['friends', 'hobbies'], 'Great time with friends', ARRAY['Friends', 'Fun'], 8, 8),
('your-user-id-here', CURRENT_DATE - INTERVAL '5 days', 2, ARRAY['anxious', 'tired'], ARRAY['work', 'stress'], 'Feeling overwhelmed with work', ARRAY['Work', 'Stress'], 5, 3),
('your-user-id-here', CURRENT_DATE - INTERVAL '4 days', 4, ARRAY['relaxed', 'grateful'], ARRAY['family', 'exercise'], 'Nice weekend with family', ARRAY['Family', 'Exercise'], 9, 7),
('your-user-id-here', CURRENT_DATE - INTERVAL '3 days', 3, ARRAY['neutral', 'focused'], ARRAY['work', 'reading'], 'Regular day, got some reading done', ARRAY['Work', 'Learning'], 6.5, 5),
('your-user-id-here', CURRENT_DATE - INTERVAL '2 days', 5, ARRAY['excited', 'happy'], ARRAY['celebration', 'friends'], 'Celebrated a big achievement!', ARRAY['Friends', 'Fun'], 8, 9),
('your-user-id-here', CURRENT_DATE - INTERVAL '1 day', 3, ARRAY['calm', 'thoughtful'], ARRAY['reflection', 'nature'], 'Spent time in nature, feeling peaceful', ARRAY['Nature', 'Relaxation'], 7, 6),
('your-user-id-here', CURRENT_DATE, 4, ARRAY['optimistic', 'motivated'], ARRAY['goals', 'planning'], 'Setting new goals for the future', ARRAY['Goals', 'Planning'], 7.5, 7);
*/

-- =========================
-- END OF SCRIPT
-- =========================
