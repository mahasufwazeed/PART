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

export const googleClientId =
  getEnv('VITE_GOOGLE_CLIENT_ID') ||
  getEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID') ||
  getEnv('EXPO_PUBLIC_GOOGLE_CLIENT_ID') ||
  getEnv('GOOGLE_CLIENT_ID') ||
  '';

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
    detectSessionInUrl: typeof window !== 'undefined',
  },
});

/**
 * Dynamically resolves the current origin without hardcoding localhost in production
 */
export const getAppCanonicalOrigin = (): string => {
  // 1. Browser window origin (active host & port e.g. https://part-marketplace.onrender.com or http://localhost:3000)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // 2. Environment variables for production hosting platforms (Render, Vercel, custom)
  const envUrl =
    getEnv('VITE_APP_URL') ||
    getEnv('APP_URL') ||
    getEnv('NEXT_PUBLIC_APP_URL') ||
    getEnv('RENDER_EXTERNAL_URL');

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 3. Fallback for test / server environments
  return 'http://localhost:3000';
};

/**
 * Builds the canonical Google OAuth callback URL
 */
export const getGoogleCallbackUrl = (customRedirect?: string): string => {
  if (customRedirect) return customRedirect;
  return `${getAppCanonicalOrigin()}/auth/callback`;
};


