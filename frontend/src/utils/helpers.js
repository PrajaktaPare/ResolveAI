import { RISK_LEVELS, ISSUE_STATUSES } from "./constants";

/**
 * Map a 0-100 priority score to a risk level descriptor.
 */
export function priorityToLevel(score = 0) {
  if (score >= 80) return RISK_LEVELS[3]; // critical
  if (score >= 60) return RISK_LEVELS[2]; // high
  if (score >= 35) return RISK_LEVELS[1]; // medium
  return RISK_LEVELS[0]; // low
}

/**
 * Get the descriptor for an issue status value.
 */
export function statusMeta(value) {
  return ISSUE_STATUSES.find((s) => s.value === value) || { value, label: value, tone: "muted" };
}

/**
 * Clamp a number to a range.
 */
export function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Build initials from a full name.
 */
export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/**
 * Map a 0-100 health score to a qualitative label + tone.
 */
export function healthLabel(score = 0) {
  if (score >= 80) return { label: "Excellent", tone: "success" };
  if (score >= 60) return { label: "Good", tone: "primary" };
  if (score >= 40) return { label: "Fair", tone: "warning" };
  return { label: "Needs Attention", tone: "destructive" };
}
