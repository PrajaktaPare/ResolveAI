import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { api } from "@/config/api";
import { logger } from "@/utils/logger";

const log = logger.child("auth");

// Local session state when Supabase is not configured
let localSession = null;
const listeners = new Set();

/**
 * Sign up a new citizen account.
 */
export async function signUp({ email, password, fullName, phone }) {
  if (!isSupabaseConfigured) {
    log.info("Signing up (mock backend):", email);
    const { data } = await api.post("/auth/register", {
      email,
      password,
      fullName,
      phone,
    });
    return data;
  }

  log.info("Signing up (Supabase):", email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone: phone || null },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Sign in with email + password.
 */
export async function signIn({ email, password }) {
  if (!isSupabaseConfigured) {
    log.info("Signing in (mock backend):", email);
    const { data } = await api.post("/auth/login", { email, password });
    
    // Save session details to localStorage to persist across reloads
    localStorage.setItem("resolve_ai_session", JSON.stringify(data.session));
    localStorage.setItem("resolve_ai_user", JSON.stringify(data.user));
    localSession = data.session;
    
    // Notify auth listeners
    const sessionWithUser = {
      ...data.session,
      user: data.user,
    };
    listeners.forEach((cb) => cb(sessionWithUser));
    
    return data;
  }

  log.info("Signing in (Supabase):", email);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  if (!isSupabaseConfigured) {
    log.info("Signing out (mock backend)");
    try {
      await api.post("/auth/logout");
    } catch (e) {
      log.warn("Mock logout endpoint call failed:", e.message);
    }
    
    localStorage.removeItem("resolve_ai_session");
    localStorage.removeItem("resolve_ai_user");
    localSession = null;
    
    listeners.forEach((cb) => cb(null));
    return;
  }

  log.info("Signing out (Supabase)");
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Send a password reset email.
 */
export async function requestPasswordReset(email) {
  if (!isSupabaseConfigured) {
    log.info("Password reset requested (mock backend):", email);
    return { message: "Reset email sent (mock)" };
  }

  log.info("Password reset requested (Supabase):", email);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw error;
}

/**
 * Get the active session.
 */
export async function getSession() {
  if (!isSupabaseConfigured) {
    if (!localSession) {
      const stored = localStorage.getItem("resolve_ai_session");
      if (stored) {
        try {
          localSession = JSON.parse(stored);
        } catch (e) {
          localStorage.removeItem("resolve_ai_session");
        }
      }
    }
    
    if (localSession) {
      const userStored = localStorage.getItem("resolve_ai_user");
      let user = null;
      if (userStored) {
        try {
          user = JSON.parse(userStored);
        } catch (e) {}
      }
      return {
        ...localSession,
        user: user || { id: "mock_user_id", email: "user@example.com" },
      };
    }
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Fetch the profile row for a given user id.
 */
export async function getProfile(userId) {
  if (!isSupabaseConfigured) {
    log.info("Fetching profile (mock backend)");
    try {
      const { data } = await api.get("/auth/profile");
      return data.user || {
        id: userId,
        full_name: "John Citizen",
        email: "user@example.com",
        role: "citizen",
      };
    } catch (e) {
      // Fallback if backend API is not running
      const userStored = localStorage.getItem("resolve_ai_user");
      if (userStored) {
        try {
          return JSON.parse(userStored);
        } catch (err) {}
      }
      return {
        id: userId,
        full_name: "John Citizen",
        email: "user@example.com",
        role: "citizen",
      };
    }
  }

  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
  if (error) {
    log.warn("Could not load profile:", error.message);
    return null;
  }
  return data;
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) {
    listeners.add(callback);
    // Initial callback invocation
    getSession().then((session) => callback(session));
    return () => {
      listeners.delete(callback);
    };
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => subscription.unsubscribe();
}
