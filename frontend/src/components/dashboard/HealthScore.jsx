import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

/**
 * Community Health Score gauge (semicircular SVG arc).
 * Score 0-100 -> color from warning to success.
 */
export function HealthScore({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 80;
  const circumference = Math.PI * radius; // semicircle
  const offset = circumference - (clamped / 100) * circumference;

  let color = "var(--color-success)";
  let label = "Healthy";
  if (clamped < 50) {
    color = "var(--color-destructive)";
    label = "Needs Attention";
  } else if (clamped < 75) {
    color = "var(--color-warning)";
    label = "Moderate";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Health Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative h-32 w-52">
          <svg viewBox="0 0 200 110" className="h-full w-full">
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="var(--color-muted)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
            <span className="text-4xl font-bold text-foreground">{clamped}</span>
            <span className="text-sm font-medium" style={{ color }}>
              {label}
            </span>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Based on resolution rate, response time, and active reports across your
          area.
        </p>
      </CardContent>
    </Card>
  );
}
