export const APP_NAME = "ResolveAI";
export const APP_TAGLINE = "From Reporting Problems to Resolving Communities.";

export const ROLES = {
  CITIZEN: "citizen",
  MODERATOR: "moderator",
  ADMIN: "admin",
};

export const ISSUE_CATEGORIES = [
  { value: "pothole", label: "Pothole" },
  { value: "garbage", label: "Garbage Dump" },
  { value: "water_leakage", label: "Water Leakage" },
  { value: "broken_streetlight", label: "Broken Streetlight" },
  { value: "open_manhole", label: "Open Manhole" },
  { value: "road_damage", label: "Road Damage" },
  { value: "public_infrastructure_damage", label: "Public Infrastructure Damage" },
  { value: "other", label: "Other" },
];

export const ISSUE_STATUSES = [
  { value: "reported", label: "Reported", tone: "muted" },
  { value: "verified", label: "Verified", tone: "primary" },
  { value: "prioritized", label: "Prioritized", tone: "warning" },
  { value: "assigned", label: "Assigned", tone: "primary" },
  { value: "in_progress", label: "In Progress", tone: "warning" },
  { value: "resolved", label: "Resolved", tone: "success" },
  { value: "rejected", label: "Rejected", tone: "destructive" },
  { value: "duplicate", label: "Duplicate", tone: "muted" },
];

export const STATUS_FLOW = [
  "reported",
  "verified",
  "prioritized",
  "assigned",
  "in_progress",
  "resolved",
];

export const RISK_LEVELS = [
  { value: "low", label: "Low", tone: "success" },
  { value: "medium", label: "Medium", tone: "warning" },
  { value: "high", label: "High", tone: "destructive" },
  { value: "critical", label: "Critical", tone: "destructive" },
];

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
  REPORT: "/report",
  ISSUES: "/issues",
  ISSUE_DETAIL: (id) => `/issues/${id}`,
  MY_REPORTS: "/my-reports",
  MAP: "/map",
  PROFILE: "/profile",
  ADMIN: "/admin",
};

export const THEME_STORAGE_KEY = "resolveai-theme";
