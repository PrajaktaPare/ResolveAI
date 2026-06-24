/**
 * @file dashboard.js
 * @description Routing endpoints for retrieval of analytics, trend metrics, and geospatial heatmap data.
 * Queries Supabase database views and handles fallback mock parameters for missing metrics.
 */

import express from "express";
import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";

const router = express.Router();
const log = logger.child("dashboard-routes");

// Display name mapping for UI category keys
const categoryMap = {
  pothole: "Pothole",
  garbage: "Garbage",
  water_leakage: "Water Leak",
  broken_streetlight: "Streetlight",
  open_manhole: "Open Manhole",
  road_damage: "Road Damage",
  public_infrastructure_damage: "Infrastructure",
  other: "Other"
};

// Display name mapping for UI status keys
const statusMap = {
  reported: "Reported",
  verified: "Verified",
  prioritized: "Prioritized",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
  duplicate: "Duplicate"
};

/**
 * GET /api/dashboard/stats
 * Queries aggregate views for issue totals, category splits, state values, and compiles a weekly timeline.
 */
router.get("/stats", async (req, res) => {
  try {
    const tStart = Date.now();

    // Query issues table directly in a single operation
    const { data: issuesRaw, error: issuesError } = await supabase
      .from("issues")
      .select("category, status, user_id, created_at, resolved_at");

    if (issuesError) {
      log.error("Failed to retrieve issues for dashboard stats:", issuesError.message);
      return res.status(500).json({ error: "Failed to fetch dashboard stats from database" });
    }

    const total = issuesRaw.length;
    let resolvedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;
    const uniqueUsers = new Set();
    let totalResolutionTimeMs = 0;
    let resolvedWithTimeCount = 0;

    const categoryCounts = {};
    const statusCounts = {};

    // Initialize category map keys to 0
    Object.keys(categoryMap).forEach(key => {
      categoryCounts[categoryMap[key]] = 0;
    });
    // Initialize status map keys to 0
    Object.keys(statusMap).forEach(key => {
      statusCounts[statusMap[key]] = 0;
    });

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    // Generate weekly date ranges for the past 6 weeks
    const weeks = Array.from({ length: 6 }).map((_, idx) => {
      const end = new Date(now.getTime() - idx * oneWeek);
      const start = new Date(end.getTime() - oneWeek);
      return {
        start,
        end,
        label: `Week ${6 - idx}`,
        reports: 0,
        resolved: 0
      };
    }).reverse();

    issuesRaw.forEach(issue => {
      // 1. Count totals
      if (issue.status === 'resolved') {
        resolvedCount++;
      } else if (issue.status === 'in_progress') {
        inProgressCount++;
      } else if (issue.status === 'reported') {
        pendingCount++;
      }
      
      if (issue.user_id) {
        uniqueUsers.add(issue.user_id);
      }

      // 2. Compute average resolution days
      const createdDate = new Date(issue.created_at);
      const resolvedDate = issue.resolved_at ? new Date(issue.resolved_at) : null;
      
      if (resolvedDate) {
        const diffTime = resolvedDate.getTime() - createdDate.getTime();
        if (diffTime >= 0) {
          totalResolutionTimeMs += diffTime;
          resolvedWithTimeCount++;
        }
      }

      // 3. Category count aggregation
      const categoryName = categoryMap[issue.category] || issue.category;
      if (categoryName) {
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      }

      // 4. Status count aggregation
      const statusName = statusMap[issue.status] || issue.status;
      if (statusName) {
        statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
      }

      // 5. Weekly trend aggregation
      weeks.forEach(w => {
        if (createdDate >= w.start && createdDate < w.end) {
          w.reports++;
        }
        if (resolvedDate && resolvedDate >= w.start && resolvedDate < w.end) {
          w.resolved++;
        }
      });
    });

    const resolutionRate = total > 0 ? Number(((resolvedCount / total) * 100).toFixed(2)) : 0;
    const avgResolutionDays = resolvedWithTimeCount > 0 
      ? Number((totalResolutionTimeMs / (resolvedWithTimeCount * oneDay)).toFixed(1)) 
      : 0;

    const totals = {
      total,
      resolved: resolvedCount,
      inProgress: inProgressCount,
      pending: pendingCount,
      activeCitizens: uniqueUsers.size,
      resolutionRate,
      avgResolutionDays,
    };

    // Community health score represents resolution rate (or 100 if no issues exist)
    const healthScore = total > 0 ? Math.round(resolutionRate) : 100;

    const byCategory = Object.keys(categoryCounts).map(name => ({
      name,
      value: categoryCounts[name]
    })).sort((a, b) => b.value - a.value);

    const byStatus = Object.keys(statusCounts).map(name => ({
      name,
      value: statusCounts[name]
    })).sort((a, b) => b.value - a.value);

    const trend = weeks.map(w => ({
      week: w.label,
      reports: w.reports,
      resolved: w.resolved
    }));

    log.info(`Dashboard stats processed in ${Date.now() - tStart} ms`);

    res.json({
      totals,
      healthScore,
      byCategory,
      byStatus,
      trend
    });
  } catch (error) {
    log.error("Failed to fetch dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

/**
 * GET /api/dashboard/metrics
 * Returns specialized health, verification rate, top category, and engagement metrics.
 */
router.get("/metrics", async (req, res) => {
  try {
    const tStart = Date.now();

    // Query issues list and profiles count in parallel
    const [
      { data: issuesRaw, error: issuesError },
      { count: totalUsers, error: usersError }
    ] = await Promise.all([
      supabase.from("issues").select("status, category, risk_level, priority, location, created_at, resolved_at, user_id"),
      supabase.from("profiles").select("*", { count: "exact", head: true })
    ]);

    if (issuesError) {
      log.error("Failed to retrieve issues for metrics:", issuesError.message);
      return res.status(500).json({ error: "Failed to fetch metrics" });
    }

    const total = issuesRaw.length;
    let resolvedCount = 0;
    let pendingCount = 0;
    const activeCitizens = new Set();
    let totalResolutionTimeMs = 0;
    let resolvedWithTimeCount = 0;

    const categoryCounts = {};
    let topRiskIssue = null;
    let topPriorityIssue = null;

    issuesRaw.forEach(i => {
      if (i.status === 'resolved') {
        resolvedCount++;
      } else if (i.status === 'reported') {
        pendingCount++;
      }

      if (i.user_id) {
        activeCitizens.add(i.user_id);
      }

      const createdDate = new Date(i.created_at);
      const resolvedDate = i.resolved_at ? new Date(i.resolved_at) : null;
      if (resolvedDate) {
        const diffTime = resolvedDate.getTime() - createdDate.getTime();
        if (diffTime >= 0) {
          totalResolutionTimeMs += diffTime;
          resolvedWithTimeCount++;
        }
      }

      // Count categories
      const categoryName = categoryMap[i.category] || i.category;
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;

      // Find top risk issue (critical risk_level)
      if (i.risk_level === 'critical') {
        if (!topRiskIssue || i.priority > topRiskIssue.priority) {
          topRiskIssue = i;
        }
      }
      
      // Find top priority issue generally
      if (!topPriorityIssue || i.priority > topPriorityIssue.priority) {
        topPriorityIssue = i;
      }
    });

    const avgResolutionDays = resolvedWithTimeCount > 0 
      ? Math.round(totalResolutionTimeMs / (resolvedWithTimeCount * 24 * 60 * 60 * 1000))
      : 12;

    const averageResolutionTime = total > 0 && avgResolutionDays > 0 
      ? `${avgResolutionDays} days` 
      : "12 days";

    const communityEngagement = totalUsers > 0 
      ? `${Math.min(100, Math.round((activeCitizens.size / totalUsers) * 100))}%`
      : "94%";

    const verifiedIssues = total - pendingCount;
    const issueVerificationRate = total > 0 
      ? `${Math.round((verifiedIssues / total) * 100)}%`
      : "87%";

    // Sort categories to get top category
    const sortedCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
    const topIssueCategory = sortedCategories.length > 0 ? sortedCategories[0] : "Potholes";

    let highestRiskArea = "Downtown District";
    if (topRiskIssue && topRiskIssue.location) {
      highestRiskArea = topRiskIssue.location;
    } else if (topPriorityIssue && topPriorityIssue.location) {
      highestRiskArea = topPriorityIssue.location;
    }

    log.info(`Dashboard metrics processed in ${Date.now() - tStart} ms`);

    const metrics = {
      averageResolutionTime,
      communityEngagement,
      issueVerificationRate,
      topIssueCategory,
      highestRiskArea,
      nextScheduledUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    res.json(metrics);
  } catch (error) {
    log.error("Failed to fetch metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

/**
 * GET /api/dashboard/heatmap
 * Retrieves geolocation points and upvotes from issues table for interactive heatmap mapping.
 */
router.get("/heatmap", async (req, res) => {
  try {
    // Query coordinate values from the issues table
    const { data: issuesCoords, error } = await supabase
      .from("issues")
      .select("latitude, longitude, upvotes")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) {
      log.error("Heatmap query error:", error.message);
      return res.status(500).json({ error: "Failed to fetch heatmap data" });
    }

    // Format query results to map layout standards
    const hotspots = (issuesCoords || []).map(i => ({
      lat: Number(i.latitude),
      lng: Number(i.longitude),
      intensity: Math.min(100, Math.max(10, Number(i.upvotes || 0) * 10 + 10))
    }));

    // Inject fallback hotspots in case of empty database queries for demo mapping
    if (hotspots.length === 0) {
      hotspots.push(
        { lat: 40.7128, lng: -74.006, intensity: 85 },
        { lat: 40.7282, lng: -74.0076, intensity: 72 },
        { lat: 40.7489, lng: -73.968, intensity: 64 }
      );
    }

    res.json({ hotspots });
  } catch (error) {
    log.error("Failed to fetch heatmap data:", error);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
});

export default router;

