import { Link } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Camera,
  Map as MapIcon,
  ShieldCheck,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, APP_TAGLINE } from "@/utils/constants";
import { DEMO_CREDENTIALS } from "@/services/authService";

const FEATURES = [
  {
    icon: Camera,
    title: "Media-based reporting",
    body: "Snap a photo or short video. Auto-capture GPS or pin the spot on a map.",
  },
  {
    icon: Brain,
    title: "AI categorization",
    body: "Gemini Vision detects the issue type, severity, safety risk, and confidence.",
  },
  {
    icon: Users,
    title: "Community verification",
    body: "Nearby citizens verify and support reports to build trust and stop spam.",
  },
  {
    icon: TrendingUp,
    title: "Civic priority engine",
    body: "A dynamic 0-100 score blends severity, risk, verification, and impact.",
  },
  {
    icon: MapIcon,
    title: "Interactive geo-mapping",
    body: "See hotspots, heatmaps, and high-priority zones across your locality.",
  },
  {
    icon: Activity,
    title: "Impact dashboard",
    body: "Track resolution trends and community health scores in real time.",
  },
];

const STATS = [
  { value: "12,400+", label: "Issues reported" },
  { value: "3,460", label: "Active citizens" },
  { value: "71%", label: "Resolution rate" },
  { value: "4.2d", label: "Avg resolution" },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const primaryCta = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.REGISTER;
  const primaryLabel = isAuthenticated ? "Go to dashboard" : "Get started free";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Sign in
            </Link>
            <Link
              to={primaryCta}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {primaryLabel} <ArrowRight className="size-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> Community Intelligence Platform
          </span>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            From reporting problems to{" "}
            <span className="text-primary">resolving communities</span>.
          </h1>
          <p className="max-w-xl text-pretty text-lg text-muted-foreground">
            ResolveAI uses AI to transform civic issue reporting into intelligent prioritization,
            risk prediction, and trackable resolution &mdash; built for citizens and municipalities.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={primaryCta}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {primaryLabel} <ArrowRight className="size-5" />
            </Link>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex h-11 items-center justify-center rounded-md border border-border px-6 text-base font-medium text-foreground transition-colors hover:bg-accent"
            >
              Sign in
            </Link>
          </div>

          {/* Demo credentials banner */}
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs">
            <span className="text-base">🔑</span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">Demo:</strong>{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">{DEMO_CREDENTIALS.email}</code>{" "}
              &bull; OTP:{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">{DEMO_CREDENTIALS.otpCode}</code>
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
            <img
              src="/images/hero-city.png"
              alt="Aerial view of a well-maintained city neighborhood"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground">
            Everything a modern civic platform needs
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Not just complaint management &mdash; an intelligent system that prioritizes, predicts,
            and helps resolve.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-6">
                <span className="inline-grid place-items-center rounded-lg bg-primary/12 p-2.5 text-primary">
                  <f.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <h2 className="text-balance text-3xl font-bold">Ready to resolve your community?</h2>
            <p className="max-w-md text-pretty text-primary-foreground/80">{APP_TAGLINE}</p>
            <Link
              to={primaryCta}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-background px-6 text-base font-medium text-foreground transition-colors hover:bg-background/90"
            >
              {primaryLabel} <ArrowRight className="size-5" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ResolveAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
