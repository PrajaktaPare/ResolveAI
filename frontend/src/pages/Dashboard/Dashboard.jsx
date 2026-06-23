import { Link } from "react-router-dom";
import {
  FileText,
  CheckCircle2,
  Clock,
  Timer,
  Users,
  PlusCircle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { HealthScore } from "@/components/dashboard/HealthScore";
import {
  CategoryChart,
  StatusChart,
  TrendChart,
} from "@/components/dashboard/Charts";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/common/States";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/hooks/useAuth";
import { dashboardService } from "@/services/dashboardService";
import { formatNumber } from "@/utils/formatters";
import { ROUTES } from "@/utils/constants";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch(
    () => dashboardService.getStats(),
    [],
  );

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState onRetry={refetch} />;

  const { totals, healthScore, byCategory, byStatus, trend } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            Here&apos;s the latest impact across your community.
          </p>
        </div>
        <Link to={ROUTES.REPORT}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Report an Issue
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Reports"
          value={formatNumber(totals.total)}
          icon={FileText}
          accent="primary"
          trend={`${formatNumber(totals.activeCitizens)} active citizens`}
        />
        <StatCard
          label="Resolved"
          value={formatNumber(totals.resolved)}
          icon={CheckCircle2}
          accent="success"
          trend={`${totals.resolutionRate}% resolution rate`}
        />
        <StatCard
          label="In Progress"
          value={formatNumber(totals.inProgress)}
          icon={Clock}
          accent="info"
        />
        <StatCard
          label="Avg. Resolution"
          value={`${totals.avgResolutionDays}d`}
          icon={Timer}
          accent="warning"
          trend={`${formatNumber(totals.pending)} pending review`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart data={trend} />
        </div>
        <HealthScore score={healthScore} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryChart data={byCategory} />
        <StatusChart data={byStatus} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 w-full lg:col-span-2" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
