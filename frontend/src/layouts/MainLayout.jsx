/**
 * @file MainLayout.jsx
 * @description Standard layout shell for authenticated routes.
 * Houses responsive sidebar elements, top application bars, and matches active titles with routes.
 */

import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/utils/constants";

// Map routes paths to readable page titles in header
const TITLES = {
  [ROUTES.DASHBOARD]: "Impact Dashboard",
  [ROUTES.REPORT]: "Report an Issue",
  [ROUTES.ISSUES]: "Browse Issues",
  [ROUTES.MY_REPORTS]: "My Reports",
  [ROUTES.MAP]: "Issue Map",
  [ROUTES.ADMIN]: "Admin Panel",
  [ROUTES.PROFILE]: "Profile",
};

/**
 * MainLayout
 * Wraps protected dashboard interfaces.
 */
export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Controls responsive drawer status on mobile
  const location = useLocation();
  const title = TITLES[location.pathname] || "ResolveAI";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar navigation panel */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Global header bar */}
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        
        {/* Page content wrapper */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

