/**
 * @file cn.js
 * @description Helper utility to merge and format CSS className parameter lists.
 * Leverages clsx for conditional class string concatenation, and tailwind-merge to resolve style overlaps.
 */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn
 * Utility to merge Tailwind classes cleanly without conflicts.
 * 
 * @param {...any} inputs - Array of conditional strings, objects, or arrays.
 * @returns {string} Merged class names list.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

