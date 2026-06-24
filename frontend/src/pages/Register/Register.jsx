import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import { logger } from "@/utils/logger";

const log = logger.child("register");

export default function Register() {
  const { signUp, verifyOtp, configured } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState("register"); // "register" or "otp"
  const [emailAddress, setEmailAddress] = useState("");
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { fullName: "", email: "", phone: "", otp: "" },
  });

  async function onRegisterSubmit(values) {
    try {
      setEmailAddress(values.email);
      await signUp({
        email: values.email,
        fullName: values.fullName,
        phone: values.phone,
      });
      toast.success("Verification code sent to your email!");
      setStep("otp");
    } catch (err) {
      log.error("Registration failed:", err.message);
      toast.error(err.message || "Unable to create account. Try again.");
    }
  }

  async function onVerifyOtp(values) {
    try {
      setIsSubmittingOtp(true);
      await verifyOtp({ email: emailAddress, token: values.otp });
      toast.success("Account created and verified successfully!");
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      log.error("OTP verification failed:", err.message);
      toast.error(err.message || "Invalid or expired verification code.");
    } finally {
      setIsSubmittingOtp(false);
    }
  }

  return (
    <AuthLayout>
      {step === "register" ? (
        <>
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
            <p className="text-sm text-muted-foreground">
              Join your community and start resolving issues with AI.
            </p>
          </div>

          {!configured && (
            <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              Supabase is not configured yet. Using mock verification mode (enter any code).
            </p>
          )}

          <form onSubmit={handleSubmit(onRegisterSubmit)} className="mt-6 space-y-4" noValidate>
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

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner className="text-primary-foreground" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="space-y-2 text-center lg:text-left">
            <button
              onClick={() => setStep("register")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="size-3" />
              Back to registration
            </button>
            <h2 className="text-2xl font-bold text-foreground">Enter verification code</h2>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit OTP code to <strong className="text-foreground">{emailAddress}</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit(onVerifyOtp)} className="mt-6 space-y-4" noValidate>
            <FormField
              id="otp"
              label="One-Time Verification Code"
              type="text"
              placeholder="123456"
              autoComplete="one-time-code"
              error={errors.otp?.message}
              {...register("otp", {
                required: "Verification code is required",
                pattern: { value: /^\d{6,8}$/, message: "Code must be 6 to 8 digits" },
              })}
            />

            <Button type="submit" className="w-full" size="lg" disabled={isSubmittingOtp}>
              {isSubmittingOtp ? (
                <Spinner className="text-primary-foreground" />
              ) : (
                <KeyRound className="size-4" />
              )}
              {isSubmittingOtp ? "Verifying..." : "Verify & Create Account"}
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
