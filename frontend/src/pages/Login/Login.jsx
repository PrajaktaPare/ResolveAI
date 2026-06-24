import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, KeyRound, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import { logger } from "@/utils/logger";

const log = logger.child("login");

export default function Login() {
  const { signIn, verifyOtp, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [step, setStep] = useState("email"); // "email" or "otp"
  const [emailAddress, setEmailAddress] = useState("");
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", otp: "" } });

  const redirectTo = location.state?.from?.pathname || ROUTES.DASHBOARD;

  async function onSendOtp(values) {
    try {
      setEmailAddress(values.email);
      await signIn({ email: values.email });
      toast.success("OTP verification code sent! Check your inbox.");
      setStep("otp");
    } catch (err) {
      log.error("Failed to send OTP:", err.message);
      toast.error(err.message || "Unable to send verification code. Try again.");
    }
  }

  async function onVerifyOtp(values) {
    try {
      setIsSubmittingOtp(true);
      await verifyOtp({ email: emailAddress, token: values.otp });
      toast.success("Welcome back!");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      log.error("OTP verification failed:", err.message);
      toast.error(err.message || "Invalid or expired verification code.");
    } finally {
      setIsSubmittingOtp(false);
    }
  }

  return (
    <AuthLayout>
      {step === "email" ? (
        <>
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Sign in to your account</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email address to receive a one-time verification code.
            </p>
          </div>

          {!configured && (
            <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              Supabase is not configured yet. Using mock verification mode (enter any code).
            </p>
          )}

          <form onSubmit={handleSubmit(onSendOtp)} className="mt-6 space-y-4" noValidate>
            <FormField
              id="email"
              label="Email Address"
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
              {isSubmitting ? (
                <Spinner className="text-primary-foreground" />
              ) : (
                <Mail className="size-4" />
              )}
              {isSubmitting ? "Sending code..." : "Send Verification Code"}
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="space-y-2 text-center lg:text-left">
            <button
              onClick={() => setStep("email")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="size-3" />
              Back to email
            </button>
            <h2 className="text-2xl font-bold text-foreground">Enter verification code</h2>
            <p className="text-sm text-muted-foreground">
              We sent a verification code to <strong className="text-foreground">{emailAddress}</strong>.
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
              {isSubmittingOtp ? "Verifying..." : "Verify & Sign In"}
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to={ROUTES.REGISTER} className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
