/**
 * @file notifications.js
 * @description Routing endpoints for retrieving and managing user alerts/notifications.
 */

import express from "express";
import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";

const router = express.Router();
const log = logger.child("notifications-routes");

/**
 * GET /api/notifications
 * Lists all notifications for the authenticated user, ordered by creation date.
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      log.error("Failed to query notifications:", error.message);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }

    res.json({ notifications });
  } catch (error) {
    log.error("Failed to fetch notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * POST /api/notifications/:id/read
 * Marks a specific notification as read.
 */
router.post("/:id/read", async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      log.error("Failed to update notification status:", error.message);
      return res.status(500).json({ error: "Failed to mark notification as read" });
    }

    res.json({ message: "Notification marked as read successfully" });
  } catch (error) {
    log.error("Failed to update notification:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

/**
 * POST /api/notifications/read-all
 * Marks all notifications for the authenticated user as read.
 */
router.post("/read-all", async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      log.error("Failed to update all notifications:", error.message);
      return res.status(500).json({ error: "Failed to mark all as read" });
    }

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    log.error("Failed to update notifications:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

export default router;
