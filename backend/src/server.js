/**
 * @file server.js
 * @description Main entry point for the ResolveAI backend server.
 * Configures Express application middleware, routes, logging, and error handlers.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
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
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Set security headers to protect from common web vulnerabilities
app.use(helmet());

// Enable gzip compression to optimize payload size and response speeds
app.use(compression());

// Configure Cross-Origin Resource Sharing (CORS) for frontend interaction
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // Allow cookie transmission across origins
  }),
);

// Body parser middleware to handle JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use("/api/auth", authRoutes); // Auth operations (login, register, logout)
app.use("/api/auth/profile", authenticate, profileRoutes); // Authenticated profile updates
app.use("/api/issues", issuesRoutes); // Issue reporting and voting endpoints
app.use("/api/dashboard", dashboardRoutes); // Metrics and heatmap stats endpoints
app.use("/api/notifications", authenticate, notificationsRoutes); // User notifications endpoints

// Fallback Middlewares for Error Handling
app.use(notFoundHandler); // Catch 404 routes
app.use(errorHandler); // Global exception handler

// Launch Express HTTP listener
app.listen(PORT, () => {
  console.log(`[ResolveAI] Server running on port ${PORT} (${NODE_ENV})`);
  console.log(`[ResolveAI] CORS enabled for: ${CLIENT_URL}`);
});

export default app;

