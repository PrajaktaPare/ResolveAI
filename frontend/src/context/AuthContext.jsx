import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import * as authService from "@/services/authService";
import { isSupabaseConfigured } from "@/config/supabase";
import { ROLES } from "@/utils/constants";
import { logger } from "@/utils/logger";

const log = logger.child("auth-context");

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
          role: ROLES.CITIZEN,
        },
      );
    } catch (err) {
      log.error("Failed to load profile:", err.message);
    }
  }, []);

  // Bootstrap session + subscribe to auth changes.
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

    const unsubscribe = authService.onAuthStateChange(async (nextSession) => {
      log.debug("Auth state changed:", nextSession ? "signed-in" : "signed-out");
      setSession(nextSession);
      await loadProfile(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (credentials) => {
    const data = await authService.signIn(credentials);
    return data;
  }, []);

  const signUp = useCallback(async (payload) => {
    const data = await authService.signUp(payload);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const requestPasswordReset = useCallback(
    (email) => authService.requestPasswordReset(email),
    [],
  );

  const role = profile?.role || null;

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
      signOut,
      logout: signOut,
      requestPasswordReset,
    }),
    [session, profile, role, loading, signIn, signUp, signOut, requestPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
}
