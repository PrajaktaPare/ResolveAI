/**
 * @file api/index.js
 * @description Vercel serverless function entry point.
 * Re-exports the configured Express application so Vercel's @vercel/node
 * runtime can wrap it as an HTTP handler invoked per-request.
 *
 * On Vercel, the VERCEL environment variable is set automatically,
 * which signals server.js to skip app.listen() and logger.js to
 * use console transports instead of file-based logging.
 */

export { default } from "../src/server.js";
