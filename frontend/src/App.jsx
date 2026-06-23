import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/routes/ProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ROUTES } from "@/utils/constants";

// Pages
import Landing from "@/pages/Landing/Landing";
import Login from "@/pages/Login/Login";
import Register from "@/pages/Register/Register";
import ForgotPassword from "@/pages/ForgotPassword/ForgotPassword";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Report from "@/pages/Report/Report";
import Issues from "@/pages/Issues/Issues";
import IssueDetail from "@/pages/IssueDetail/IssueDetail";
import MyReports from "@/pages/MyReports/MyReports";
import Map from "@/pages/Map/Map";
import Profile from "@/pages/Profile/Profile";
import Admin from "@/pages/Admin/Admin";
import NotFound from "@/pages/NotFound/NotFound";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path={ROUTES.HOME} element={<Landing />} />

            {/* Public-only routes (redirects to dashboard if logged in) */}
            <Route element={<PublicOnlyRoute />}>
              <Route element={<AuthLayout />}>
                <Route path={ROUTES.LOGIN} element={<Login />} />
                <Route path={ROUTES.REGISTER} element={<Register />} />
                <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
              </Route>
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.REPORT} element={<Report />} />
                <Route path={ROUTES.ISSUES} element={<Issues />} />
                <Route path={`${ROUTES.ISSUES}/:issueId`} element={<IssueDetail />} />
                <Route path={ROUTES.MY_REPORTS} element={<MyReports />} />
                <Route path={ROUTES.MAP} element={<Map />} />
                <Route path={ROUTES.PROFILE} element={<Profile />} />
              </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute requireAdmin />}>
              <Route element={<MainLayout />}>
                <Route path={ROUTES.ADMIN} element={<Admin />} />
              </Route>
            </Route>

            {/* Catch-all for undefined routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
