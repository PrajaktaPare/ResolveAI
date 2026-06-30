/**
 * @file dashboardService.js
 * @description Service layer for retrieving dashboard impact metrics and charts telemetry.
 * Communicates with the Express backend, falling back to mock datasets if endpoints are offline.
 */

import { api } from "@/config/api";
import { logger } from "@/utils/logger";

/**
 * buildMockStats
 * Computes and returns fallback mockup datasets to ensure UI is functional in offline configurations.
 * 
 * @returns {Object} Static data matching standard metrics configurations.
 */
function buildMockStats() {
  return {
    totals: {
      total: 1284,
      resolved: 912,
      inProgress: 214,
      pending: 158,
      resolutionRate: 71,
      avgResolutionDays: 4.2,
      activeCitizens: 3460,
    },
    healthScore: 78,
    byCategory: [
      { category: "Roads", count: 342 },
      { category: "Sanitation", count: 268 },
      { category: "Water", count: 197 },
      { category: "Electricity", count: 176 },
      { category: "Streetlights", count: 154 },
      { category: "Other", count: 147 },
    ],
    byStatus: [
      { status: "Resolved", count: 912 },
      { status: "In Progress", count: 214 },
      { status: "Pending", count: 158 },
    ],
    trend: [
      { month: "Jan", reported: 180, resolved: 120 },
      { month: "Feb", reported: 210, resolved: 165 },
      { month: "Mar", reported: 240, resolved: 190 },
      { month: "Apr", reported: 198, resolved: 172 },
      { month: "May", reported: 256, resolved: 205 },
      { month: "Jun", reported: 200, resolved: 188 },
    ],
  };
}

// Service registry holding dashboard fetching methods
export const dashboardService = {
  /**
   * getStats
   * Fetches general metrics and category count splits for visual dashboard panels.
   */
  async getStats() {
    try {
      const { data } = await api.get("/dashboard/stats");
      return data?.data ?? data;
    } catch (error) {
      logger.warn("Dashboard API unavailable, using mock data fallback:", error.message);
      return buildMockStats();
    }
  },
};

