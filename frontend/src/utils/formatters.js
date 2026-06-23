import { format, formatDistanceToNow } from "date-fns";

/**
 * Format an ISO date string to a readable absolute date.
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
 * Format an ISO date string to a relative "x ago" label.
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
 * Compact number formatting (1.2k, 3.4M).
 */
export function formatCompact(num) {
  if (num == null) return "0";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(num);
}

/**
 * Format a number with thousands separator.
 */
export function formatNumber(num) {
  if (num == null) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Turn an enum-like string into a Title Case label.
 */
export function humanize(value) {
  if (!value) return "";
  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
