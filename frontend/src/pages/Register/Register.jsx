import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import { logger } from "@/utils/logger";

const log = logger.child("register");

export default function Register() {
  const { signUp, configured } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const password = watch("password");

  async function onSubmit(values) {
    try {
      const data = await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
      });
      if (data?.session) {
        toast.success("Account created! Welcome to ResolveAI.");
        navigate(ROUTES.DASHBOARD, { replace: true });
      } else {
        toast.success("Account created. Please check your email to confirm, then sign in.");
        navigate(ROUTES.LOGIN, { replace: true });
      }
    } catch (err) {
      log.error("Registration failed:", err.message);
      toast.error(err.message || "Unable to create account.");
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Join your community and start resolving issues with AI.
        </p>
      </div>

      {!configured && (
        <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          Supabase is not configured yet. Add your credentials to enable sign up.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormField
          id="fullName"
          label="Full name"
          placeholder="Jane Citizen"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register("fullName", {
            required: "Full name is required",
            minLength: { value: 2, message: "Name is too short" },
          })}
        />

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

        <FormField
          id="phone"
          label="Phone (optional)"
          type="tel"
          placeholder="+91 98765 43210"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              className={errors.password ? "border-destructive pr-10" : "pr-10"}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Use at least 8 characters" },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="Re-enter password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === password || "Passwords do not match",
          })}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <Spinner className="text-primary-foreground" />
          ) : (
            <UserPlus className="size-4" />
          )}
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
