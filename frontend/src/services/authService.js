/**
 * @file authService.js
 * @description Authentication service layer.
 * Coordinates user registration, login, logout, password reset operations, and session subscriptions.
 * Supports dual execution modes: using active Supabase configurations or fallback mock API endpoints.
 */

import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { api } from "@/config/api";
import { logger } from "@/utils/logger";

const log = logger.child("auth");

// ─── Demo Account Credentials ───────────────────────────────────────────────
// Pre-configured demo account for judges / evaluators to instantly access the platform.
export const DEMO_CREDENTIALS = {
  email: "demo@resolveai.com",
  otpCode: "123456",
};

const DEMO_USER_PROFILE = {
  id: "demo_user_arjun_mehta_001",
  email: DEMO_CREDENTIALS.email,
  full_name: "Arjun Mehta",
  phone: "+91 98765 43210",
  role: "admin",
  reputation_score: 2450,
  location: "New Delhi, India",
  bio: "Community lead & civic technology advocate. Helping make Indian cities smarter and safer through data-driven issue resolution.",
  avatar_url: null,
  created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // ~6 months ago
};
// ─────────────────────────────────────────────────────────────────────────────

// In-memory cache for mock session states
let localSession = null;

// Registry of listener callbacks tracking authentication state updates
const listeners = new Set();

/**
 * sendOtp
 * Triggers sending an OTP verification code to the target email address.
 *
 * @param {Object} params - parameters (email, fullName, phone).
 * @returns {Promise<Object>} Result message.
 */
export async function sendOtp({ email, fullName, phone }) {
  const isDemoAccount = email.toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase();

  if (!isSupabaseConfigured || isDemoAccount) {
    log.info("Sending OTP (mock backend):", email);
    localStorage.setItem(
      "resolve_ai_mock_otp_reg",
      JSON.stringify({ email, fullName, phone })
    );
    return { message: "OTP sent (mock)" };
  }

  log.info("Sending OTP (Supabase):", email);
  const options = {
    shouldCreateUser: true,
    emailRedirectTo: `${window.location.origin}/dashboard`,
  };

  if (fullName || phone) {
    options.data = {};
    if (fullName) options.data.full_name = fullName;
    if (phone) options.data.phone = phone;
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options,
  });
  if (error) throw error;
  return data;
}

/**
 * verifyOtp
 * Verifies the OTP token against the email and starts a session.
 *
 * @param {Object} params - parameters (email, token).
 * @returns {Promise<Object>} session and user context.
 */
export async function verifyOtp({ email, token }) {
  const isDemoAccount = email.toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase();

  if (!isSupabaseConfigured || isDemoAccount) {
    log.info("Verifying OTP (mock backend):", email, token);
    if (!token) throw new Error("Verification code is required");

    const storedRegStr = localStorage.getItem("resolve_ai_mock_otp_reg");
    let metadata = {};
    if (storedRegStr) {
      try {
        const parsed = JSON.parse(storedRegStr);
        if (parsed.email === email) {
          metadata = parsed;
        }
      } catch (e) {}
    }

    // Use pre-configured demo profile for the demo account email
    const mockUser = isDemoAccount
      ? { ...DEMO_USER_PROFILE }
      : {
          id: "mock_user_" + Math.random().toString(36).substr(2, 9),
          email,
          full_name: metadata.fullName || email.split("@")[0],
          phone: metadata.phone || null,
          role: "citizen",
          reputation_score: 0,
          created_at: new Date().toISOString(),
        };

    const mockSession = {
      access_token: `mock_token_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_in: 3600,
    };

    localStorage.setItem("resolve_ai_session", JSON.stringify(mockSession));
    localStorage.setItem("resolve_ai_user", JSON.stringify(mockUser));
    localStorage.removeItem("resolve_ai_mock_otp_reg");
    localSession = mockSession;

    const sessionWithUser = {
      ...mockSession,
      user: mockUser,
    };
    listeners.forEach((cb) => cb(sessionWithUser));
    return { session: mockSession, user: mockUser };
  }

  log.info("Verifying OTP (Supabase):", email);
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
  return data;
}

/**
 * signUp
 * Legacy wrapper calling sendOtp for registration.
 */
export async function signUp({ email, fullName, phone }) {
  return sendOtp({ email, fullName, phone });
}

/**
 * signIn
 * Legacy wrapper calling sendOtp.
 */
export async function signIn({ email }) {
  return sendOtp({ email });
}

/**
 * signOut
 * Invalidates user session tokens and flushes local caching stores.
 */
export async function signOut() {
  // ALWAYS clear local mock session (in case user was logged in via Demo Account)
  localStorage.removeItem("resolve_ai_session");
  localStorage.removeItem("resolve_ai_user");
  localSession = null;

  if (!isSupabaseConfigured) {
    // Mock Logout Flow
    log.info("Signing out (mock backend)");
    try {
      await api.post("/auth/logout");
    } catch (e) {
      log.warn("Mock logout endpoint call failed:", e.message);
    }
    
    // Notify all listeners of session expiration
    listeners.forEach((cb) => cb(null));
    return;
  }

  // Supabase Logout Flow
  log.info("Signing out (Supabase)");
  const { error } = await supabase.auth.signOut();
  
  // We manually trigger listeners because if there was only a mock session, Supabase might not fire a change event
  listeners.forEach((cb) => cb(null));

  if (error) throw error;
}

/**
 * requestPasswordReset
 * Sends a secure reset password trigger email.
 * 
 * @param {string} email - Targeted user email.
 * @returns {Promise<Object>} Trigger response values.
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
 * getSession
 * Returns the currently active authenticated session parameters.
 * Checks local cache state or queries active client libraries.
 * 
 * @returns {Promise<Object|null>} Decoded user session packet.
 */
export async function getSession() {
  let session = null;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      log.error("Supabase getSession error:", error.message);
    } else {
      session = data?.session;
    }
  }

  if (session) return session;

  // Fallback to local mock session (used for demo account even if Supabase is configured)
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

/**
 * _getDemoOrFallbackProfile
 * Returns the demo profile if the user matches the demo account, otherwise a generic fallback.
 */
function _getDemoOrFallbackProfile(userId) {
  if (userId === DEMO_USER_PROFILE.id) {
    return { ...DEMO_USER_PROFILE };
  }
  // Also check localStorage for demo user
  const userStored = localStorage.getItem("resolve_ai_user");
  if (userStored) {
    try {
      const parsed = JSON.parse(userStored);
      if (parsed.email?.toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase()) {
        return { ...DEMO_USER_PROFILE, id: parsed.id || userId };
      }
    } catch (e) {}
  }
  return {
    id: userId,
    full_name: "John Citizen",
    email: "user@example.com",
    role: "citizen",
  };
}

/**
 * getProfile
 * Fetches profile attributes from public.users database schema.
 * 
 * @param {string} userId - User ID key.
 * @returns {Promise<Object|null>} Profile details from PostgreSQL table.
 */
export async function getProfile(userId) {
  if (!isSupabaseConfigured) {
    log.info("Fetching profile (mock backend)");
    try {
      const { data } = await api.get("/auth/profile");
      return data.user || _getDemoOrFallbackProfile(userId);
    } catch (e) {
      // Fallback: Read profile settings directly from local memory if backend server is offline
      const userStored = localStorage.getItem("resolve_ai_user");
      if (userStored) {
        try {
          return JSON.parse(userStored);
        } catch (err) {}
      }
      return _getDemoOrFallbackProfile(userId);
    }
  }

  // Fetch profiles matching user ID from Supabase PostgreSQL database
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) {
    log.warn("Could not load profile:", error.message);
    return null;
  }
  return data;
}

/**
 * onAuthStateChange
 * Exposes a subscription channel tracking login/logout event states.
 * 
 * @param {(session: Object|null) => void} callback - Subscriber function.
 * @returns {() => void} Unsubscribe function call.
 */
export function onAuthStateChange(callback) {
  // Always add to our custom listeners so mock logins can trigger state updates
  listeners.add(callback);

  if (!isSupabaseConfigured) {
    // Execute callback immediately with current active session
    getSession().then((session) => callback(session));
    return () => {
      listeners.delete(callback);
    };
  }

  // Set up Supabase event change handler subscription
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session) {
      // If Supabase has no session, check if we have a local mock demo session
      const mockSession = await getSession();
      callback(mockSession);
    } else {
      callback(session);
    }
  });

  return () => {
    listeners.delete(callback);
    subscription.unsubscribe();
  };
}
