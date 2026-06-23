import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import { logger } from "@/utils/logger";

const log = logger.child("forgot-password");

export default function ForgotPassword() {
  const { requestPasswordReset, configured } = useAuth();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "" } });

  async function onSubmit(values) {
    try {
      await requestPasswordReset(values.email);
      setSent(true);
      toast.success("Reset link sent. Check your inbox.");
    } catch (err) {
      log.error("Password reset failed:", err.message);
      toast.error(err.message || "Unable to send reset email.");
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="space-y-4 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success">
            <MailCheck className="size-7" aria-hidden="true" />
          </span>
          <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to{" "}
            <span className="font-medium text-foreground">{getValues("email")}</span>. Follow it to
            choose a new password.
          </p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Link
        to={ROUTES.LOGIN}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {!configured && (
        <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          Supabase is not configured yet. Add your credentials to enable password resets.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email", {
            required: "Email is required",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
          })}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="text-primary-foreground" /> : <Send className="size-4" />}
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
