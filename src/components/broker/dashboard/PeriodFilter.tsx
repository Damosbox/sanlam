import { useState, useMemo } from "react";
import { startOfYear, endOfYear, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type PeriodType = "fiscal_year" | "month" | "quarter" | "6months" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

interface PeriodFilterProps {
  onPeriodChange: (dateRange: DateRange) => void;
  className?: string;
}

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: "fiscal_year", label: "Année d'exercice" },
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "6months", label: "6 derniers mois" },
  { value: "custom", label: "Personnalisé" },
];

function computeDateRange(period: PeriodType): DateRange {
  const now = new Date();
  switch (period) {
    case "fiscal_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "quarter":
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "6months":
      return { from: subMonths(now, 6), to: now };
    default:
      return { from: startOfYear(now), to: endOfYear(now) };
  }
}

export const PeriodFilter = ({ onPeriodChange, className }: PeriodFilterProps) => {
  const [period, setPeriod] = useState<PeriodType>("fiscal_year");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const handlePeriodChange = (value: PeriodType) => {
    setPeriod(value);
    if (value !== "custom") {
      onPeriodChange(computeDateRange(value));
    }
  };

  const handleCustomFromSelect = (date: Date | undefined) => {
    setCustomFrom(date);
    if (date && customTo) {
      onPeriodChange({ from: date, to: customTo });
    }
  };

  const handleCustomToSelect = (date: Date | undefined) => {
    setCustomTo(date);
    if (customFrom && date) {
      onPeriodChange({ from: customFrom, to: date });
    }
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Select value={period} onValueChange={(v) => handlePeriodChange(v as PeriodType)}>
        <SelectTrigger className="h-8 w-[170px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === "custom" && (
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", !customFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {customFrom ? format(customFrom, "dd/MM/yyyy") : "Début"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customFrom}
                onSelect={handleCustomFromSelect}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">→</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", !customTo && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {customTo ? format(customTo, "dd/MM/yyyy") : "Fin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customTo}
                onSelect={handleCustomToSelect}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export { computeDateRange };
