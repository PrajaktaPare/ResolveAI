/**
 * Lightweight client-side logger.
 * - Namespaced, level-aware console logging.
 * - Silenced in production builds except for warnings/errors.
 */
const isDev = import.meta.env.DEV;

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL = isDev ? LEVELS.debug : LEVELS.warn;

function format(scope, level) {
  return `%c[ResolveAI:${scope}]%c ${level}`;
}

const styles = {
  debug: "color:#64748b;font-weight:600",
  info: "color:#0d9488;font-weight:600",
  warn: "color:#d97706;font-weight:600",
  error: "color:#dc2626;font-weight:600",
};

function createLogger(scope = "app") {
  const make =
    (level) =>
    (...args) => {
      if (LEVELS[level] < MIN_LEVEL) return;
      const fn = console[level] || console.log;
      fn(format(scope, level), styles[level], "color:inherit;font-weight:normal", ...args);
    };

  return {
    debug: make("debug"),
    info: make("info"),
    warn: make("warn"),
    error: make("error"),
    child: (childScope) => createLogger(`${scope}:${childScope}`),
  };
}

export const logger = createLogger();
export default createLogger;
