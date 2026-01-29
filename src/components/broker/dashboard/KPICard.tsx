import { LucideIcon, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  link?: string;
  highlight?: boolean;
  trend?: string;
}

export const KPICard = ({ icon: Icon, label, value, link, highlight, trend }: KPICardProps) => {
  const content = (
    <Card
      className={cn(
        "border-border/60 hover:shadow-soft transition-all duration-200 h-full",
        highlight && "bg-primary/5 border-primary/30",
        link && "cursor-pointer hover:border-primary/40"
      )}
    >
      <CardContent className="p-3 sm:p-4 flex justify-between items-start h-full">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-0.5 sm:mb-1 truncate">
            {label}
          </p>
          <p
            className={cn(
              "text-base sm:text-xl font-bold tracking-tight truncate",
              highlight ? "text-primary" : "text-foreground"
            )}
          >
            {value}
          </p>
          {trend && (
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate">
              {trend}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 sm:gap-2 shrink-0">
          {link && <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
          <div
            className={cn(
              "w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center",
              highlight ? "bg-primary/20" : "bg-primary/10"
            )}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link} className="block h-full">{content}</Link>;
  }

  return content;
};
