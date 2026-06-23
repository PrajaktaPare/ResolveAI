import { useState, useEffect } from "react";
import {
  BarChart3,
  AlertTriangle,
  Users,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Shield,
  UserCheck,
  Briefcase,
  GitMerge,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Spinner";
import { ISSUE_STATUSES, ROLES } from "@/utils/constants";
import { formatNumber, formatDate } from "@/utils/formatters";
import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { api } from "@/config/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real database states
  const [usersList, setUsersList] = useState([]);
  const [issuesList, setIssuesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  
  // Moderation form states
  const [statusVal, setStatusVal] = useState("");
  const [assignedToVal, setAssignedToVal] = useState("");
  const [mergeIssueIdVal, setMergeIssueIdVal] = useState("");
  const [submittingMod, setSubmittingMod] = useState(false);

  // Fetch all profiles and issues
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Issues
      const issuesRes = await api.get("/issues");
      const fetchedIssues = issuesRes.data?.issues || [];
      setIssuesList(fetchedIssues);

      // 2. Fetch Users
      if (isSupabaseConfigured) {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setUsersList(profiles || []);
      } else {
        // Mock fallback profiles
        setUsersList([
          { id: "mock_user_1", email: "admin@example.com", full_name: "Admin User", role: "admin", created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          { id: "mock_user_2", email: "moderator@example.com", full_name: "Moderator User", role: "moderator", created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
          { id: "mock_user_3", email: "user@example.com", full_name: "John Citizen", role: "citizen", created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
        ]);
      }
    } catch (e) {
      console.error("Failed to load admin dashboard data:", e);
      toast.error("Failed to fetch admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      if (!isSupabaseConfigured) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast.success("Role updated successfully (mock)!");
        return;
      }
      await api.put(`/auth/profile/${userId}/role`, { role: newRole });
      toast.success("Role updated successfully!");
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to update role");
    }
  };

  // Submit issue moderation
  const handleModerateIssue = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;

    try {
      setSubmittingMod(true);
      const payload = {};
      if (statusVal) payload.status = statusVal;
      if (assignedToVal !== undefined) payload.assignedTo = assignedToVal || null;
      if (mergeIssueIdVal) {
        payload.status = "duplicate";
        payload.canonicalIssueId = mergeIssueIdVal;
      }

      await api.put(`/issues/${selectedIssue.id}`, payload);
      toast.success("Issue moderated successfully!");
      setSelectedIssue(null);
      setMergeIssueIdVal("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to moderate issue");
    } finally {
      setSubmittingMod(false);
    }
  };

  // Setup initial values on selecting an issue for moderation
  const selectIssueForMod = (issue) => {
    setSelectedIssue(issue);
    setStatusVal(issue.status || "reported");
    setAssignedToVal(issue.assignedTo || "");
    setMergeIssueIdVal(issue.canonicalIssueId || "");
  };

  // Filter users based on query
  const filteredUsers = usersList.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics calculation
  const totalIssues = issuesList.length;
  const pendingIssues = issuesList.filter((i) => i.status === "reported" || i.status === "verified").length;
  const resolvedIssues = issuesList.filter((i) => i.status === "resolved").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin & Moderation Console</h1>
            <p className="mt-1 text-muted-foreground">
              Override issue status, assign civic workers, and merge duplicate reports.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "overview"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="mr-2 inline h-4 w-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "users"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="mr-2 inline h-4 w-4" />
          Users
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "issues"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          Issues Moderation
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registered Users</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usersList.length}</div>
                <p className="text-xs text-muted-foreground">Registered in the database</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues Awaiting Review</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingIssues}</div>
                <p className="text-xs text-muted-foreground">Status 'reported' or 'verified'</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resolvedIssues}</div>
                <p className="text-xs text-muted-foreground">Closed civic reports</p>
              </CardContent>
            </Card>
          </div>

          {/* High Priority Issues needing moderation */}
          <Card>
            <CardHeader>
              <CardTitle>High Priority Issues Awaiting Moderator Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {issuesList
                .filter(i => i.status !== "resolved" && i.status !== "rejected")
                .sort((a, b) => b.priority - a.priority)
                .slice(0, 5)
                .map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-semibold text-foreground truncate">{issue.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Category: {issue.category} • Calculated Priority: {issue.priority}/100
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={issue.priority >= 70 ? "destructive" : "warning"}>
                        {issue.priority}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => { setActiveTab("issues"); selectIssueForMod(issue); }}>
                        Moderate
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search profiles by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">User Profile</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Reputation Score</th>
                  <th className="px-4 py-3 text-left font-semibold">Created At</th>
                  <th className="px-4 py-3 text-left font-semibold">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userObj) => (
                  <tr key={userObj.id} className="border-b border-border hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{userObj.full_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">{userObj.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          userObj.role === "admin"
                            ? "destructive"
                            : userObj.role === "moderator"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {userObj.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">
                      {userObj.reputation_score || 0} pts
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(userObj.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={userObj.role}
                        onChange={(e) => handleRoleChange(userObj.id, e.target.value)}
                        className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="citizen">Citizen</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues Moderation Tab */}
      {activeTab === "issues" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Issues list (left panel) */}
          <div className="lg:col-span-2 space-y-3 overflow-y-auto max-h-[700px] pr-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              All Reported Issues ({issuesList.length})
            </h2>
            {issuesList.map((issue) => {
              const status = ISSUE_STATUSES.find(s => s.value === issue.status);
              const isSelected = selectedIssue?.id === issue.id;
              
              return (
                <Card
                  key={issue.id}
                  className={`cursor-pointer hover:border-primary/50 transition-all border-l-4 ${
                    isSelected ? "border-l-primary bg-primary/5 shadow-md" : "border-l-transparent"
                  }`}
                  onClick={() => selectIssueForMod(issue)}
                >
                  <CardContent className="p-4 flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">{issue.title}</h4>
                        <Badge tone={status?.tone}>{status?.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{issue.location}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Priority: <strong>{issue.priority}</strong></span>
                        <span>Upvotes/Support: <strong>{issue.upvotes}</strong></span>
                        {issue.canonicalIssueId && (
                          <span className="text-yellow-600 font-semibold flex items-center gap-1">
                            <GitMerge className="h-3 w-3" /> Duplicate
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/issues/${issue.id}`); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Moderation details editor (right panel) */}
          <div className="lg:col-span-1">
            {selectedIssue ? (
              <Card className="border-primary/40 shadow-lg sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Moderate Issue</CardTitle>
                  <CardDescription className="line-clamp-2">Editing settings for: {selectedIssue.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleModerateIssue} className="space-y-4">
                    {/* Status dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Override Status
                      </label>
                      <select
                        value={statusVal}
                        onChange={(e) => setStatusVal(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {ISSUE_STATUSES.map((statusItem) => (
                          <option key={statusItem.value} value={statusItem.value}>
                            {statusItem.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Assigned To dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Assign Worker
                      </label>
                      <select
                        value={assignedToVal}
                        onChange={(e) => setAssignedToVal(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Unassigned</option>
                        {usersList.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name || user.email} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Merge duplicate selector */}
                    <div className="space-y-1 pt-2 border-t border-border/40">
                      <label className="text-xs font-bold uppercase tracking-wider text-yellow-600 flex items-center gap-1.5">
                        <GitMerge className="h-4.5 w-4.5" />
                        Merge as Duplicate
                      </label>
                      <select
                        value={mergeIssueIdVal}
                        onChange={(e) => setMergeIssueIdVal(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Not a Duplicate</option>
                        {issuesList
                          .filter((i) => i.id !== selectedIssue.id)
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.title} (#{i.id.substring(0, 6)})
                            </option>
                          ))}
                      </select>
                      <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                        Merging will set status to 'duplicate' and direct traffic to the canonical parent report.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={submittingMod} className="flex-1">
                        {submittingMod ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setSelectedIssue(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-40 text-primary" />
                  <p className="text-sm font-semibold">Select an issue from the list to view moderation controls.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
