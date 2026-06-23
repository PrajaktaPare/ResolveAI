import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  TrendingUp,
  PlusCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/common/States";
import { useFetch } from "@/hooks/useFetch";
import { ROUTES, ISSUE_STATUSES, ISSUE_CATEGORIES, RISK_LEVELS } from "@/utils/constants";
import { formatDate, formatNumber } from "@/utils/formatters";

import { api } from "@/config/api";

// Service to fetch issues from the backend
const issuesService = {
  getAll: async (filters = {}) => {
    try {
      const { data } = await api.get("/issues", { params: filters });
      return data;
    } catch (error) {
      console.error("[v0] Failed to fetch issues:", error);
      // Return mock data on error for demo purposes
      return {
        issues: [
          {
            id: "1",
            title: "Large pothole on Main Street",
            category: "pothole",
            status: "in_progress",
            riskLevel: "high",
            location: "Main St & 5th Ave",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            upvotes: 24,
            priority: 78,
          },
        ],
      };
    }
  },
};

export default function Issues() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");

  const { data, loading, error, refetch } = useFetch(
    () => issuesService.getAll({ sort: sortBy, category: categoryFilter !== "all" ? categoryFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined }),
    [sortBy, categoryFilter, statusFilter],
  );

  const filteredAndSorted = useMemo(() => {
    if (!data?.issues) return [];

    let filtered = data.issues;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(query) ||
          issue.location.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((issue) => issue.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((issue) => issue.category === categoryFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "priority") return b.priority - a.priority;
      if (sortBy === "newest") return b.createdAt - a.createdAt;
      if (sortBy === "upvotes") return b.upvotes - a.upvotes;
      return 0;
    });

    return filtered;
  }, [data?.issues, searchQuery, statusFilter, categoryFilter, sortBy]);

  const getStatusColor = (status) => {
    const statusObj = ISSUE_STATUSES.find((s) => s.value === status);
    return statusObj?.tone || "muted";
  };

  const getCategoryLabel = (category) => {
    const cat = ISSUE_CATEGORIES.find((c) => c.value === category);
    return cat?.label || category;
  };

  const getRiskColor = (riskLevel) => {
    const risk = RISK_LEVELS.find((r) => r.value === riskLevel);
    return risk?.tone || "muted";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community Issues</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(filteredAndSorted.length)} issue{filteredAndSorted.length !== 1 ? "s" : ""}
            {" "}found
          </p>
        </div>
        <Link to={ROUTES.REPORT}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Report an Issue
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search issues by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="all">All Statuses</option>
              {ISSUE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="all">All Categories</option>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="priority">Highest Priority</option>
              <option value="newest">Newest First</option>
              <option value="upvotes">Most Upvotes</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Display</label>
            <select
              defaultValue="grid"
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="grid">Grid View</option>
              <option value="list">List View</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No issues found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {filteredAndSorted.map((issue) => (
            <Link key={issue.id} to={`${ROUTES.ISSUES}/${issue.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Main info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{issue.title}</h3>
                      <Badge variant="outline">{getCategoryLabel(issue.category)}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {issue.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(issue.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Right side stats */}
                  <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="flex gap-2">
                      <Badge tone={getStatusColor(issue.status)}>
                        {ISSUE_STATUSES.find((s) => s.value === issue.status)?.label}
                      </Badge>
                      <Badge tone={getRiskColor(issue.riskLevel)}>
                        {RISK_LEVELS.find((r) => r.value === issue.riskLevel)?.label}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-right text-sm">
                      <div className="flex items-center gap-1 justify-end font-semibold text-primary">
                        <TrendingUp className="h-4 w-4" />
                        {issue.priority}
                      </div>
                      <p className="text-xs text-muted-foreground">{issue.upvotes} upvotes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
