/**
 * @file helpers.js
 * @description General utility mapping functions, score boundaries, clamping routines, and initials generator.
 */

import { RISK_LEVELS, ISSUE_STATUSES } from "./constants";

/**
 * priorityToLevel
 * Maps numeric priority scores (0-100) to qualitative risk levels.
 * 
 * @param {number} score - Priority score between 0 and 100.
 * @returns {Object} Target risk level configuration object.
 */
export function priorityToLevel(score = 0) {
  if (score >= 80) return RISK_LEVELS[3]; // Critical risk tier
  if (score >= 60) return RISK_LEVELS[2]; // High risk tier
  if (score >= 35) return RISK_LEVELS[1]; // Medium risk tier
  return RISK_LEVELS[0]; // Low risk tier (fallback)
}

/**
 * statusMeta
 * Retrieves styling and labeling parameters for an issue status key.
 * 
 * @param {string} value - Status string key.
 * @returns {Object} Tone mapping config.
 */
export function statusMeta(value) {
  return ISSUE_STATUSES.find((s) => s.value === value) || { value, label: value, tone: "muted" };
}

/**
 * clamp
 * Constrains a number within specified lower and upper bounds.
 * 
 * @param {number} value - Input value.
 * @param {number} min - Lower boundary.
 * @param {number} max - Upper boundary.
 * @returns {number} Clamped value.
 */
export function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

/**
 * initials
 * Extracts initials from a full name string.
 * 
 * @param {string} name - User full name.
 * @returns {string} Two letter uppercase initials.
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
 * healthLabel
 * Maps general 0-100 community health scores to status adjectives and styling tones.
 * 
 * @param {number} score - General health score.
 * @returns {Object} Score tag context (Excellent, Good, Fair, or Needs Attention).
 */
export function healthLabel(score = 0) {
  if (score >= 80) return { label: "Excellent", tone: "success" };
  if (score >= 60) return { label: "Good", tone: "primary" };
  if (score >= 40) return { label: "Fair", tone: "warning" };
  return { label: "Needs Attention", tone: "destructive" };
}

