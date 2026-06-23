import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export function Spinner({ className, ...props }) {
  return (
    <Loader2
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
