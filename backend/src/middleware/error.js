/**
 * @file error.js
 * @description Express exception and fallback route handlers.
 * Catches unmatched paths (404) and global operational exceptions (500).
 */

import { logger } from "../utils/logger.js";

// Create a scoped logger instance for error tracking
const log = logger.child("error-middleware");

/**
 * notFoundHandler
 * Express middleware to catch any requests to routes/methods not matched by application routers.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Not Found",
    message: `${req.method} ${req.path} not found`,
    status: 404,
  });
}

/**
 * errorHandler
 * Global Express error handling middleware.
 * Catches thrown exceptions, logs them with diagnostic info, and sends a sanitized JSON response.
 * 
 * @param {Object} err - Error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  // Log error diagnostics with Pino child logger
  log.error({
    error: err.message,
    status,
    path: req.path,
    method: req.method,
  });

  // Return standard JSON response. Expose stack trace only in development.
  res.status(status).json({
    error: message,
    status,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

