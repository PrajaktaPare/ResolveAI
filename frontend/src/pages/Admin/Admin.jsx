import { useState } from "react";
import {
  BarChart3,
  AlertTriangle,
  Users,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Spinner";
import { ISSUE_STATUSES, ROLES } from "@/utils/constants";
import { formatNumber, formatDate } from "@/utils/formatters";

// Mock admin data
const mockAdminData = {
  users: [
    {
      id: "1",
      email: "admin@example.com",
      full_name: "Admin User",
      role: "admin",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      total_reports: 12,
    },
    {
      id: "2",
      email: "moderator@example.com",
      full_name: "Moderator",
      role: "moderator",
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      total_reports: 45,
    },
    {
      id: "3",
      email: "user@example.com",
      full_name: "John Citizen",
      role: "citizen",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      total_reports: 3,
    },
  ],
  pendingIssues: [
    {
      id: "p1",
      title: "Massive pothole blocking lane",
      reporter: "Jane Doe",
      priority: 92,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "p2",
      title: "Water leakage from main line",
      reporter: "Bob Smith",
      priority: 88,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ],
  reportedComments: [
    {
      id: "c1",
      author: "Spam User",
      content: "Check out my website!!!",
      issue: "Main Street Pothole",
      reason: "Spam",
    },
    {
      id: "c2",
      author: "Offensive User",
      content: "This reporter is incompetent!",
      issue: "Garbage Dump Report",
      reason: "Offensive language",
    },
  ],
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Manage issues, users, and moderation tasks
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
          onClick={() => setActiveTab("moderation")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "moderation"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          Moderation
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(mockAdminData.users.length)}</div>
                <p className="text-xs text-muted-foreground">
                  1 admin, 1 moderator, 1 citizen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAdminData.pendingIssues.length}</div>
                <p className="text-xs text-muted-foreground">
                  Issues awaiting verification
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports</CardTitle>
                <MessageSquare className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAdminData.reportedComments.length}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Issues */}
          <Card>
            <CardHeader>
              <CardTitle>High Priority Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAdminData.pendingIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Reported by {issue.reporter} •{" "}
                      {formatDate(issue.created_at, "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-destructive">{issue.priority}</Badge>
                    <Button variant="outline" size="sm">
                      Review
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
            <input
              type="text"
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-card">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Joined</th>
                  <th className="px-4 py-3 text-left font-semibold">Reports</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockAdminData.users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-card/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          user.role === "admin"
                            ? "destructive"
                            : user.role === "moderator"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(user.created_at, "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 font-semibold">{user.total_reports}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moderation Tab */}
      {activeTab === "moderation" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reported Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAdminData.reportedComments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{item.author}</p>
                      <p className="text-sm text-muted-foreground">on "{item.issue}"</p>
                    </div>
                    <Badge tone="warning">{item.reason}</Badge>
                  </div>
                  <p className="text-sm">{item.content}</p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
