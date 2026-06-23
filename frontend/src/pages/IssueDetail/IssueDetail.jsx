import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ThumbsUp, MessageCircle, Share2, Clock, Sparkles, AlertTriangle, ShieldCheck, Copy, XSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/States";
import { ISSUE_CATEGORIES, ISSUE_STATUSES, RISK_LEVELS, ROUTES } from "@/utils/constants";
import { formatDate, formatCompact } from "@/utils/formatters";
import { api } from "@/config/api";
import { toast } from "sonner";

export default function IssueDetail() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upvoted, setUpvoted] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchIssue = async () => {
    try {
      const { data } = await api.get(`/issues/${issueId}`);
      setIssue(data);
    } catch (err) {
      setError(err.message || "Failed to load issue");
    }
  };

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/issues/${issueId}/comments`);
      setComments(data.comments || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchIssue(), fetchComments()]);
      setLoading(false);
    };
    loadData();
  }, [issueId]);

  const handleUpvote = async () => {
    try {
      if (!upvoted) {
        await api.post(`/issues/${issueId}/verify`, { type: "support" });
        setUpvoted(true);
        toast.success("Support registered successfully!");
        fetchIssue();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to register support");
    }
  };

  const handleVerify = async (type) => {
    try {
      const { data } = await api.post(`/issues/${issueId}/verify`, { type });
      toast.success(data.message || `Verification type '${type}' registered!`);
      fetchIssue();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to submit verification vote`);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await api.post(`/issues/${issueId}/comments`, { text: commentText });
      setCommentText("");
      toast.success("Comment posted!");
      fetchComments();
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading issue details..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => window.location.reload()} />;
  }

  if (!issue) {
    return (
      <EmptyState
        title="Issue not found"
        description="The issue you're looking for doesn't exist or has been deleted."
        action={{ label: "Go back", href: ROUTES.ISSUES }}
      />
    );
  }

  const category = ISSUE_CATEGORIES.find((c) => c.value === issue.category);
  const status = ISSUE_STATUSES.find((s) => s.value === issue.status);
  const riskLevel = RISK_LEVELS.find((r) => r.value === issue.riskLevel);

  // Dynamic severity level colors for AI insights
  const getSeverityColor = (score) => {
    if (score >= 70) return "text-destructive bg-destructive/10 border-destructive/20";
    if (score >= 40) return "text-yellow-600 bg-yellow-500/10 border-yellow-500/20";
    return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <main className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.ISSUES)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{issue.title}</h1>
          <p className="text-sm text-muted-foreground">Issue #{issueId}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Media Gallery */}
          {issue.media && issue.media.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Attached Media Proofs</CardTitle>
                <CardDescription>Images and videos captured at the issue site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {issue.media.map((m) => {
                    const isVideo = m.media_type?.startsWith("video/");
                    return (
                      <div key={m.id} className="relative rounded-lg border border-border overflow-hidden bg-muted aspect-video flex items-center justify-center">
                        {isVideo ? (
                          <video src={m.public_url} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={m.public_url} alt="Civic Issue Proof" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status and metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <Badge tone={status?.tone}>{status?.label}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                  <div className="mt-1">
                    <Badge tone={riskLevel?.tone}>{riskLevel?.label}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="mt-1 text-sm capitalize">{category?.label || issue.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location Coordinates</p>
                  <p className="mt-1 text-sm font-mono text-xs">{issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <CardDescription>Reported on {formatDate(issue.createdAt)} by {issue.authorName}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{issue.description || "No description provided."}</p>
            </CardContent>
          </Card>

          {/* AI Insights Panel */}
          {issue.aiInsights && (
            <Card className="border border-primary/20 bg-primary/5/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="h-24 w-24 text-primary" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-primary font-bold">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Gemini Vision AI Analysis
                  </CardTitle>
                  <CardDescription>Real-time autonomous review of issue severity, impact and resolution</CardDescription>
                </div>
                <Badge className={`px-2.5 py-1 border font-semibold ${getSeverityColor(issue.aiInsights.severity)}`}>
                  Severity: {issue.aiInsights.severity}/100
                </Badge>
              </CardHeader>
              <CardContent className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Category Mapping</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-foreground">{issue.aiInsights.category?.replace("_", " ")}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recommended Authority</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{issue.aiInsights.recommended_authority}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Urgency Rating</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{issue.aiInsights.estimated_urgency}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Agent Confidence</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{issue.aiInsights.confidence}%</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Situation Summary</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{issue.aiInsights.summary}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Community Impact</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{issue.aiInsights.impact}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Mitigation Recommendations</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{issue.aiInsights.mitigation_suggestions}</p>
                  </div>
                  <div className="rounded-md bg-primary/5 border border-primary/10 p-3 mt-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Suggested Corrective Action</h4>
                    <p className="mt-1 text-xs text-foreground font-medium">{issue.aiInsights.recommended_action}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments section */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>{comments.length} comments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment input */}
              <div className="space-y-2">
                <textarea
                  className="w-full h-24 px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <Button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || submittingComment}
                  className="w-full"
                >
                  {submittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </div>

              {/* Comments list */}
              {comments.length > 0 ? (
                <div className="space-y-3 border-t pt-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="text-sm border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-foreground">{comment.author}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                      </div>
                      <p className="text-muted-foreground">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Community Verification Panel */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Community Verification
              </CardTitle>
              <CardDescription>
                Validate reports to adjust regional priorities and reputation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center py-3 gap-1 hover:border-emerald-500 hover:bg-emerald-500/5"
                  onClick={() => handleVerify("verify")}
                >
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Verify Issue</span>
                  <span className="text-base font-extrabold text-foreground">{issue.verifications?.verify || 0}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center py-3 gap-1 hover:border-blue-500 hover:bg-blue-500/5"
                  onClick={() => handleVerify("support")}
                >
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Support</span>
                  <span className="text-base font-extrabold text-foreground">{issue.verifications?.support || 0}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center py-3 gap-1 hover:border-yellow-600 hover:bg-yellow-500/5"
                  onClick={() => handleVerify("duplicate")}
                >
                  <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">Duplicate</span>
                  <span className="text-base font-extrabold text-foreground">{issue.verifications?.duplicate || 0}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center py-3 gap-1 hover:border-rose-600 hover:bg-rose-500/5"
                  onClick={() => handleVerify("reject")}
                >
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Reject</span>
                  <span className="text-base font-extrabold text-foreground">{issue.verifications?.reject || 0}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={upvoted ? "default" : "outline"}
                className="w-full gap-2"
                onClick={handleUpvote}
                disabled={upvoted}
              >
                <ThumbsUp className="h-4 w-4" />
                {upvoted ? "Upvoted" : "Upvote / Support"} ({formatCompact(issue.upvotes || 0)})
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Issue URL copied to clipboard!");
                }}
              >
                <Share2 className="h-4 w-4" />
                Share Report
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Verification Support Count</p>
                <p className="text-2xl font-bold">{formatCompact(issue.upvotes || 0)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Community Comments</p>
                <p className="text-2xl font-bold">{formatCompact(comments.length)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Calculated Regional Priority</p>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-extrabold text-primary">{issue.priority || 0}</p>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Reported</p>
                    <p className="text-xs text-muted-foreground">{formatDate(issue.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
