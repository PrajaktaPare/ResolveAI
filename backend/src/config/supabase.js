/**
 * @file supabase.js
 * @description Configuration file to initialize the Supabase server-side admin client.
 * Connects using service role privileges to bypass Row Level Security (RLS) constraints on administrative tasks.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Initialize environment configuration
dotenv.config();

// Extract Supabase parameters from host environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Warn developer if credentials are missing
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("[ResolveAI:backend] Supabase URL or Service Role Key missing. Check .env file.");
}

/**
 * Supabase Admin Client
 * Instantiated with the secret Service Role Key.
 * Disables session persistence and refresh tokens appropriate for stateless server execution.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,     // Disable saving session state in memory/cookies
    autoRefreshToken: false,   // Disable automatic token refreshes in the background
  },
});

