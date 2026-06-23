/**
 * @file AuthContext.jsx
 * @description React Context Provider managing user sessions and profile sync.
 * Triggers auth state updates and profile loading upon page mount or authentication state changes.
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import * as authService from "@/services/authService";
import { isSupabaseConfigured } from "@/config/supabase";
import { ROLES } from "@/utils/constants";
import { logger } from "@/utils/logger";

const log = logger.child("auth-context");

// Initialize undefined React context for authentication data
const AuthContext = createContext(undefined);

/**
 * AuthProvider Component
 * Encloses the React app to supply authentication flags, session parameters, profile objects, and auth trigger handlers.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // Active auth session containing access tokens
  const [profile, setProfile] = useState(null); // Database user profile attributes (name, role, avatar)
  const [loading, setLoading] = useState(true); // Loading state indicator for bootstrap cycles

  /**
   * loadProfile
   * Helper function to fetch additional user details from the database when a user session exists.
   */
  const loadProfile = useCallback(async (activeSession) => {
    if (!activeSession?.user) {
      setProfile(null);
      return;
    }
    try {
      const data = await authService.getProfile(activeSession.user.id);
      setProfile(
        data || {
          id: activeSession.user.id,
          full_name: activeSession.user.user_metadata?.full_name || "",
          email: activeSession.user.email,
          role: ROLES.CITIZEN, // Default role fallback
        },
      );
    } catch (err) {
      log.error("Failed to load profile:", err.message);
    }
  }, []);

  // Bootstrap session + subscribe to auth changes on mount
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const current = await authService.getSession();
        if (!mounted) return;
        setSession(current);
        await loadProfile(current);
      } catch (err) {
        log.error("Bootstrap failed:", err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    bootstrap();

    // Subscribe to state change channels from Supabase or mock listeners
    const unsubscribe = authService.onAuthStateChange(async (nextSession) => {
      log.debug("Auth state changed:", nextSession ? "signed-in" : "signed-out");
      setSession(nextSession);
      await loadProfile(nextSession);
      setLoading(false);
    });

    // Cleanup subscription upon unmount
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadProfile]);

  // Sign In (sends OTP email) wrapping action
  const signIn = useCallback(async (payload) => {
    const data = await authService.signIn(payload);
    return data;
  }, []);

  // Sign Up (sends OTP email with metadata) wrapping action
  const signUp = useCallback(async (payload) => {
    const data = await authService.signUp(payload);
    return data;
  }, []);

  // OTP Verification wrapping action
  const verifyOtp = useCallback(async (payload) => {
    const data = await authService.verifyOtp(payload);
    return data;
  }, []);

  // Log out wrapping action
  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  // Forgot password request wrapping action
  const requestPasswordReset = useCallback(
    (email) => authService.requestPasswordReset(email),
    [],
  );

  const role = profile?.role || null;

  // Memoize provider values to prevent unnecessary re-render triggers
  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      role,
      isAuthenticated: Boolean(session?.user),
      isAdmin: role === ROLES.ADMIN || role === ROLES.MODERATOR,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      verifyOtp,
      signOut,
      logout: signOut,
      requestPasswordReset,
    }),
    [session, profile, role, loading, signIn, signUp, verifyOtp, signOut, requestPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook useAuthContext
 * Exposes the Context parameters directly to consumer elements.
 */
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
}

