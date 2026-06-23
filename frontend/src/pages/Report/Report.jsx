import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ErrorState, SuccessState } from "@/components/common/States";
import { ISSUE_CATEGORIES, RISK_LEVELS, ROUTES } from "@/utils/constants";
import { toast } from "sonner";
import { api } from "@/config/api";

// Leaflet imports
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
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

// Custom component to pan the map
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

// Custom map click event listener component
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function Report() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState(null);

  // Default center at New York City
  const defaultCenter = [40.7128, -74.006];
  const [markerPosition, setMarkerPosition] = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      riskLevel: "medium",
      latitude: "",
      longitude: "",
    },
  });

  const watchLatitude = watch("latitude");
  const watchLongitude = watch("longitude");

  // Synchronize inputs typed manually into marker location
  useEffect(() => {
    const lat = Number(watchLatitude);
    const lng = Number(watchLongitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      if (!markerPosition || markerPosition[0] !== lat || markerPosition[1] !== lng) {
        setMarkerPosition([lat, lng]);
      }
    }
  }, [watchLatitude, watchLongitude]);

  const handleMarkerChange = (coords) => {
    setMarkerPosition(coords);
    setValue("latitude", coords[0].toFixed(6));
    setValue("longitude", coords[1].toFixed(6));
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Retrieving your GPS location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleMarkerChange([latitude, longitude]);
        toast.success("Location determined successfully!");
      },
      (err) => {
        toast.error("Failed to retrieve location: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      console.log("[v0] Report submitted:", data);
      const response = await api.post("/issues", data);
      
      toast.success("Issue reported successfully!");
      setSuccess(true);

      setTimeout(() => {
        navigate(ROUTES.ISSUES);
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to submit report";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (success) {
    return (
      <SuccessState
        title="Report Submitted"
        message="Thank you! Your issue report has been received and will be reviewed by our team."
        action={{
          label: "View All Issues",
          onClick: () => navigate(ROUTES.ISSUES),
        }}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Submit"
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Report an Issue</h1>
        <p className="mt-2 text-muted-foreground">
          Help us improve your community by reporting civic issues with details and location.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo/Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Media
            </CardTitle>
            <CardDescription>
              Attach a photo or video of the issue (optional but recommended)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
              {preview ? (
                <div className="space-y-3">
                  <img
                    src={preview}
                    alt="Preview"
                    className="mx-auto h-40 w-40 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPreview(null);
                      document.getElementById("photo-input").value = "";
                    }}
                  >
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="space-y-2">
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Upload a photo</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Issue Details */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                placeholder="e.g., Large pothole on Main Street"
                {...register("title", { required: "Title is required" })}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...register("category")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Describe the issue in detail..."
                rows={4}
                {...register("description", { required: "Description is required" })}
                className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.description ? "border-destructive" : ""
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="risk-level">Risk Level</Label>
              <select
                id="risk-level"
                {...register("riskLevel")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {RISK_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                How urgent is this issue? (Critical = immediate safety concern)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary animate-pulse" />
                  Location
                </CardTitle>
                <CardDescription>
                  Pinpoint the issue on the interactive map or provide coordinates
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleLocateMe}>
                Locate Me
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Leaflet Map container */}
            <div className="h-[250px] w-full rounded-md border border-border overflow-hidden relative z-10">
              <MapContainer
                center={defaultCenter}
                zoom={12}
                className="h-full w-full"
                style={{ background: "#cbd5e1" }}
              >
                <ChangeView center={markerPosition} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker position={markerPosition} setPosition={handleMarkerChange} />
              </MapContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 40.7128"
                  {...register("latitude", { required: "Latitude is required" })}
                  className={errors.latitude ? "border-destructive" : ""}
                />
                {errors.latitude && (
                  <p className="mt-1 text-xs text-destructive">{errors.latitude.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g. -74.0060"
                  {...register("longitude", { required: "Longitude is required" })}
                  className={errors.longitude ? "border-destructive" : ""}
                />
                {errors.longitude && (
                  <p className="mt-1 text-xs text-destructive">{errors.longitude.message}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Click anywhere on the map to automatically fill in coordinates, or click &quot;Locate Me&quot; to fetch your current position.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => navigate(ROUTES.DASHBOARD)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
