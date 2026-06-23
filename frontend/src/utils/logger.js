/**
 * @file logger.js
 * @description Lightweight client-side logging utility.
 * Implements namespaces, severity thresholds, and customized console coloring.
 * Silences debug/info logging output automatically in production builds to optimize security and runtime speeds.
 */

const isDev = import.meta.env.DEV;

// Severity levels mapping dictionary
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

// Enforce logging threshold limits depending on target build profile
const MIN_LEVEL = isDev ? LEVELS.debug : LEVELS.warn;

/**
 * format
 * Assembles prefix tags with styling placeholder parameters for console logs.
 */
function format(scope, level) {
  return `%c[ResolveAI:${scope}]%c ${level}`;
}

// Prefix console styling configurations
const styles = {
  debug: "color:#64748b;font-weight:600",
  info: "color:#0d9488;font-weight:600",
  warn: "color:#d97706;font-weight:600",
  error: "color:#dc2626;font-weight:600",
};

/**
 * createLogger
 * Factory function creating namespaced logging controllers.
 * 
 * @param {string} scope - Logger scope namespace (default: "app").
 * @returns {Object} Custom logger instance.
 */
function createLogger(scope = "app") {
  // Higher-order function generator compiling level logs
  const make =
    (level) =>
    (...args) => {
      // Drop log calls under severity thresholds
      if (LEVELS[level] < MIN_LEVEL) return;
      const fn = console[level] || console.log;
      fn(format(scope, level), styles[level], "color:inherit;font-weight:normal", ...args);
    };

  return {
    debug: make("debug"),
    info: make("info"),
    warn: make("warn"),
    error: make("error"),
    // Generate subclass scoped logging child instance
    child: (childScope) => createLogger(`${scope}:${childScope}`),
  };
}

export const logger = createLogger();
export default createLogger;

