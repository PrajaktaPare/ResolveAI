import { Inbox, AlertTriangle, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

export function LoadingState({ label = "Loading...", className }) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center",
        className,
      )}
    >
      <span className="grid place-items-center rounded-full bg-muted p-3">
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {(description || message) && (
          <p className="max-w-sm text-sm text-muted-foreground">{description || message}</p>
        )}
      </div>
      {action && (
        <div className="mt-2">
          {action.href ? (
            <Link to={action.href}>
              <Button size="sm" variant="outline">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, description, onRetry, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <span className="grid place-items-center rounded-full bg-destructive/12 p-3">
        <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {(description || message) && (
          <p className="max-w-sm text-sm text-muted-foreground">{description || message}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function SuccessState({ title = "Success", message, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-success/30 bg-success/5 py-16 text-center",
        className,
      )}
    >
      <span className="grid place-items-center rounded-full bg-success/12 p-3">
        <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {message && <p className="max-w-sm text-sm text-muted-foreground">{message}</p>}
      </div>
      {action && (
        <Button
          size="sm"
          onClick={action.onClick}
          className="mt-2 gap-2"
        >
          {action.label} <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
