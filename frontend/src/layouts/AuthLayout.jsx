import { Link, Outlet } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { APP_TAGLINE } from "@/utils/constants";

const HIGHLIGHTS = [
  "AI-powered issue categorization & severity scoring",
  "Community verification and civic priority engine",
  "Predictive risk insights and resolution plans",
  "Live impact dashboard and community health scores",
];

export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex lg:w-[44%]">
        <Link to="/" className="inline-flex">
          <Logo size="lg" className="[&_span.text-primary]:text-primary-foreground/80" />
        </Link>
        <div className="space-y-6">
          <h1 className="text-balance text-3xl font-bold leading-tight">
            From reporting problems to resolving communities.
          </h1>
          <p className="max-w-md text-pretty text-primary-foreground/80">
            ResolveAI turns citizen reports into intelligent, prioritized, and trackable civic
            action.
          </p>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-primary-foreground/90">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} ResolveAI. Community Intelligence Platform.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between p-6">
          <Link to="/" className="inline-flex lg:hidden">
            <Logo />
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md animate-in">
            {children || <Outlet />}
            <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
              {APP_TAGLINE}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
