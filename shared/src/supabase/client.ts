import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables can come from Expo process.env or Vite import.meta.env
const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://demo-part-project.supabase.co';

const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo-anon-key';

export const isLiveSupabaseConfigured =
  supabaseUrl !== 'https://demo-part-project.supabase.co' &&
  !supabaseAnonKey.includes('demo-anon-key');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
