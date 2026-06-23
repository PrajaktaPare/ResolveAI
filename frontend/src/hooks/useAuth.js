import { useAuthContext } from "@/context/AuthContext";

/**
 * Convenience hook to access auth state and actions.
 */
export function useAuth() {
  return useAuthContext();
}

export default useAuth;
