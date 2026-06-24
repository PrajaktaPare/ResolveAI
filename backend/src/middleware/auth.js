/**
 * @file auth.js
 * @description Authentication and authorization middlewares.
 * Uses Supabase authentication tokens to verify and attach user profiles/roles to HTTP requests.
 */

import { supabase } from "../config/supabase.js";

/**
 * authenticate
 * Middleware to verify that a user is authenticated via a Supabase JWT.
 * Reads the Authorization Bearer token from headers, fetches user from Supabase auth,
 * queries public.users database profile, and appends details to req.user.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export async function authenticate(req, res, next) {
  try {
    // 1. Verify existence of authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    // 2. Extract JWT token part
    const token = authHeader.split(" ")[1];
    
    // 3. Verify token integrity and retrieve base user credentials from Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }

    // 4. Query custom profile and role information from the database public.profiles table
    const { data: publicUser, error: dbError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 5. Build user context structure and attach it to the request object
    req.user = {
      id: user.id,
      email: user.email,
      // Prioritize database name, then auth metadata, else split the email prefix
      name: publicUser?.full_name || user.user_metadata?.full_name || user.email.split("@")[0],
      role: publicUser?.role || "citizen", // Default role fallback
      reputation_score: publicUser?.reputation_score || 0,
      location: publicUser?.location || null,
      avatar_url: publicUser?.avatar_url || null,
      bio: publicUser?.bio || null,
      created_at: publicUser?.created_at || user.created_at,
      updated_at: publicUser?.updated_at || user.created_at,
    };

    // Proceed to target route handler
    next();
  } catch (error) {
    console.error("[Auth Middleware] Error during verification:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * requireAdmin
 * Authorization guard middleware requiring administrative or moderator privileges.
 * Blocks standard citizen roles from accessing management endpoints.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export function requireAdmin(req, res, next) {
  try {
    // 1. Check if user credentials have been attached by previous middleware
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 2. Enforce role checking
    if (req.user.role !== "admin" && req.user.role !== "moderator") {
      return res.status(403).json({ error: "Forbidden - Administrative privileges required" });
    }

    // Proceed to administrative route handler
    next();
  } catch (error) {
    console.error("[Admin Middleware] Error during authorization check:", error);
    res.status(403).json({ error: "Forbidden" });
  }
}

