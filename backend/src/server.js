/**
 * @file server.js
 * @description Main entry point for the ResolveAI backend server.
 * Configures Express application middleware, routes, logging, and error handlers.
 * Includes security hardening: rate limiting, CORS lock-down, HSTS, body limits.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Middleware and handler imports
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { logger } from "./utils/logger.js";

// Express route controller imports
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import issuesRoutes from "./routes/issues.js";
import dashboardRoutes from "./routes/dashboard.js";
import healthRoutes from "./routes/health.js";
import notificationsRoutes from "./routes/notifications.js";
import { authenticate } from "./middleware/auth.js";

// Load environment variables from .env file
dotenv.config();

// Instantiate Express application
const app = express();

// Determine configuration parameters from environment variables or defaults
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || "development";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ── Security: Trust proxy (required for Cloud Run / load balancers) ──
app.set("trust proxy", 1);

// ── Security: Helmet — set protective HTTP headers ──
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for API-only server
    crossOriginEmbedderPolicy: false,
  })
);

// ── Security: HSTS enforcement in production ──
if (NODE_ENV === "production") {
  app.use((req, res, next) => {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
}

// Enable gzip compression to optimize payload size and response speeds
app.use(compression());

// ── Security: Multi-origin CORS support ──
// CLIENT_URL can be comma-separated for multiple origins (e.g., "https://frontend.run.app,http://localhost:5173")
const allowedOrigins = CLIENT_URL.split(",").map((url) => url.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Security: Body size limits (prevent payload attacks) ──
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Security: Global rate limiter (100 requests per 15 minutes per IP) ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api/", globalLimiter);

// ── Security: Strict rate limiter for auth endpoints (10 requests per 15 minutes) ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});

// Configure logging based on execution environment
if (NODE_ENV === "development") {
  // Use user-friendly morgan logging in development
  app.use(morgan("dev"));
} else {
  // Use morgan stream to log requests through Winston in production
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Register API Routes
app.use("/api/health", healthRoutes); // Public service health check status
app.use("/api/auth", authLimiter, authRoutes); // Auth operations (rate-limited)
app.use("/api/auth/profile", authenticate, profileRoutes); // Authenticated profile updates
app.use("/api/issues", issuesRoutes); // Issue reporting and voting endpoints
app.use("/api/dashboard", dashboardRoutes); // Metrics and heatmap stats endpoints
app.use("/api/notifications", authenticate, notificationsRoutes); // User notifications endpoints

// Fallback Middlewares for Error Handling
app.use(notFoundHandler); // Catch 404 routes
app.use(errorHandler); // Global exception handler

// Launch Express HTTP listener
// Vercel serverless: skip listen() — Vercel invokes the exported app per-request.
// Cloud Run / local dev: start the HTTP listener normally.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[ResolveAI] Server running on port ${PORT} (${NODE_ENV})`);
    console.log(`[ResolveAI] CORS enabled for: ${allowedOrigins.join(", ")}`);
    console.log(`[ResolveAI] Security: Rate limiting, Helmet, HSTS active`);
  });
}

export default app;

