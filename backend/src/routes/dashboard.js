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
    // 1. Fetch main dashboard stats view from Supabase PostgreSQL
    const { data: statsData, error: statsError } = await supabase
      .from("dashboard_stats")
      .select("*")
      .limit(1);

    if (statsError) {
      log.error("Error fetching dashboard stats view:", statsError.message);
    }

    const row = statsData?.[0] || {};
    const totals = {
      total: Number(row.total_issues || 0),
      resolved: Number(row.resolved || 0),
      inProgress: Number(row.in_progress || 0),
      pending: Number(row.pending || 0),
      activeCitizens: Number(row.active_citizens || 0),
      resolutionRate: Number(row.resolution_rate || 0),
      avgResolutionDays: Number(row.avg_resolution_days || 0),
    };

    // Calculate dynamic community health score based on the resolution rate
    const healthScore = totals.total > 0 ? Math.round(totals.resolutionRate) : 100;

    // 2. Fetch categories distribution view
    const { data: categoryData, error: categoryError } = await supabase
      .from("issues_by_category")
      .select("*");

    if (categoryError) {
      log.error("Error fetching categories count:", categoryError.message);
    }

    // Prepare default empty category items mapping
    const defaultCategories = Object.keys(categoryMap).map(key => ({
      name: categoryMap[key],
      value: 0
    }));
    const byCategory = [...defaultCategories];
    
    // Merge actual database records into the category distribution array
    if (categoryData) {
      categoryData.forEach(row => {
        const displayName = categoryMap[row.category] || row.category;
        const existing = byCategory.find(c => c.name === displayName);
        if (existing) {
          existing.value = Number(row.count);
        } else {
          byCategory.push({ name: displayName, value: Number(row.count) });
        }
      });
    }

    // 3. Fetch status distribution view
    const { data: statusData, error: statusError } = await supabase
      .from("issues_by_status")
      .select("*");

    if (statusError) {
      log.error("Error fetching status count:", statusError.message);
    }

    // Prepare default empty status items mapping
    const defaultStatuses = Object.keys(statusMap).map(key => ({
      name: statusMap[key],
      value: 0
    }));
    const byStatus = [...defaultStatuses];
    
    // Merge actual database records into the status distribution array
    if (statusData) {
      statusData.forEach(row => {
        const displayName = statusMap[row.status] || row.status;
        const existing = byStatus.find(s => s.name === displayName);
        if (existing) {
          existing.value = Number(row.count);
        } else {
          byStatus.push({ name: displayName, value: Number(row.count) });
        }
      });
    }

    // 4. Fetch creation and resolution timestamps to build weekly activity logs dynamically
    const { data: issuesDates, error: datesError } = await supabase
      .from("issues")
      .select("created_at, resolved_at");

    if (datesError) {
      log.error("Error fetching trend issue dates:", datesError.message);
    }

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

    // Distribute issue records into their respective weeks based on date timestamps
    if (issuesDates) {
      issuesDates.forEach(issue => {
        const createdDate = new Date(issue.created_at);
        const resolvedDate = issue.resolved_at ? new Date(issue.resolved_at) : null;
        
        weeks.forEach(w => {
          if (createdDate >= w.start && createdDate < w.end) {
            w.reports++;
          }
          if (resolvedDate && resolvedDate >= w.start && resolvedDate < w.end) {
            w.resolved++;
          }
        });
      });
    }

    // Format weekly data list for chart visualization
    const trend = weeks.map(w => ({
      week: w.label,
      reports: w.reports,
      resolved: w.resolved
    }));

    // Send final compiled response structure
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
    // Query stats from the aggregate view
    const { data: statsData } = await supabase
      .from("dashboard_stats")
      .select("*")
      .limit(1);

    const row = statsData?.[0] || {};
    const total = Number(row.total_issues || 0);
    const resolved = Number(row.resolved || 0);
    const pending = Number(row.pending || 0);
    const inProgress = Number(row.in_progress || 0);
    const activeCitizens = Number(row.active_citizens || 0);
    const resolutionRate = Number(row.resolution_rate || 0);
    const avgResolutionDays = Number(row.avg_resolution_days || 0);

    // Query total registered users count for citizen engagement rates
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // 1. Average resolution time computation
    const averageResolutionTime = total > 0 && avgResolutionDays > 0 
      ? `${avgResolutionDays} days` 
      : "12 days"; // Fallback default if no resolved issues exist yet

    // 2. Compute citizen community engagement metric
    const communityEngagement = totalUsers > 0 
      ? `${Math.min(100, Math.round((activeCitizens / totalUsers) * 100))}%`
      : "94%";

    // 3. Issue verification rate computation
    const verifiedIssues = total - pending;
    const issueVerificationRate = total > 0 
      ? `${Math.round((verifiedIssues / total) * 100)}%`
      : "87%";

    // 4. Determine top issue category
    const { data: topCategoryData } = await supabase
      .from("issues_by_category")
      .select("*")
      .limit(1);
    
    const topIssueCategory = topCategoryData && topCategoryData.length > 0
      ? categoryMap[topCategoryData[0].category] || topCategoryData[0].category
      : "Potholes";

    // 5. Determine high priority/critical risk area from database logs
    const { data: topRiskIssue } = await supabase
      .from("issues")
      .select("location")
      .eq("risk_level", "critical")
      .order("priority", { ascending: false })
      .limit(1);

    let highestRiskArea = "Downtown District";
    if (topRiskIssue && topRiskIssue.length > 0 && topRiskIssue[0].location) {
      highestRiskArea = topRiskIssue[0].location;
    } else {
      const { data: anyRiskIssue } = await supabase
        .from("issues")
        .select("location")
        .order("priority", { ascending: false })
        .limit(1);
      if (anyRiskIssue && anyRiskIssue.length > 0 && anyRiskIssue[0].location) {
        highestRiskArea = anyRiskIssue[0].location;
      }
    }

    // Assemble metrics packet
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

