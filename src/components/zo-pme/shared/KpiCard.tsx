import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  trend,
  trendDirection = "flat",
  icon: Icon,
}: {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: "up" | "down" | "flat";
  icon?: LucideIcon;
}) {
  const TrendIcon =
    trendDirection === "up" ? ArrowUpRight : trendDirection === "down" ? ArrowDownRight : ArrowRight;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs mt-1 flex items-center gap-1 truncate",
                  trendDirection === "up" && "text-[hsl(var(--success))]",
                  trendDirection === "down" && "text-destructive",
                  trendDirection === "flat" && "text-muted-foreground"
                )}
              >
                <TrendIcon className="h-3 w-3 shrink-0" />
                {trend}
              </p>
            )}
          </div>
          {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
        </div>
      </CardContent>
    </Card>
  );
}
