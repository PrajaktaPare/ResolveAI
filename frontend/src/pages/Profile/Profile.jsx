import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, MapPin, Calendar, Edit2, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/common/States";
import { ROLES, ROUTES } from "@/utils/constants";
import { formatDate, formatCompact } from "@/utils/formatters";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/config/api";
import { toast } from "sonner";

export default function Profile() {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/auth/profile");
        setUser(data);
        setFormData(data);

        // Fetch user stats
        const { data: statsData } = await api.get("/auth/profile/stats");
        setStats(statsData);
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put("/auth/profile", formData);
      setUser(data);
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (err) {
      toast.error("Failed to logout");
    }
  };

  if (loading) {
    return <LoadingState label="Loading profile..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => window.location.reload()} />;
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      [ROLES.CITIZEN]: { tone: "success", label: "Citizen" },
      [ROLES.MODERATOR]: { tone: "warning", label: "Moderator" },
      [ROLES.ADMIN]: { tone: "destructive", label: "Admin" },
    };
    return roleConfig[role] || { tone: "muted", label: "Unknown" };
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account information</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" gap="2" onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button variant="destructive" gap="2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main profile card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      name="name"
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      name="location"
                      value={formData.location || ""}
                      onChange={handleInputChange}
                      placeholder="Your city or area"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                    <p className="mt-1 text-foreground">{user?.name || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="mt-1 text-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="mt-1 text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {user?.location || "Not provided"}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Role and verification */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <div className="mt-1">
                  <Badge tone={roleBadge.tone}>{roleBadge.label}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="mt-1 text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(user?.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="mt-1 text-foreground">{formatDate(user?.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your contributions to the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">{formatCompact(stats.totalReports || 0)} Issues Reported</p>
                <p className="text-xs text-muted-foreground">You&apos;ve reported {stats.totalReports || 0} issues</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">{formatCompact(stats.resolvedReports || 0)} Issues Resolved</p>
                <p className="text-xs text-muted-foreground">Your reports have contributed to {stats.resolvedReports || 0} resolutions</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">{formatCompact(stats.totalUpvotes || 0)} Upvotes Received</p>
                <p className="text-xs text-muted-foreground">Community members upvoted your contributions {stats.totalUpvotes || 0} times</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* User avatar section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                  <User className="h-10 w-10 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                My Reports
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Saved Issues
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Settings
              </Button>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full" onClick={() => toast.error("Delete account feature coming soon")}>
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
