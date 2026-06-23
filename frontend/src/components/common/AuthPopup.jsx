import { useState } from "react";
import { useForm } from "react-hook-form";
import { LogIn, KeyRound, Mail, ArrowLeft, UserPlus, Shield } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

export function AuthPopup() {
  const { signIn, signUp, verifyOtp, configured } = useAuth();
  const [step, setStep] = useState("email"); // "email" or "otp"
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [emailAddress, setEmailAddress] = useState("");
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: { fullName: "", email: "", phone: "", otp: "" },
  });

  const onSendOtp = async (values) => {
    try {
      setEmailAddress(values.email);
      if (mode === "login") {
        await signIn({ email: values.email });
      } else {
        await signUp({
          email: values.email,
          fullName: values.fullName,
          phone: values.phone,
        });
      }
      toast.success("OTP verification code sent! Check your inbox.");
      setStep("otp");
    } catch (err) {
      toast.error(err.message || "Unable to send verification code. Try again.");
    }
  };

  const onVerifyOtp = async (values) => {
    try {
      setIsSubmittingOtp(true);
      await verifyOtp({ email: emailAddress, token: values.otp });
      toast.success("Access authorized successfully!");
      // The context state update will trigger re-render and clear the popup in Dashboard
    } catch (err) {
      toast.error(err.message || "Invalid or expired verification code.");
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/90 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md">
        
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">ResolveAI Identity Gateway</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Authentication is required to view regional analytics.
          </p>
        </div>

        {!configured && (
          <p className="mb-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-warning-foreground text-center">
            Database unconfigured. Using mock OTP mode (enter code: 123456).
          </p>
        )}

        {step === "email" ? (
          <>
            <div className="text-center sm:text-left mb-4">
              <h3 className="text-base font-semibold text-foreground">
                {mode === "login" ? "Sign In" : "Create Account"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {mode === "login"
                  ? "Enter your email to receive a login verification code."
                  : "Join the civic platform using your email."}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSendOtp)} className="space-y-4" noValidate>
              {mode === "register" && (
                <FormField
                  id="fullName"
                  label="Full Name"
                  placeholder="Jane Citizen"
                  error={errors.fullName?.message}
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: { value: 2, message: "Name is too short" },
                  })}
                />
              )}

              <FormField
                id="email"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                })}
              />

              {mode === "register" && (
                <FormField
                  id="phone"
                  label="Phone (optional)"
                  type="tel"
                  placeholder="+91 98765 43210"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Spinner className="text-primary-foreground" />
                ) : mode === "login" ? (
                  <LogIn className="size-4" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {isSubmitting
                  ? "Sending code..."
                  : mode === "login"
                  ? "Send Login Code"
                  : "Send Registration Code"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {mode === "login"
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Sign In"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="size-3" />
                Back
              </button>
              <h3 className="text-base font-semibold text-foreground">Verify OTP Code</h3>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit verification code sent to <strong className="text-foreground">{emailAddress}</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmit(onVerifyOtp)} className="space-y-4" noValidate>
              <FormField
                id="otp"
                label="One-Time Verification Code"
                type="text"
                placeholder="123456"
                error={errors.otp?.message}
                {...register("otp", {
                  required: "Verification code is required",
                  pattern: { value: /^\d{6}$/, message: "Code must be exactly 6 digits" },
                })}
              />

              <Button type="submit" className="w-full" size="lg" disabled={isSubmittingOtp}>
                {isSubmittingOtp ? (
                  <Spinner className="text-primary-foreground" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                {isSubmittingOtp ? "Verifying..." : "Verify & Gain Access"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
