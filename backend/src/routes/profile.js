/**
 * @file profile.js
 * @description Routing endpoints for managing user profile information and individual statistics.
 * Links profile tables to user identity context from the authentication middleware.
 */

import express from "express";
import { authenticate } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

/**
 * GET /api/auth/profile
 * Get the current user's profile details from the public.users database.
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch latest profile details from the PostgreSQL 'profiles' table
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      // Fallback: If profile row is not yet synchronized, return the decoded JWT payload parameters
      return res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        reputationScore: req.user.reputation_score || 0,
        location: req.user.location,
        createdAt: req.user.created_at,
        updatedAt: req.user.updated_at,
      });
    }

    // Return the authenticated user profile fields
    res.json({
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      reputationScore: profile.reputation_score || 0,
      location: profile.location || null,
      bio: profile.bio || null,
      avatarUrl: profile.avatar_url || null,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    });
  } catch (error) {
    console.error("[Backend] Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * PUT /api/auth/profile
 * Update profile data (name, location, bio) for the authenticated user.
 */
router.put("/", authenticate, async (req, res) => {
  try {
    const { name, location, bio } = req.body;
    const userId = req.user.id;

    // Validate that profile name is not completely empty
    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: "Name cannot be empty" });
    }

    // Update fields in public.profiles table in Supabase
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        location: location,
        bio: bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("[Backend] Database profile update failed:", error.message);
      return res.status(500).json({ error: "Failed to update profile in database" });
    }

    // Return the updated profile object
    res.json({
      id: updatedProfile.id,
      name: updatedProfile.full_name,
      email: updatedProfile.email,
      role: updatedProfile.role,
      location: updatedProfile.location || null,
      bio: updatedProfile.bio || null,
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
    });
  } catch (error) {
    console.error("[Backend] Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * GET /api/auth/profile/stats
 * Calculate and return issue reporting stats specifically for the logged-in user.
 */
router.get("/stats", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Query count of total issues reported by the user
    const { count: totalReports, error: reportsErr } = await supabase
      .from("issues")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // 2. Query count of resolved issues reported by the user
    const { count: resolvedReports, error: resolvedErr } = await supabase
      .from("issues")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "resolved");

    // 3. Retrieve upvotes column of all issues reported by the user to compute cumulative score
    const { data: upvoteData, error: upvotesErr } = await supabase
      .from("issues")
      .select("upvotes")
      .eq("user_id", userId);

    // Sum all upvotes across the user's issues array
    const totalUpvotes = upvoteData
      ? upvoteData.reduce((acc, curr) => acc + (curr.upvotes || 0), 0)
      : 0;

    // 4. Retrieve timestamp of user's most recent issue submission
    const { data: lastReport, error: lastReportErr } = await supabase
      .from("issues")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastReportDate = lastReport && lastReport.length > 0
      ? lastReport[0].created_at
      : null;

    // Return the aggregated metrics
    res.json({
      totalReports: totalReports || 0,
      resolvedReports: resolvedReports || 0,
      totalUpvotes: totalUpvotes,
      lastReportDate: lastReportDate,
    });
  } catch (error) {
    console.error("[Backend] Stats fetch error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/**
 * PUT /api/auth/profile/:id/role
 * Update user role (admin only).
 */
router.put("/:id/role", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - Administrative privileges required" });
    }

    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!role || !["citizen", "moderator", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", targetUserId)
      .select()
      .single();

    if (error) {
      console.error("[Backend] Failed to update user role:", error.message);
      return res.status(500).json({ error: "Failed to update user role" });
    }

    res.json({ message: "Role updated successfully", user: updatedProfile });
  } catch (err) {
    console.error("[Backend] Role update error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

export default router;

