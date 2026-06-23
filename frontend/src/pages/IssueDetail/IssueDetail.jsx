import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ThumbsUp, MessageCircle, Share2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
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

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/issues/${issueId}`);
        setIssue(data);
      } catch (err) {
        setError(err.message || "Failed to load issue");
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [issueId]);

  const handleUpvote = async () => {
    try {
      if (!upvoted) {
        await api.post(`/issues/${issueId}/upvote`);
        setUpvoted(true);
        toast.success("Upvote added!");
      }
    } catch (err) {
      toast.error("Failed to upvote");
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await api.post(`/issues/${issueId}/comments`, { text: commentText });
      setCommentText("");
      toast.success("Comment posted!");
      // Refetch comments
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

  return (
    <main className="space-y-6">
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
                  <p className="mt-1 text-sm">{category?.label}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="mt-1 text-sm">{issue.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <CardDescription>{formatDate(issue.createdAt)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{issue.description || "No description provided."}</p>
            </CardContent>
          </Card>

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
                  className="w-full h-24 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                    <div key={comment.id} className="text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{comment.author}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                      </div>
                      <p className="text-foreground">{comment.text}</p>
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
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={upvoted ? "default" : "outline"}
                className="w-full gap-2"
                onClick={handleUpvote}
              >
                <ThumbsUp className="h-4 w-4" />
                Upvote ({formatCompact(issue.upvotes || 0)})
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <MessageCircle className="h-4 w-4" />
                Comment
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <Share2 className="h-4 w-4" />
                Share
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
                <p className="text-xs font-medium text-muted-foreground">Upvotes</p>
                <p className="text-2xl font-bold">{formatCompact(issue.upvotes || 0)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Comments</p>
                <p className="text-2xl font-bold">{formatCompact(comments.length)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Priority Score</p>
                <p className="text-2xl font-bold">{issue.priority || 0}</p>
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
                    <p className="font-medium">Reported</p>
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
