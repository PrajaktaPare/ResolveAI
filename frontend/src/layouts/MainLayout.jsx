import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/utils/constants";

const TITLES = {
  [ROUTES.DASHBOARD]: "Impact Dashboard",
  [ROUTES.REPORT]: "Report an Issue",
  [ROUTES.ISSUES]: "Browse Issues",
  [ROUTES.MY_REPORTS]: "My Reports",
  [ROUTES.MAP]: "Issue Map",
  [ROUTES.ADMIN]: "Admin Panel",
  [ROUTES.PROFILE]: "Profile",
};

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = TITLES[location.pathname] || "ResolveAI";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
