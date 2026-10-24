import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  // Check import.meta.env (Vite)
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env) {
      const val = (import.meta as any).env[key];
      if (val) return val;
    }
  } catch {}

  // Check process.env (Node / Expo)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key];
      if (val) return val;
    }
  } catch {}

  return undefined;
};

const supabaseUrl =
  getEnv('VITE_SUPABASE_URL') ||
  getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnv('EXPO_PUBLIC_SUPABASE_URL') ||
  'https://wfjbetswwgfyqmsoltva.supabase.co';

const supabaseAnonKey =
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
  'sb_publishable_ixrkqzZpp3txZ9ZrwBY63A_O4UNxG4f';

// Vitest unit/integration tests run in memory without requiring remote DB migration
export const isTestEnv =
  typeof process !== 'undefined' &&
  (process.env?.NODE_ENV === 'test' || Boolean(process.env?.VITEST));


export const isLiveSupabaseConfigured =
  !isTestEnv &&
  Boolean(supabaseUrl) &&
  !supabaseUrl.includes('demo-part-project') &&
  Boolean(supabaseAnonKey) &&
  !supabaseAnonKey.includes('demo-anon-key');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
