import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  ListChecks,
  Map,
  ShieldCheck,
  X,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, ROLES } from "@/utils/constants";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { to: ROUTES.REPORT, label: "Report Issue", icon: PlusCircle },
  { to: ROUTES.ISSUES, label: "Browse Issues", icon: ListChecks },
  { to: ROUTES.MY_REPORTS, label: "My Reports", icon: ListChecks },
  { to: ROUTES.MAP, label: "Issue Map", icon: Map },
];

const ADMIN_ITEMS = [
  { to: ROUTES.ADMIN, label: "Admin Panel", icon: ShieldCheck },
];

export function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.MODERATOR;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} onClick={onClose} />
          ))}

          {isAdmin && (
            <>
              <div className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Administration
              </div>
              {ADMIN_ITEMS.map((item) => (
                <SidebarLink key={item.to} {...item} onClick={onClose} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            ResolveAI — civic issue reporting
          </p>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  );
}
