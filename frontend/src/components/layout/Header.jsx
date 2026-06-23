import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, User as UserIcon, ChevronDown, Bell, Check, X } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Avatar } from "@/components/common/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { api } from "@/config/api";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

const log = logger.child("header");

export function Header({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [menuOpen, setMenuOpen] = useState(false); 
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      if (!user) return;
      const { data } = await api.get("/notifications");
      // Map keys to camelCase if they are snake_case from DB
      const parsed = (data?.notifications || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        issueId: n.issue_id,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: n.is_read || false,
        createdAt: n.created_at
      }));
      setNotifications(parsed);
    } catch (e) {
      log.warn("Failed to load notifications: ", e.message);
      // Mock notifications if offline/unconfigured
      if (!isSupabaseConfigured) {
        setNotifications([
          { id: "1", title: "Pothole verified", message: "Your reported pothole has been verified by the community.", is_read: false, createdAt: new Date().toISOString() },
          { id: "2", title: "Welcome to ResolveAI", message: "Start reporting civic issues to help your neighborhood.", is_read: true, createdAt: new Date(Date.now() - 3600000).toISOString() }
        ]);
      }
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications initially and subscribe to realtime updates
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    if (isSupabaseConfigured) {
      log.info("Setting up Realtime notifications subscription for user:", user.id);
      const subscription = supabase
        .channel(`notifications-user-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            log.info("Realtime notification received:", payload.new);
            const n = payload.new;
            const newNotif = {
              id: n.id,
              userId: n.user_id,
              issueId: n.issue_id,
              type: n.type,
              title: n.title,
              message: n.message,
              is_read: n.is_read || false,
              createdAt: n.created_at
            };
            setNotifications(prev => [newNotif, ...prev]);
            toast.info(newNotif.title || "New Notification Received");
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user?.id]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      await api.post(`/notifications/${id}/read`);
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await api.post("/notifications/read-all");
      toast.success("All notifications marked as read");
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  };

  // Logout trigger handler
  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        {/* Toggle navigation bar button - visible only on mobile screens */}
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-extrabold text-destructive-foreground animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span className="text-sm font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start justify-between gap-2 p-3 hover:bg-muted/40 transition-colors ${
                        !n.is_read ? "bg-primary/5/10 font-medium" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground leading-tight">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{n.message}</p>
                        <span className="text-[9px] text-muted-foreground block mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="rounded p-1 text-primary hover:bg-primary/10 transition-colors"
                          title="Mark read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">No notifications yet</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* User Account Settings Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-accent"
            aria-label="Account menu"
          >
            <Avatar name={user?.full_name} src={user?.avatar_url} size="sm" />
            <span className="hidden text-sm font-medium text-foreground sm:block">
              {user?.full_name || "Account"}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.full_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(ROUTES.PROFILE);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent"
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-destructive hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
