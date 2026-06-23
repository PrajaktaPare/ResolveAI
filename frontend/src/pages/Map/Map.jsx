import { useState, useEffect } from "react";
import { MapPin, AlertCircle, Filter, Grid3x3, ThumbsUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/common/States";
import { ISSUE_CATEGORIES, ISSUE_STATUSES, RISK_LEVELS, ROUTES } from "@/utils/constants";
import { formatDate, formatCompact } from "@/utils/formatters";
import { api } from "@/config/api";
import { useFetch } from "@/hooks/useFetch";
import { useNavigate } from "react-router-dom";

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix default leaflet icon issues with Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom map view controller to fly to active center
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Function to generate color coded custom circle markers
const createCustomIcon = (category) => {
  const colorMap = {
    pothole: "#64748b", // slate
    garbage: "#d97706", // amber
    water_leakage: "#3b82f6", // blue
    broken_streetlight: "#eab308", // yellow
    open_manhole: "#dc2626", // red
    road_damage: "#ea580c", // orange
    public_infrastructure_damage: "#9333ea", // purple
    other: "#6b7280", // gray
  };

  const color = colorMap[category] || colorMap.other;

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    className: "custom-leaflet-icon",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

export default function Map() {
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mapView, setMapView] = useState("map"); // default to interactive map

  // Center on New York by default (mock data center)
  const defaultCenter = [40.7128, -74.006];
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);

  const { data, loading, error, refetch } = useFetch(
    async () => {
      try {
        const { data } = await api.get("/issues/map/data", {
          params: {
            category: categoryFilter !== "all" ? categoryFilter : undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
          },
        });
        return data;
      } catch (err) {
        console.error("Map API error:", err);
        return { issues: [] };
      }
    },
    [categoryFilter, statusFilter],
  );

  const issues = data?.issues || [];

  // Automatically update map center when selected issue changes
  useEffect(() => {
    if (selectedIssue && selectedIssue.latitude && selectedIssue.longitude) {
      const lat = Number(selectedIssue.latitude);
      const lng = Number(selectedIssue.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
        setMapZoom(15);
      }
    }
  }, [selectedIssue]);

  const getRiskColor = (riskLevel) => {
    const colors = {
      low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[riskLevel] || colors.low;
  };

  const getCategoryColor = (category) => {
    const colors = {
      pothole: "bg-slate-500",
      garbage: "bg-amber-600",
      water_leakage: "bg-blue-500",
      broken_streetlight: "bg-yellow-500",
      open_manhole: "bg-red-600",
      road_damage: "bg-orange-600",
      public_infrastructure_damage: "bg-purple-600",
      other: "bg-gray-500",
    };
    return colors[category] || colors.other;
  };

  if (loading && !issues.length) {
    return <LoadingState label="Loading map data..." />;
  }

  if (error && !issues.length) {
    return <ErrorState description={error} onRetry={refetch} />;
  }

  return (
    <main className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary animate-bounce" />
            Issue Map
          </h1>
          <p className="text-sm text-muted-foreground">Visual representation of all reported issues</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mapView === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setMapView("list")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={mapView === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setMapView("map")}
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 border border-input bg-card rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 border border-input bg-card rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                {ISSUE_STATUSES.map((stat) => (
                  <option key={stat.value} value={stat.value}>
                    {stat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setCategoryFilter("all");
                  setStatusFilter("all");
                  setSelectedIssue(null);
                  setMapCenter(defaultCenter);
                  setMapZoom(13);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content display based on selected view */}
      {mapView === "map" ? (
        <div className="grid gap-6 lg:grid-cols-3 h-[600px]">
          {/* Left Panel: Scrollable list of filtered issues */}
          <div className="lg:col-span-1 overflow-y-auto space-y-3 pr-2 h-full scrollbar-thin">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Filtered Issues ({issues.length})
            </h2>
            {issues.length > 0 ? (
              issues.map((issue) => {
                const category = ISSUE_CATEGORIES.find((c) => c.value === issue.category);
                const status = ISSUE_STATUSES.find((s) => s.value === issue.status);
                const isSelected = selectedIssue?.id === issue.id;

                return (
                  <Card
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className={`cursor-pointer transition-all duration-200 border-l-4 ${
                      isSelected
                        ? "border-l-primary bg-primary/5 shadow-md"
                        : "hover:bg-accent border-l-transparent hover:border-l-muted"
                    }`}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold truncate text-foreground">
                            {issue.title}
                          </CardTitle>
                          <CardDescription className="text-xs flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {issue.location}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge size="xs">{category?.label || "Other"}</Badge>
                        <Badge size="xs" tone={status?.tone}>
                          {status?.label || "Reported"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No issues match the selected filters.</p>
              </div>
            )}
          </div>

          {/* Right Panel: Interactive Leaflet Map */}
          <div className="lg:col-span-2 rounded-lg border border-border overflow-hidden h-full relative z-10">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              className="h-full w-full"
              style={{ background: "#cbd5e1" }}
            >
              <ChangeView center={mapCenter} zoom={mapZoom} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {issues.map((issue) => {
                const lat = Number(issue.latitude);
                const lng = Number(issue.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;

                const category = ISSUE_CATEGORIES.find((c) => c.value === issue.category);
                const status = ISSUE_STATUSES.find((s) => s.value === issue.status);

                return (
                  <Marker
                    key={issue.id}
                    position={[lat, lng]}
                    icon={createCustomIcon(issue.category)}
                    eventHandlers={{
                      click: () => setSelectedIssue(issue),
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-2 max-w-[220px]">
                        <h3 className="font-semibold text-sm leading-snug m-0 text-foreground">
                          {issue.title}
                        </h3>
                        <p className="text-xs text-muted-foreground m-0 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {issue.location}
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          <Badge size="xs">{category?.label || "Other"}</Badge>
                          <Badge size="xs" tone={status?.tone}>
                            {status?.label}
                          </Badge>
                        </div>
                        <p className="text-xs line-clamp-2 my-1 text-muted-foreground">
                          {issue.description}
                        </p>
                        <div className="flex justify-between items-center pt-2 border-t border-border">
                          <span className="text-xs font-semibold flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {issue.upvotes || 0}
                          </span>
                          <Button
                            size="xs"
                            onClick={() => navigate(`${ROUTES.ISSUES}/${issue.id}`)}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      ) : (
        /* List / Grid view of all issues */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {issues.length > 0 ? (
            issues.map((issue) => {
              const category = ISSUE_CATEGORIES.find((c) => c.value === issue.category);
              const status = ISSUE_STATUSES.find((s) => s.value === issue.status);
              const riskLevel = RISK_LEVELS.find((r) => r.value === issue.riskLevel);

              return (
                <Card
                  key={issue.id}
                  className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                    selectedIssue?.id === issue.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <CardHeader className="pb-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{issue.title}</CardTitle>
                        <CardDescription className="text-xs mt-0.5 truncate">{issue.location}</CardDescription>
                      </div>
                      <div
                        className={`h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${getCategoryColor(
                          issue.category,
                        )}`}
                      >
                        {issue.category?.substring(0, 1).toUpperCase()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge size="xs">{category?.label || "Other"}</Badge>
                      <Badge size="xs" tone={status?.tone}>
                        {status?.label}
                      </Badge>
                      <Badge size="xs" tone={riskLevel?.tone}>
                        {riskLevel?.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-1.5 border-t border-border">
                      <div>
                        <p className="text-muted-foreground font-medium">Upvotes</p>
                        <p className="font-semibold text-foreground">{formatCompact(issue.upvotes || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium">Priority</p>
                        <p className="font-semibold text-foreground">{issue.priority || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium">Reported</p>
                        <p className="font-semibold text-foreground truncate flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" />
                          {formatDate(issue.createdAt).split(",")[0]}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No issues found with selected filters</p>
            </Card>
          )}
        </div>
      )}

      {/* Selected issue details at bottom */}
      {selectedIssue && (
        <Card className="border-primary shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{selectedIssue.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {selectedIssue.location}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate(`${ROUTES.ISSUES}/${selectedIssue.id}`)}>
                Open Complete Details
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground leading-relaxed">
              {selectedIssue.description || "No description provided."}
            </p>
            <div className="flex flex-wrap gap-4 pt-2 border-t border-border text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Status:</span>
                <Badge tone={ISSUE_STATUSES.find((s) => s.value === selectedIssue.status)?.tone}>
                  {ISSUE_STATUSES.find((s) => s.value === selectedIssue.status)?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Risk Level:</span>
                <Badge tone={RISK_LEVELS.find((r) => r.value === selectedIssue.riskLevel)?.tone}>
                  {RISK_LEVELS.find((r) => r.value === selectedIssue.riskLevel)?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Upvotes:</span>
                <span className="font-semibold">{selectedIssue.upvotes || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
