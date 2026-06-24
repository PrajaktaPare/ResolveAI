/**
 * @file logger.js
 * @description Initializes the Winston structured logger.
 * Implements readable color printing in development terminal environments,
 * and outputs structured logs to logs/combined.log and logs/error.log.
 * Provides backwards compatibility for Pino-style logger.child calls.
 */

import winston from "winston";
import path from "path";
import fs from "fs";

const logDir = "logs";

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Create the primary Winston logger instance
const loggerInstance = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Save error level logs only
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Save all logs
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Output formatted logs to terminal in development/local environments
if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
  loggerInstance.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, moduleName, ...meta }) => {
          const mod = moduleName ? `[${moduleName}] ` : "";
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
          return `${timestamp} ${level}: ${mod}${message}${metaStr}`;
        })
      ),
    })
  );
}

// Wrapper for backwards compatibility with Pino logger interface
const childCache = new Map();

export const logger = {
  info: (msg, ...meta) => loggerInstance.info(msg, ...meta),
  error: (msg, ...meta) => loggerInstance.error(msg, ...meta),
  warn: (msg, ...meta) => loggerInstance.warn(msg, ...meta),
  debug: (msg, ...meta) => loggerInstance.debug(msg, ...meta),
  
  /**
   * child
   * Pino-compatible child logger creator. Allows creating sub-loggers with specific labels.
   */
  child: (options) => {
    const childOptions = typeof options === "string" ? { moduleName: options } : options;
    const cacheKey = JSON.stringify(childOptions);
    
    if (childCache.has(cacheKey)) {
      return childCache.get(cacheKey);
    }
    
    const childLogger = loggerInstance.child(childOptions);
    
    const wrappedChild = {
      info: (msg, ...meta) => childLogger.info(msg, ...meta),
      error: (msg, ...meta) => childLogger.error(msg, ...meta),
      warn: (msg, ...meta) => childLogger.warn(msg, ...meta),
      debug: (msg, ...meta) => childLogger.debug(msg, ...meta),
      child: (nestedOpts) => {
        const nestedChildOpts = typeof nestedOpts === "string" ? { moduleName: nestedOpts } : nestedOpts;
        return wrappedChild.child({ ...childOptions, ...nestedChildOpts });
      }
    };
    
    childCache.set(cacheKey, wrappedChild);
    return wrappedChild;
  }
};
