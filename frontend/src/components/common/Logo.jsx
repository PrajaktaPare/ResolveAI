import { ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";
import { APP_NAME } from "@/utils/constants";

export function Logo({ className, showText = true, size = "default" }) {
  const iconSize = size === "lg" ? "size-8" : "size-6";
  const textSize = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid place-items-center rounded-lg bg-primary p-1.5 text-primary-foreground">
        <ShieldCheck className={iconSize} aria-hidden="true" />
      </span>
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", textSize)}>
          Resolve<span className="text-primary">AI</span>
        </span>
      )}
      <span className="sr-only">{APP_NAME}</span>
    </span>
  );
}
