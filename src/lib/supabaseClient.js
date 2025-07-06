import { createClient } from '@supabase/supabase-js'

// Retrieve Supabase URL and Anon Key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
