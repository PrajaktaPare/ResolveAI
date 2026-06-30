import { useState, useEffect } from "react";
import { MapPin, AlertCircle, Filter, Grid3x3, ThumbsUp, Calendar, Globe } from "lucide-react";
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

// Geographic Location hierarchy data for map centering
const LOCATIONS_DATA = {
  countries: [
    {
      name: "India",
      code: "IN",
      center: [20.5937, 78.9629],
      zoom: 5,
      states: [
        {
          name: "Delhi",
          center: [28.6139, 77.2090],
          zoom: 10,
          districts: [
            {
              name: "New Delhi",
              center: [28.6139, 77.2090],
              zoom: 12,
              areas: [
                { name: "Connaught Place", center: [28.6304, 77.2177], zoom: 15 },
                { name: "Chanakyapuri", center: [28.5916, 77.1856], zoom: 15 },
                { name: "Karol Bagh", center: [28.6514, 77.1907], zoom: 15 },
              ]
            },
            {
              name: "South Delhi",
              center: [28.5300, 77.2200],
              zoom: 12,
              areas: [
                { name: "Saket", center: [28.5244, 77.2066], zoom: 15 },
                { name: "Hauz Khas", center: [28.5494, 77.2001], zoom: 15 },
                { name: "Greater Kailash", center: [28.5482, 77.2347], zoom: 15 },
              ]
            },
            {
              name: "North Delhi",
              center: [28.6826, 77.2250],
              zoom: 12,
              areas: [
                { name: "Civil Lines", center: [28.6826, 77.2250], zoom: 15 },
                { name: "Pitampura", center: [28.6990, 77.1384], zoom: 15 },
                { name: "Rohini", center: [28.7041, 77.1025], zoom: 15 },
              ]
            }
          ]
        },
        {
          name: "Maharashtra",
          center: [19.7515, 75.7139],
          zoom: 7,
          districts: [
            {
              name: "Mumbai",
              center: [19.0760, 72.8777],
              zoom: 12,
              areas: [
                { name: "Nariman Point", center: [18.9269, 72.8228], zoom: 15 },
                { name: "Bandra", center: [19.0596, 72.8295], zoom: 15 },
                { name: "Andheri", center: [19.1136, 72.8697], zoom: 15 },
              ]
            },
            {
              name: "Pune",
              center: [18.5204, 73.8567],
              zoom: 12,
              areas: [
                { name: "Kothrud", center: [18.5074, 73.8077], zoom: 15 },
                { name: "Koregaon Park", center: [18.5362, 73.8930], zoom: 15 },
                { name: "Shivajinagar", center: [18.5312, 73.8446], zoom: 15 },
              ]
            },
            {
              name: "Nagpur",
              center: [21.1458, 79.0882],
              zoom: 12,
              areas: [
                { name: "Dharampeth", center: [21.1432, 79.0617], zoom: 15 },
                { name: "Sadar", center: [21.1614, 79.0805], zoom: 15 },
                { name: "Wardhaman Nagar", center: [21.1491, 79.1232], zoom: 15 },
              ]
            }
          ]
        },
        {
          name: "Karnataka",
          center: [15.3173, 75.7139],
          zoom: 7,
          districts: [
            {
              name: "Bengaluru Urban",
              center: [12.9716, 77.5946],
              zoom: 12,
              areas: [
                { name: "Koramangala", center: [12.9352, 77.6244], zoom: 15 },
                { name: "Indiranagar", center: [12.9784, 77.6408], zoom: 15 },
                { name: "Whitefield", center: [12.9698, 77.7499], zoom: 15 },
              ]
            },
            {
              name: "Mysuru",
              center: [12.2958, 76.6394],
              zoom: 12,
              areas: [
                { name: "Gokulam", center: [12.3323, 76.6266], zoom: 15 },
                { name: "Vidyaranyapuram", center: [12.2798, 76.6570], zoom: 15 },
                { name: "Jayalakshmipuram", center: [12.3242, 76.6298], zoom: 15 },
              ]
            }
          ]
        },
        {
          name: "Tamil Nadu",
          center: [11.1271, 78.6569],
          zoom: 7,
          districts: [
            {
              name: "Chennai",
              center: [13.0827, 80.2707],
              zoom: 12,
              areas: [
                { name: "Adyar", center: [13.0012, 80.2565], zoom: 15 },
                { name: "T. Nagar", center: [13.0418, 80.2341], zoom: 15 },
                { name: "Mylapore", center: [13.0333, 80.2686], zoom: 15 },
              ]
            },
            {
              name: "Coimbatore",
              center: [11.0168, 76.9558],
              zoom: 12,
              areas: [
                { name: "Gandhipuram", center: [11.0181, 76.9681], zoom: 15 },
                { name: "Peelamedu", center: [11.0287, 77.0261], zoom: 15 },
                { name: "RS Puram", center: [11.0118, 76.9446], zoom: 15 },
              ]
            }
          ]
        },
        {
          name: "Uttar Pradesh",
          center: [26.8467, 80.9462],
          zoom: 7,
          districts: [
            {
              name: "Lucknow",
              center: [26.8467, 80.9462],
              zoom: 12,
              areas: [
                { name: "Hazratganj", center: [26.8505, 80.9442], zoom: 15 },
                { name: "Gomti Nagar", center: [26.8488, 80.9995], zoom: 15 },
                { name: "Aliganj", center: [26.8920, 80.9458], zoom: 15 },
              ]
            },
            {
              name: "Gautam Buddha Nagar (Noida)",
              center: [28.5355, 77.3910],
              zoom: 12,
              areas: [
                { name: "Sector 15", center: [28.5815, 77.3130], zoom: 15 },
                { name: "Sector 62", center: [28.6186, 77.3695], zoom: 15 },
                { name: "Sector 18", center: [28.5708, 77.3261], zoom: 15 },
              ]
            }
          ]
        }
      ]
    },
    {
      name: "United States",
      code: "US",
      center: [37.0902, -95.7129],
      zoom: 4,
      states: [
        {
          name: "New York",
          center: [42.1657, -74.9481],
          zoom: 7,
          districts: [
            {
              name: "New York City",
              center: [40.7128, -74.0060],
              zoom: 11,
              areas: [
                { name: "Manhattan", center: [40.7831, -73.9712], zoom: 14 },
                { name: "Brooklyn", center: [40.6782, -73.9442], zoom: 14 },
                { name: "Queens", center: [40.7282, -73.7949], zoom: 14 },
              ]
            }
          ]
        },
        {
          name: "California",
          center: [36.7783, -119.4179],
          zoom: 6,
          districts: [
            {
              name: "Los Angeles",
              center: [34.0522, -118.2437],
              zoom: 11,
              areas: [
                { name: "Hollywood", center: [34.0928, -118.3287], zoom: 14 },
                { name: "Santa Monica", center: [34.0194, -118.4912], zoom: 14 },
              ]
            },
            {
              name: "San Francisco",
              center: [37.7749, -122.4194],
              zoom: 12,
              areas: [
                { name: "Financial District", center: [37.7954, -122.4027], zoom: 15 },
                { name: "Mission District", center: [37.7599, -122.4148], zoom: 15 },
              ]
            }
          ]
        }
      ]
    }
  ]
};

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

  // Geographic state variables
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  // Center on New Delhi, India by default
  const defaultCenter = [28.6139, 77.2090];
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(11);

  // Geographic change handlers
  const handleCountryChange = (e) => {
    const val = e.target.value;
    setSelectedCountry(val);
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedArea("");
    
    if (val) {
      const country = LOCATIONS_DATA.countries.find((c) => c.name === val);
      if (country) {
        setMapCenter(country.center);
        setMapZoom(country.zoom);
      }
    } else {
      setMapCenter(defaultCenter);
      setMapZoom(11);
    }
  };

  const handleStateChange = (e) => {
    const val = e.target.value;
    setSelectedState(val);
    setSelectedDistrict("");
    setSelectedArea("");
    
    if (val) {
      const country = LOCATIONS_DATA.countries.find((c) => c.name === selectedCountry);
      const stateObj = country?.states.find((s) => s.name === val);
      if (stateObj) {
        setMapCenter(stateObj.center);
        setMapZoom(stateObj.zoom);
      }
    } else {
      const country = LOCATIONS_DATA.countries.find((c) => c.name === selectedCountry);
      if (country) {
        setMapCenter(country.center);
        setMapZoom(country.zoom);
      }
    }
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setSelectedDistrict(val);
    setSelectedArea("");
    
    if (val) {
      const country = LOCATIONS_DATA.countries.find((c) => c.name === selectedCountry);
      const stateObj = country?.states.find((s) => s.name === selectedState);
      const districtObj = stateObj?.districts.find((d) => d.name === val);
      if (districtObj) {
        setMapCenter(districtObj.center);
        setMapZoom(districtObj.zoom);
      }
    } else {
      const country = LOCATIONS_DATA.countries.find((c) => c.name === selectedCountry);
      const stateObj = country?.states.find((s) => s.name === selectedState);
      if (stateObj) {
        setMapCenter(stateObj.center);
        setMapZoom(stateObj.zoom);
      }
    }
  };

  const handleAreaChange = (e) => {
    const val = e.target.value;
    setSelectedArea(val);
    
    if (val) {
      const country = LOCATIONS_DATA.countries.find((c) => c.name === selectedCountry);
      const stateObj = country?.states.find((s) => s.name === selectedState);
      const districtObj = stateObj?.districts.find((d) => d.name === selectedDistrict);
      const areaObj = districtObj?.areas.find((a) => a.name === val);
      if (areaObj) {
        setMapCenter(areaObj.center);
        setMapZoom(areaObj.zoom);
      }
    } else {
      const country = LOCATIONS_DATA.countries.find((c) => c.name === selectedCountry);
      const stateObj = country?.states.find((s) => s.name === selectedState);
      const districtObj = stateObj?.districts.find((d) => d.name === selectedDistrict);
      if (districtObj) {
        setMapCenter(districtObj.center);
        setMapZoom(districtObj.zoom);
      }
    }
  };

  // Comprehensive mock issues for map display with real Indian GPS coordinates
  const MOCK_MAP_ISSUES = [
    { id: "map-1", title: "Critical pothole on NH-48", description: "Deep pothole causing vehicle damage near toll plaza.", category: "pothole", status: "in_progress", riskLevel: "critical", location: "NH-48, Sector 31, Gurgaon", latitude: 28.4595, longitude: 77.0266, upvotes: 47, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-2", title: "Sewage overflow at Saket Metro", description: "Sewage water flooding metro station exit pathway.", category: "water_leakage", status: "prioritized", riskLevel: "high", location: "Saket District Centre, New Delhi", latitude: 28.5244, longitude: 77.2066, upvotes: 38, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-3", title: "Open manhole at Nehru Place", description: "Uncovered manhole on main pedestrian walkway.", category: "open_manhole", status: "reported", riskLevel: "critical", location: "Nehru Place, New Delhi", latitude: 28.5491, longitude: 77.2529, upvotes: 56, createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-4", title: "Garbage dump at Chandni Chowk", description: "Large garbage pile blocking half the road.", category: "garbage", status: "in_progress", riskLevel: "high", location: "Chandni Chowk, Old Delhi", latitude: 28.6507, longitude: 77.2334, upvotes: 29, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-5", title: "Broken streetlights on Janpath", description: "Multiple streetlights out on 500m stretch.", category: "broken_streetlight", status: "assigned", riskLevel: "medium", location: "Janpath, New Delhi", latitude: 28.6266, longitude: 77.2182, upvotes: 22, createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-6", title: "Water leakage at Hauz Khas", description: "Continuous water seepage from underground pipe.", category: "water_leakage", status: "verified", riskLevel: "high", location: "Hauz Khas Village, New Delhi", latitude: 28.5494, longitude: 77.2001, upvotes: 31, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-7", title: "Pothole cluster at Karol Bagh", description: "Series of potholes damaging 2-wheelers regularly.", category: "pothole", status: "verified", riskLevel: "high", location: "Karol Bagh, New Delhi", latitude: 28.6514, longitude: 77.1907, upvotes: 27, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-8", title: "Waterlogging at Minto Bridge", description: "Chronic waterlogging making underpass impassable.", category: "water_leakage", status: "resolved", riskLevel: "high", location: "Minto Bridge, New Delhi", latitude: 28.6304, longitude: 77.2177, upvotes: 71, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-9", title: "Road cave-in at Bandra-Worli Sea Link", description: "Section of approach road has caved in.", category: "road_damage", status: "in_progress", riskLevel: "critical", location: "Bandra-Worli, Mumbai", latitude: 19.0330, longitude: 72.8166, upvotes: 52, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-10", title: "Pothole at Andheri flyover", description: "Large pothole at top of flyover causing accidents.", category: "pothole", status: "resolved", riskLevel: "high", location: "Andheri Flyover, Mumbai", latitude: 19.1136, longitude: 72.8697, upvotes: 63, createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-11", title: "Streetlight flickering on Marine Drive", description: "Heritage lamp posts not functioning properly.", category: "broken_streetlight", status: "resolved", riskLevel: "low", location: "Marine Drive, Mumbai", latitude: 18.9440, longitude: 72.8233, upvotes: 18, createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-12", title: "Footpath tiles broken at FC Road", description: "Broken tiles creating tripping hazard for pedestrians.", category: "public_infrastructure_damage", status: "verified", riskLevel: "medium", location: "FC Road, Pune", latitude: 18.5233, longitude: 73.8412, upvotes: 15, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-13", title: "Collapse at Koregaon Park footpath", description: "Entire footpath section has sunk after rains.", category: "public_infrastructure_damage", status: "prioritized", riskLevel: "medium", location: "Koregaon Park, Pune", latitude: 18.5362, longitude: 73.8930, upvotes: 19, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-14", title: "Open manhole at Residency Road", description: "Missing manhole cover near busy intersection.", category: "open_manhole", status: "prioritized", riskLevel: "critical", location: "Residency Road, Bengaluru", latitude: 12.9716, longitude: 77.5946, upvotes: 41, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-15", title: "Road cave-in at Koramangala", description: "Major road section collapsed after pipeline burst.", category: "road_damage", status: "in_progress", riskLevel: "critical", location: "4th Block, Koramangala, Bengaluru", latitude: 12.9352, longitude: 77.6244, upvotes: 52, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-16", title: "Garbage pile near Indiranagar", description: "Uncollected garbage for 5+ days near residential area.", category: "garbage", status: "assigned", riskLevel: "medium", location: "Indiranagar, Bengaluru", latitude: 12.9784, longitude: 77.6408, upvotes: 34, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-17", title: "Broken park bench at Lodhi Garden", description: "Cast iron bench broken, sharp edges exposed.", category: "public_infrastructure_damage", status: "reported", riskLevel: "low", location: "Lodhi Garden, New Delhi", latitude: 28.5916, longitude: 77.2193, upvotes: 9, createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "map-18", title: "Water main burst at Connaught Place", description: "Underground water main creating sinkhole.", category: "water_leakage", status: "reported", riskLevel: "critical", location: "Block A, Connaught Place", latitude: 28.6315, longitude: 77.2167, upvotes: 44, createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const { data, loading, error, refetch } = useFetch(
    async () => {
      try {
        const { data } = await api.get("/issues/map/data", {
          params: {
            category: categoryFilter !== "all" ? categoryFilter : undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
          },
        });
        const issues = data?.issues || [];
        return { issues: issues.length > 0 ? issues : MOCK_MAP_ISSUES };
      } catch (err) {
        console.error("Map API error:", err);
        return { issues: MOCK_MAP_ISSUES };
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

      {/* Geographic Location Navigator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <Globe className="h-4 w-4 text-primary animate-pulse" />
            Geographic Location Navigator
          </CardTitle>
          <CardDescription>
            Select a region to automatically pan and zoom the map focus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</label>
              <select
                value={selectedCountry}
                onChange={handleCountryChange}
                className="w-full mt-1.5 px-3 py-2 border border-input bg-card rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="">Select Country</option>
                {LOCATIONS_DATA.countries.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">State</label>
              <select
                value={selectedState}
                onChange={handleStateChange}
                disabled={!selectedCountry}
                className="w-full mt-1.5 px-3 py-2 border border-input bg-card rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-50 disabled:bg-muted"
              >
                <option value="">Select State</option>
                {selectedCountry &&
                  LOCATIONS_DATA.countries
                    .find((c) => c.name === selectedCountry)
                    ?.states.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">District</label>
              <select
                value={selectedDistrict}
                onChange={handleDistrictChange}
                disabled={!selectedState}
                className="w-full mt-1.5 px-3 py-2 border border-input bg-card rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-50 disabled:bg-muted"
              >
                <option value="">Select District</option>
                {selectedState &&
                  LOCATIONS_DATA.countries
                    .find((c) => c.name === selectedCountry)
                    ?.states.find((s) => s.name === selectedState)
                    ?.districts.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Area / Village</label>
              <select
                value={selectedArea}
                onChange={handleAreaChange}
                disabled={!selectedDistrict}
                className="w-full mt-1.5 px-3 py-2 border border-input bg-card rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-50 disabled:bg-muted"
              >
                <option value="">Select Area / Village</option>
                {selectedDistrict &&
                  LOCATIONS_DATA.countries
                    .find((c) => c.name === selectedCountry)
                    ?.states.find((s) => s.name === selectedState)
                    ?.districts.find((d) => d.name === selectedDistrict)
                    ?.areas.map((a) => (
                      <option key={a.name} value={a.name}>
                        {a.name}
                      </option>
                    ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

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
                className="w-full mt-1.5 px-3 py-2 border border-input bg-card rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
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
                className="w-full mt-1.5 px-3 py-2 border border-input bg-card rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
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
                  setSelectedCountry("");
                  setSelectedState("");
                  setSelectedDistrict("");
                  setSelectedArea("");
                  setMapCenter(defaultCenter);
                  setMapZoom(11);
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
