-- Quick script to get your user ID for sample data
-- Run this in Supabase SQL Editor after authenticating in your app

SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users
WHERE email = 'your-email@example.com';  -- Replace with your actual email

-- Alternative: Get all users (if you're admin)
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
