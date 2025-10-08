import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "warning";
}

export const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend,
  variant = "default" 
}: StatCardProps) => {
  const colorClass = {
    default: "text-primary",
    success: "text-[hsl(var(--bright-green))]",
    warning: "text-[hsl(var(--orange))]"
  }[variant];

  return (
    <Card className="p-6 transition-base hover:shadow-medium">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-bold mb-1">{value}</p>
          {trend && (
            <p className="text-sm text-muted-foreground">{trend}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${colorClass} bg-current/10 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
    </Card>
  );
};
