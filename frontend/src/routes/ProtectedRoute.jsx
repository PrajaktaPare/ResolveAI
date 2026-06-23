/**
 * @file ProtectedRoute.jsx
 * @description Authentication guards for React Router.
 * Gates private routes requiring authentication, and blocks logged-in users from public pages (like login/register).
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/common/States";
import { ROUTES } from "@/utils/constants";

/**
 * ProtectedRoute
 * Route guard component that requires an authenticated session.
 * Optionally screens users for admin/moderator credentials via requireAdmin flag.
 * 
 * @param {Object} props - Component property arguments.
 */
export function ProtectedRoute({ requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // 1. Render spinner while auth session status is being verified
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <LoadingState label="Checking your session..." />
      </div>
    );
  }

  // 2. Redirect to Login if the user is unauthenticated, retaining destination target path in state
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 3. Block access to admin panel if administrator privileges are missing
  if (requireAdmin && !isAdmin) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // 4. Render children routes
  return <Outlet />;
}

/**
 * PublicOnlyRoute
 * Redirects authenticated users away from public pages (login, registration) directly to the dashboard.
 */
export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <LoadingState label="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

