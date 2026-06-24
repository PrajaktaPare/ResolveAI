/**
 * @file auth.js
 * @description Authentication routing controllers.
 * Currently serves mock authentication responses; ready to be integrated with Supabase auth processes.
 */

import express from "express";
import { logger } from "../utils/logger.js";

const router = express.Router();
const log = logger.child("auth-routes");

/**
 * POST /api/auth/register
 * Register a new user profile.
 * Expects { email, password, fullName } in body.
 */
router.post("/register", (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate request parameters
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    log.info(`User registration attempt: ${email}`);

    // Return mock response representing successfully created user
    res.json({
      user: {
        id: Math.random().toString(36).substr(2, 9),
        email,
        full_name: fullName || email.split("@")[0],
        role: "citizen",
        created_at: new Date().toISOString(),
      },
      message: "User registered successfully (mock)",
    });
  } catch (error) {
    log.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * POST /api/auth/login
 * Authenticate credentials and return user details with access/refresh tokens.
 * Expects { email, password } in body.
 */
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request parameters
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    log.info(`User login attempt: ${email}`);

    // Return mock successful session keys and profile data
    res.json({
      user: {
        id: Math.random().toString(36).substr(2, 9),
        email,
        full_name: "John Citizen",
        role: "citizen",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      session: {
        access_token: `mock_token_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        expires_in: 3600,
      },
      message: "User logged in successfully (mock)",
    });
  } catch (error) {
    log.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate the active user session.
 */
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

/**
 * POST /api/auth/refresh
 * Refresh the access token using the active session keys.
 */
router.post("/refresh", (req, res) => {
  res.json({
    session: {
      access_token: `mock_token_${Date.now()}`,
      expires_in: 3600,
    },
  });
});

export default router;

