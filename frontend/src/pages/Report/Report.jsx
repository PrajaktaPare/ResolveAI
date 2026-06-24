import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, AlertCircle, X, Film, Trash2 } from "lucide-react";
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
  
  // Media pipeline states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Duplicate detection states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateIssues, setDuplicateIssues] = useState([]);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);

  // Default center at New Delhi, India
  const defaultCenter = [28.6139, 77.2090];
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
    await submitData(data, false);
  };

  const submitData = async (data, bypassDuplicateCheck = false) => {
    try {
      setLoading(true);
      setError(null);

      // Perform duplicate check if not bypassed
      if (!bypassDuplicateCheck) {
        toast.info("Checking for nearby duplicates...");
        const { data: dupData } = await api.get("/issues/check-duplicate", {
          params: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        });

        if (dupData?.hasDuplicates && dupData.duplicates.length > 0) {
          setDuplicateIssues(dupData.duplicates);
          setPendingSubmitData(data);
          setShowDuplicateModal(true);
          setLoading(false);
          return;
        }
      }

      // If no duplicates or user chose to bypass:
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("riskLevel", data.riskLevel);
      formData.append("latitude", data.latitude);
      formData.append("longitude", data.longitude);

      selectedFiles.forEach((file) => {
        formData.append("media", file);
      });

      console.log("[issues] Report submitting FormData with files count:", selectedFiles.length);
      await api.post("/issues", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    
    // Size and validation checks
    const validFiles = [];
    const newPreviews = [...previews];

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 10MB limit`);
        return;
      }
      
      validFiles.push(file);

      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");
      
      newPreviews.push({
        name: file.name,
        type: file.type,
        url: fileUrl,
        isVideo,
      });
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews(newPreviews);
  };

  const removeFile = (index) => {
    // Revoke the object URL to avoid memory leaks
    if (previews[index]) {
      URL.revokeObjectURL(previews[index].url);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  if (success) {
    return (
      <SuccessState
        title="Report Submitted"
        message="Thank you! Your issue report has been received and is being analyzed by the Gemini Vision agent."
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
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Report an Issue</h1>
        <p className="mt-2 text-muted-foreground">
          Help us improve your community by reporting civic issues with details, location, and photos/videos.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo/Media Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Upload Photos or Videos
            </CardTitle>
            <CardDescription>
              Attach visual proofs of the issue. Media files will be analyzed by Gemini AI to extract insights. (Max 10MB per file)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors">
              <label className="cursor-pointer block">
                <div className="space-y-2">
                  <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Click to upload media</p>
                  <p className="text-xs text-muted-foreground">Accepts images and video files</p>
                </div>
                <input
                  id="media-input"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative rounded-lg border border-border bg-muted/40 p-2 group overflow-hidden">
                    {preview.isVideo ? (
                      <div className="flex h-32 items-center justify-center bg-black/10 rounded-md">
                        <Film className="h-10 w-10 text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={preview.url}
                        alt={`Preview ${index}`}
                        className="h-32 w-full rounded-md object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="rounded-full bg-destructive p-2 text-destructive-foreground hover:bg-destructive/80 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground truncate px-1">
                      {preview.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
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
                  placeholder="e.g. 28.6139"
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
                  placeholder="e.g. 77.2090"
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

      {/* Duplicate Warning Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-warning">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-xl font-bold text-foreground">Possible Duplicate Issues Found</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              We detected existing reports reported within 200 meters of your coordinates. You can join/view an existing issue or submit your new report anyway.
            </p>

            <div className="mt-4 max-h-[200px] overflow-y-auto space-y-3 pr-1">
              {duplicateIssues.map((dup) => (
                <div key={dup.id} className="rounded-lg border border-border bg-muted/40 p-3 hover:bg-muted/80 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{dup.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{dup.description}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                          {dup.category}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground uppercase">
                          {dup.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground self-center">
                          {Math.round(dup.distance)}m away
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDuplicateModal(false);
                        navigate(`/issues/${dup.id}`);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  setShowDuplicateModal(false);
                  submitData(pendingSubmitData, true);
                }}
              >
                Create New Report Anyway
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDuplicateModal(false);
                  setPendingSubmitData(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
