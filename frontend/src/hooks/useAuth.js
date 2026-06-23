/**
 * @file useAuth.js
 * @description Custom React hook serving as an alias wrapper for useAuthContext.
 * Facilitates access to authentication states and handlers.
 */

import { useAuthContext } from "@/context/AuthContext";

/**
 * useAuth hook
 * @returns {Object} Authentication context values.
 */
export function useAuth() {
  return useAuthContext();
}

export default useAuth;

