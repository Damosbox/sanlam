import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";

interface RecommendationCardProps {
  action: string;
  impact: string;
  priority: string;
}

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

export const RecommendationCard = ({ action, impact, priority }: RecommendationCardProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const variant = priorityVariants[priority.toLowerCase()] || "default";
  const priorityLabel = priorityLabels[priority.toLowerCase()] || priority;

  return (
    <Card className={`transition-smooth hover:shadow-sm ${isChecked ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id={`rec-${action.substring(0, 20)}`}
            checked={isChecked}
            onCheckedChange={(checked) => setIsChecked(checked === true)}
            className="mt-1"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <label
                htmlFor={`rec-${action.substring(0, 20)}`}
                className={`text-sm font-medium leading-relaxed cursor-pointer ${
                  isChecked ? "line-through" : ""
                }`}
              >
                {action}
              </label>
              <Badge variant={variant} className="shrink-0 text-xs">
                {priorityLabel}
              </Badge>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{impact}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
