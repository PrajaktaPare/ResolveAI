import { Card, CardContent } from "@/components/ui/Card";
import { Construction } from "lucide-react";

export default function Placeholder({ title, description }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Construction className="h-7 w-7" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {description ||
            "This module is part of the next build phase and will be available soon."}
        </p>
      </CardContent>
    </Card>
  );
}
