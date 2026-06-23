/**
 * @file formatters.js
 * @description Helper functions to format numbers, absolute/relative dates, and humanize database enums.
 */

import { format, formatDistanceToNow } from "date-fns";

/**
 * formatDate
 * Formats an ISO string date to a user-friendly absolute display date representation.
 * 
 * @param {string} value - ISO date string.
 * @param {string} pattern - Format template (default: "MMM d, yyyy").
 * @returns {string} Formatted date representation.
 */
export function formatDate(value, pattern = "MMM d, yyyy") {
  if (!value) return "";
  try {
    return format(new Date(value), pattern);
  } catch {
    return "";
  }
}

/**
 * formatRelative
 * Formats an ISO string date into relative format ("2 days ago", "1 hour ago").
 * 
 * @param {string} value - ISO date string.
 * @returns {string} Relative time label.
 */
export function formatRelative(value) {
  if (!value) return "";
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return "";
  }
}

/**
 * formatCompact
 * Formats large integers into abbreviated strings ("1.2k", "3.5M").
 * 
 * @param {number} num - Count.
 * @returns {string} Formatted compact count label.
 */
export function formatCompact(num) {
  if (num == null) return "0";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(num);
}

/**
 * formatNumber
 * Formats integers to localized strings with thousands separators.
 * 
 * @param {number} num - Integer count.
 * @returns {string} Comma separated value representation.
 */
export function formatNumber(num) {
  if (num == null) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * humanize
 * Standardizes underscores and snake_case labels into clean Title Case tags.
 * 
 * @param {string} value - Raw string input.
 * @returns {string} Clean title label.
 */
export function humanize(value) {
  if (!value) return "";
  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

