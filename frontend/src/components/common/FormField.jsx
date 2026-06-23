import { forwardRef } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/utils/cn";

/**
 * Labeled input with inline error message. Spreads register() props.
 */
export const FormField = forwardRef(
  ({ id, label, error, type = "text", className, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <Label htmlFor={id}>{label}</Label>}
      {children || (
        <Input
          id={id}
          ref={ref}
          type={type}
          aria-invalid={Boolean(error)}
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
          {...props}
        />
      )}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  ),
);
FormField.displayName = "FormField";
