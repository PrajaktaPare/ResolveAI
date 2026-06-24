/**
 * @file supabase.js
 * @description Configures the client-side Supabase browser client.
 * Connects to Supabase using public anonymous credentials, enabling Row Level Security (RLS) policies.
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "@/utils/logger";

// Read endpoints and keys from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are set to determine if Supabase auth should be enabled.
// Supports both the traditional JWT keys (starting with 'eyJ') and the new Supabase API keys (starting with 'sb_publishable_').
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("your-") &&
  !supabaseAnonKey.includes("your-")
);

if (!isSupabaseConfigured) {
  logger.warn(
    "Supabase is not configured or using placeholder keys. Falling back to MOCK mode (OTP code: 123456).",
  );
}

/**
 * Shared Supabase Browser Client
 * Instantiated using the anonymous key.
 * Persists session credentials in localStorage and auto-refreshes tokens inside the browser context.
 * Falls back to null if keys are missing to allow offline/mock UI testing.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,      // Save session credentials in browser storage
        autoRefreshToken: true,    // Periodically fetch new tokens in background
        detectSessionInUrl: true,  // Automatically detect OAuth redirect session tokens in address bar
      },
    })
  : null;

