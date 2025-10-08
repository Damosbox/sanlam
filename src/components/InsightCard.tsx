import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, TrendingUp, Activity, AlertCircle, LucideIcon } from "lucide-react";

interface InsightCardProps {
  type: string;
  title: string;
  description: string;
  priority: string;
}

const typeConfig: Record<string, { icon: LucideIcon; label: string; className: string }> = {
  risk: { icon: AlertTriangle, label: "Risque", className: "text-destructive" },
  opportunity: { icon: TrendingUp, label: "Opportunité", className: "text-success" },
  trend: { icon: Activity, label: "Tendance", className: "text-primary" },
  alert: { icon: AlertCircle, label: "Alerte", className: "text-warning" },
};

const priorityVariants: Record<string, "destructive" | "default" | "secondary"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

const priorityLabels: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

export const InsightCard = ({ type, title, description, priority }: InsightCardProps) => {
  const config = typeConfig[type.toLowerCase()] || typeConfig.alert;
  const Icon = config.icon;
  const variant = priorityVariants[priority.toLowerCase()] || "default";
  const priorityLabel = priorityLabels[priority.toLowerCase()] || priority;

  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`p-2 rounded-lg bg-muted ${config.className}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{config.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          <Badge variant={variant} className="shrink-0">
            {priorityLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};
