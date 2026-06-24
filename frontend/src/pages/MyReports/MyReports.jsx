import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Trash2,
  Edit,
  Eye,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Spinner";
import { ErrorState, EmptyState } from "@/components/common/States";
import { useFetch } from "@/hooks/useFetch";
import { ROUTES, ISSUE_STATUSES, ISSUE_CATEGORIES, RISK_LEVELS } from "@/utils/constants";
import { formatDate, formatNumber } from "@/utils/formatters";
import { toast } from "sonner";

// Mock data service
const mockReportsService = {
  getMyReports: async () => {
    return {
      reports: [
        {
          id: "r1",
          title: "Damaged sidewalk on Lincoln Ave",
          category: "road_damage",
          status: "in_progress",
          riskLevel: "medium",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          upvotes: 5,
          views: 23,
          comments: 3,
        },
        {
          id: "r2",
          title: "Overflowing garbage at Park & Main",
          category: "garbage",
          status: "resolved",
          riskLevel: "low",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          upvotes: 12,
          views: 45,
          comments: 7,
        },
        {
          id: "r3",
          title: "Broken traffic signal intersection",
          category: "broken_streetlight",
          status: "verified",
          riskLevel: "high",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          upvotes: 8,
          views: 34,
          comments: 2,
        },
      ],
    };
  },
};

export default function MyReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data, loading, error, refetch } = useFetch(
    () => mockReportsService.getMyReports(),
    [],
  );

  const filteredReports = useMemo(() => {
    if (!data?.reports) return [];

    let filtered = data.reports;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((report) =>
        report.title.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((report) => report.status === filterStatus);
    }

    return filtered;
  }, [data?.reports, searchQuery, filterStatus]);

  const getStatusColor = (status) => {
    const statusObj = ISSUE_STATUSES.find((s) => s.value === status);
    return statusObj?.tone || "muted";
  };

  const getStatusIcon = (status) => {
    if (status === "resolved") return <CheckCircle2 className="h-4 w-4" />;
    if (status === "in_progress") return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const handleDelete = (id) => {
    toast.success("Report deleted successfully");
  };

  const getCategoryLabel = (category) => {
    const cat = ISSUE_CATEGORIES.find((c) => c.value === category);
    return cat?.label || category;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  if (!data?.reports || data.reports.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No Reports Yet"
        message="You haven't reported any issues yet. Start by reporting an issue to help improve your community."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Track and manage the issues you&apos;ve reported
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search your reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            {ISSUE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Reports</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{data.reports.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="mt-1 text-2xl font-bold text-success">
              {data.reports.filter((r) => r.status === "resolved").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Upvotes</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {formatNumber(data.reports.reduce((sum, r) => sum + r.upvotes, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">No reports match your search</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Main info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{getStatusIcon(report.status)}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{report.title}</h3>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{getCategoryLabel(report.category)}</span>
                          <span>•</span>
                          <span>Reported {formatDate(report.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status and stats */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1 text-xs sm:flex-col sm:text-right">
                      <Badge tone={getStatusColor(report.status)}>
                        {ISSUE_STATUSES.find((s) => s.value === report.status)?.label}
                      </Badge>
                      <div className="flex gap-2 text-muted-foreground">
                        <span>{report.views} views</span>
                        <span>{report.upvotes} upvotes</span>
                      </div>
                    </div>

                    {/* Action menu */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View details"
                        asChild
                      >
                        <Link to={`${ROUTES.ISSUES}/${report.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Edit report"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete report"
                        onClick={() => handleDelete(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
