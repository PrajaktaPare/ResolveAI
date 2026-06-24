/**
 * @file issues.js
 * @description Routing endpoints for managing reported civic issues.
 * Implements listing with dynamic filters, location-mapping arrays, single issue retrieval,
 * report creation with multiple media uploads, AI visual categorizations, nearby duplicate warning checks,
 * community verification triggers, and comments.
 */

import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";
import { geminiService } from "../services/gemini.service.js";
import { logger } from "../utils/logger.js";

const router = express.Router();
const log = logger.child("issues-routes");

// Setup Multer to store uploaded media files in memory buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

/**
 * calculatePriority
 * Calculates a dynamic 0-100 priority score based on severity, verification count, risk level, and age.
 */
function calculatePriority(severity, verificationCount, riskLevel, createdAt = new Date()) {
  const baseSeverity = Number(severity || 50);
  const supportWeight = Number(verificationCount || 0) * 4;
  
  let riskWeight = 10;
  if (riskLevel === "critical") riskWeight = 30;
  else if (riskLevel === "high") riskWeight = 20;
  else if (riskLevel === "low") riskWeight = 0;

  // Reduce priority slowly over time to prevent stale issues from locking top slots
  const ageInDays = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));
  const ageDecay = Math.min(20, ageInDays * 0.2);

  const finalScore = Math.round(baseSeverity * 0.5 + supportWeight + riskWeight - ageDecay);
  return Math.min(100, Math.max(0, finalScore));
}

/**
 * GET /api/issues/check-duplicate
 * Checks for potential duplicate issues within a 200-meter radius using PostGIS.
 */
router.get("/check-duplicate", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and Longitude are required query parameters" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Call find_nearby_issues RPC function
    const { data: duplicates, error } = await supabase.rpc("find_nearby_issues", {
      lat,
      lng,
      max_dist_meters: 200.0,
    });

    if (error) {
      log.error("Duplicate detection RPC query error:", error.message);
      return res.status(500).json({ error: "Failed to perform duplicate check" });
    }

    res.json({
      hasDuplicates: duplicates && duplicates.length > 0,
      duplicates: duplicates || [],
    });
  } catch (error) {
    log.error("Failed to check duplicate issues:", error);
    res.status(500).json({ error: "Failed to check duplicate issues" });
  }
});

/**
 * GET /api/issues
 * List all civic issues with optional filtering by category and status, supporting sorting configurations.
 */
router.get("/", async (req, res) => {
  try {
    const { category, status, sort } = req.query;

    // Start Supabase query joining reporting user full name and role
    let query = supabase.from("issues").select("*, profiles(full_name, role), issue_media(*), ai_insights(*)");

    // Apply category filter if specified and is not "all"
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Apply status filter if specified and is not "all"
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply sorting rules (defaulting to newest issues first)
    if (sort === "priority") {
      query = query.order("priority", { ascending: false });
    } else if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: issues, error } = await query;

    if (error) {
      log.error("Supabase fetch issues error:", error.message);
      return res.status(500).json({ error: "Failed to fetch issues from database" });
    }

    // Format fields match frontend camelCase naming conventions
    const formattedIssues = issues.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      category: i.category,
      status: i.status,
      riskLevel: i.risk_level,
      priority: i.priority,
      location: i.location,
      latitude: i.latitude,
      longitude: i.longitude,
      upvotes: i.upvotes,
      commentsCount: i.comments_count,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      authorName: i.profiles?.full_name || "Citizen",
      media: i.issue_media || [],
      aiInsights: i.ai_insights?.[0] || null,
      canonicalIssueId: i.canonical_issue_id || null,
    }));

    res.json({
      issues: formattedIssues,
      total: formattedIssues.length,
    });
  } catch (error) {
    log.error("Failed to fetch issues:", error);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

/**
 * GET /api/issues/map/data (and fallback /map)
 * Fetch issue coordinates and essential details for Leaflet map markers.
 */
router.get(["/map/data", "/map"], async (req, res) => {
  try {
    const { category, status } = req.query;

    let query = supabase
      .from("issues")
      .select("id, title, description, category, status, risk_level, location, latitude, longitude, upvotes, created_at, canonical_issue_id");

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: issues, error } = await query;

    if (error) {
      log.error("Map query error:", error.message);
      return res.status(500).json({ error: "Failed to fetch map data" });
    }

    const formattedIssues = issues.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      category: i.category,
      status: i.status,
      riskLevel: i.risk_level,
      location: i.location,
      latitude: i.latitude,
      longitude: i.longitude,
      upvotes: i.upvotes,
      createdAt: i.created_at,
      canonicalIssueId: i.canonical_issue_id || null,
    }));

    res.json({
      issues: formattedIssues,
      total: formattedIssues.length,
    });
  } catch (error) {
    log.error("Failed to fetch map data:", error);
    res.status(500).json({ error: "Failed to fetch map data" });
  }
});

/**
 * GET /api/issues/:id
 * Retrieve details for a single issue by ID.
 */
router.get("/:id", async (req, res) => {
  try {
    const { data: issue, error } = await supabase
      .from("issues")
      .select("*, profiles(full_name), issue_media(*), ai_insights(*), issue_verifications(*)")
      .eq("id", req.params.id)
      .single();

    if (error || !issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Compile verifications counts
    const verifications = issue.issue_verifications || [];
    const verifyCount = verifications.filter(v => v.type === 'verify').length;
    const supportCount = verifications.filter(v => v.type === 'support').length;
    const duplicateCount = verifications.filter(v => v.type === 'duplicate').length;
    const rejectCount = verifications.filter(v => v.type === 'reject').length;

    res.json({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      status: issue.status,
      riskLevel: issue.risk_level,
      priority: issue.priority,
      location: issue.location,
      latitude: issue.latitude,
      longitude: issue.longitude,
      upvotes: issue.upvotes,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      authorName: issue.profiles?.full_name || "Citizen",
      media: issue.issue_media || [],
      aiInsights: issue.ai_insights?.[0] || null,
      canonicalIssueId: issue.canonical_issue_id || null,
      verifications: {
        verify: verifyCount,
        support: supportCount,
        duplicate: duplicateCount,
        reject: rejectCount
      }
    });
  } catch (error) {
    log.error("Failed to fetch issue details:", error);
    res.status(500).json({ error: "Failed to fetch issue details" });
  }
});

/**
 * POST /api/issues
 * Create a new civic issue report. Supports multiple file uploads.
 */
router.post("/", authenticate, upload.array("media"), async (req, res) => {
  try {
    const { title, description, category, riskLevel, latitude, longitude, canonicalIssueId } = req.body;
    const userId = req.user.id;
    const files = req.files || [];

    if (!title || !description || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Upload files to Supabase Storage and compile urls
    const uploadedMedia = [];
    for (const file of files) {
      const extension = file.originalname.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
      const filePath = `${userId}/${fileName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("issue-media")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: "3600",
        });

      if (uploadErr) {
        log.error("Supabase storage upload error:", uploadErr.message);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("issue-media")
        .getPublicUrl(filePath);

      uploadedMedia.push({
        media_type: file.mimetype,
        public_url: publicUrl,
      });
    }

    // 2. Perform Gemini Vision API analysis if an image is provided
    let aiResults = null;
    const imageFile = files.find(f => f.mimetype.startsWith("image/"));
    
    if (imageFile) {
      log.info("Sending uploaded image to Gemini for analysis...");
      aiResults = await geminiService.analyzeImage(imageFile.buffer, imageFile.mimetype);
    } else {
      log.info("No image uploaded. Generating mock resolution agent fallback...");
      aiResults = await geminiService.generateResolutionAgent(title, description, category || "other", 50);
    }

    // Define initial severity and priority
    const severityScore = aiResults?.severity || 50;
    const initialPriority = calculatePriority(severityScore, 0, riskLevel || "medium");

    // 3. Create issue row in Database
    const { data: newIssue, error: issueErr } = await supabase
      .from("issues")
      .insert({
        title,
        description,
        category: aiResults?.category || category || "other",
        risk_level: riskLevel || "medium",
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location: `Location (${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)})`,
        user_id: userId,
        status: "reported",
        priority: initialPriority,
        canonical_issue_id: canonicalIssueId || null,
      })
      .select()
      .single();

    if (issueErr) {
      log.error("Failed to insert issue:", issueErr.message);
      return res.status(500).json({ error: "Failed to save issue report" });
    }

    // 4. Save media records in database
    if (uploadedMedia.length > 0) {
      const mediaInserts = uploadedMedia.map(m => ({
        issue_id: newIssue.id,
        media_type: m.media_type,
        public_url: m.public_url,
      }));
      await supabase.from("issue_media").insert(mediaInserts);
    }

    // 5. Save AI Insights report
    const aiInsightPayload = {
      issue_id: newIssue.id,
      category: aiResults?.category || category || "other",
      severity: severityScore,
      confidence: aiResults?.confidence || 90.0,
      summary: aiResults?.summary || description,
      impact: aiResults?.impact || "",
      suggested_resolution: aiResults?.suggested_resolution || "",
      recommended_authority: aiResults?.recommended_authority || "Public Works Department",
      recommended_action: aiResults?.recommended_action || "Deploy local repair unit.",
      estimated_urgency: aiResults?.estimated_urgency || "Medium",
      mitigation_suggestions: aiResults?.mitigation_suggestions || "Proceed with caution in area."
    };

    await supabase.from("ai_insights").insert(aiInsightPayload);

    // 6. Broadcast notification to other users in area (simple mock notifications)
    const notificationPayload = {
      user_id: userId,
      issue_id: newIssue.id,
      type: "issue_created",
      title: "New Issue Reported Nearby",
      message: `A new civic issue '${title}' has been submitted close to your region.`,
      is_read: false
    };
    await supabase.from("notifications").insert(notificationPayload);

    res.status(201).json({
      message: "Issue created successfully",
      issue: {
        ...newIssue,
        aiInsights: aiInsightPayload,
        media: uploadedMedia,
      },
    });
  } catch (error) {
    log.error("Failed to create issue:", error);
    res.status(500).json({ error: "Failed to create issue" });
  }
});

/**
 * PUT /api/issues/:id
 * Update status or priority of a reported issue (requires moderator/admin checks for status updates).
 */
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { status, riskLevel, priority, canonicalIssueId, assignedTo } = req.body;
    const issueId = req.params.id;

    // Check permissions if status, canonical ID, or assignment is updated
    if ((status || canonicalIssueId || assignedTo !== undefined) && req.user.role !== "admin" && req.user.role !== "moderator") {
      return res.status(403).json({ error: "Only admins or moderators can perform moderation actions" });
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (riskLevel) updateFields.risk_level = riskLevel;
    if (priority !== undefined) updateFields.priority = priority;
    if (canonicalIssueId !== undefined) updateFields.canonical_issue_id = canonicalIssueId;
    if (assignedTo !== undefined) updateFields.assigned_to = assignedTo || null;
    updateFields.updated_at = new Date().toISOString();

    const { data: updatedIssue, error } = await supabase
      .from("issues")
      .update(updateFields)
      .eq("id", issueId)
      .select()
      .single();

    if (error) {
      log.error("Update issue db error:", error.message);
      return res.status(500).json({ error: "Failed to update issue" });
    }

    // Trigger notification to the reporter of the issue about status update
    const notificationPayload = {
      user_id: updatedIssue.user_id,
      issue_id: updatedIssue.id,
      type: "status_updated",
      title: "Issue Status Updated",
      message: `Your issue '${updatedIssue.title}' is now marked as: ${updatedIssue.status}.`,
      is_read: false
    };
    await supabase.from("notifications").insert(notificationPayload);

    res.json({
      message: "Issue updated successfully",
      issue: updatedIssue,
    });
  } catch (error) {
    log.error("Failed to update issue:", error);
    res.status(500).json({ error: "Failed to update issue" });
  }
});

/**
 * POST /api/issues/:id/verify
 * Record a community verification ('verify', 'support', 'duplicate', 'reject').
 */
router.post("/:id/verify", authenticate, async (req, res) => {
  try {
    const issueId = req.params.id;
    const userId = req.user.id;
    const { type } = req.body; // 'verify' | 'support' | 'duplicate' | 'reject'

    if (!type || !['verify', 'support', 'duplicate', 'reject'].includes(type)) {
      return res.status(400).json({ error: "Valid verification type is required" });
    }

    // 1. Insert unique verification row
    const { error: verifyErr } = await supabase
      .from("issue_verifications")
      .insert({
        issue_id: issueId,
        user_id: userId,
        type,
      });

    if (verifyErr) {
      if (verifyErr.code === "23505") { // UNIQUE CONSTRAINT VIOLATION
        return res.status(400).json({ error: `You have already submitted a '${type}' verification for this issue.` });
      }
      log.error("Failed to insert verification record:", verifyErr.message);
      return res.status(500).json({ error: "Failed to submit verification" });
    }

    // 2. Fetch the target issue details to recalculate score
    const { data: issue } = await supabase.from("issues").select("*").eq("id", issueId).single();
    
    // Query total verification counts
    const { data: verifications } = await supabase
      .from("issue_verifications")
      .select("type")
      .eq("issue_id", issueId);

    const supportCount = verifications.filter(v => v.type === 'support' || v.type === 'verify').length;
    const duplicateCount = verifications.filter(v => v.type === 'duplicate').length;
    const rejectCount = verifications.filter(v => v.type === 'reject').length;

    // Fetch AI insights to find severity score
    const { data: aiInsight } = await supabase.from("ai_insights").select("severity").eq("issue_id", issueId).limit(1);
    const severity = aiInsight?.[0]?.severity || 50;

    // 3. Recalculate priority score dynamically
    const newPriority = calculatePriority(severity, supportCount, issue.risk_level, issue.created_at);

    // Update issues priority and upvotes counters
    await supabase
      .from("issues")
      .update({
        priority: newPriority,
        upvotes: supportCount,
      })
      .eq("id", issueId);

    // 4. Notify creator
    const notificationPayload = {
      user_id: issue.user_id,
      issue_id: issueId,
      type: `issue_${type}`,
      title: `Issue ${type === 'verify' ? 'Verified' : type === 'support' ? 'Supported' : type === 'duplicate' ? 'Flagged Duplicate' : 'Rejected'}`,
      message: `Your reported issue '${issue.title}' received a new community '${type}' log.`,
      is_read: false
    };
    await supabase.from("notifications").insert(notificationPayload);

    res.json({
      message: `Verification of type '${type}' registered successfully`,
      newPriority,
      supportCount,
    });
  } catch (error) {
    log.error("Failed to record verification:", error);
    res.status(500).json({ error: "Failed to record verification" });
  }
});

/**
 * POST /api/issues/:id/comments
 * Add comment to an issue.
 */
router.post("/:id/comments", authenticate, async (req, res) => {
  try {
    const issueId = req.params.id;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        issue_id: issueId,
        user_id: userId,
        content: text,
      })
      .select("*, profiles(full_name, avatar_url)")
      .single();

    if (error) {
      log.error("Create comment db error:", error.message);
      return res.status(500).json({ error: "Failed to post comment" });
    }

    res.status(201).json({
      message: "Comment posted successfully",
      comment: {
        id: comment.id,
        issueId: comment.issue_id,
        text: comment.content,
        author: comment.profiles?.full_name || req.user.name,
        avatarUrl: comment.profiles?.avatar_url || null,
        createdAt: comment.created_at,
      },
    });
  } catch (error) {
    log.error("Failed to post comment:", error);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

/**
 * GET /api/issues/:id/comments
 * Get comments for an issue joining user profile data
 */
router.get("/:id/comments", async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from("comments")
      .select("*, profiles(full_name, avatar_url)")
      .eq("issue_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) {
      log.error("Get comments db error:", error.message);
      return res.status(500).json({ error: "Failed to fetch comments" });
    }

    const formattedComments = comments.map((c) => ({
      id: c.id,
      issueId: c.issue_id,
      text: c.content,
      author: c.profiles?.full_name || "Unknown Citizen",
      avatarUrl: c.profiles?.avatar_url || null,
      createdAt: c.created_at,
    }));

    res.json({
      comments: formattedComments,
      total: formattedComments.length,
    });
  } catch (error) {
    log.error("Failed to fetch comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

export default router;
