/**
 * @file health.js
 * @description Health status endpoint to monitor API server operational metrics.
 */

import express from "express";

const router = express.Router();

/**
 * GET /api/health
 * Returns the status, server timestamp, and active execution uptime.
 */
router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // Node process runtime duration in seconds
  });
});

export default router;

