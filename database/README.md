# Database Setup Guide

This guide will help you set up the required database tables in Supabase for the Healthcare App.

## Quick Setup (5 minutes)

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query" to create a new SQL script

### Step 2: Run the Setup Script
1. Copy the entire content from `database/setup.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the script

### Step 3: Verify Tables Created
After running the script, you should see these tables in your database:
- `mood_entries` - Stores user mood tracking data
- `mood_settings` - User preferences for mood tracking
- `symptom_reports` - User symptom submissions
- `diagnosis_logs` - AI analysis results and recommendations

### Step 4: Add Sample Data (Optional)
To test the mood analytics immediately:

1. Go to your Supabase dashboard
2. Click "Authentication" → "Users"
3. Copy your user ID (the UUID in the first column)
4. Go back to SQL Editor
5. Uncomment the sample data section at the bottom of `setup.sql`
6. Replace `'your-user-id-here'` with your actual user ID
7. Run the INSERT statements

## Table Structure

### mood_entries
- `id` - Unique identifier
- `user_id` - Links to authenticated user
- `date` - Date of mood entry
- `mood` - Mood rating (1-5)
- `emotions` - Array of emotion tags
- `activities` - Array of activity tags
- `notes` - Optional text notes
- `created_at` - Timestamp when created
- `updated_at` - Timestamp when last updated

### mood_settings
- User-specific settings for mood tracking
- Reminder preferences
- Privacy settings

### symptom_reports
- User symptom submissions
- Detailed symptom information
- User profile data for AI analysis

### diagnosis_logs
- AI analysis results
- Possible conditions and recommendations
- Confidence scores and urgency levels

## Security

All tables have Row Level Security (RLS) enabled, meaning:
- Users can only access their own data
- Data is automatically filtered by user authentication
- Full privacy protection between users

## Need Help?

If you encounter any issues:
1. Check that you have the correct Supabase project selected
2. Ensure you have admin/owner permissions on the project
3. Verify your environment variables are set correctly
4. Check the Supabase logs for any error messages

The app will automatically work once the tables are created!
