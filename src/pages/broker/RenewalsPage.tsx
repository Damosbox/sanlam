import { useState } from "react";
import { startOfYear, endOfYear } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductSelector, ProductType } from "@/components/broker/dashboard/ProductSelector";
import { PeriodFilter, DateRange } from "@/components/broker/dashboard/PeriodFilter";
import { RenewalPipelineTable } from "@/components/policies/RenewalPipelineTable";
import { RenewalStatusToggles } from "@/components/policies/RenewalStatusToggles";
import { RefreshCw, TrendingUp, Users, PhoneOff, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveKPI = "renewed" | "contacted" | "not_contacted" | "lost" | null;

const KPI_CARDS = [
  { id: "renewed" as const, label: "Taux renouvellement", value: "76%", icon: TrendingUp, activeClass: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30", textClass: "text-emerald-600" },
  { id: "contacted" as const, label: "Clients atteints", value: "82%", icon: Users, activeClass: "border-blue-500 bg-blue-50 dark:bg-blue-950/30", textClass: "text-blue-600" },
  { id: "not_contacted" as const, label: "À contacter", value: "24", icon: PhoneOff, activeClass: "border-amber-500 bg-amber-50 dark:bg-amber-950/30", textClass: "text-amber-600" },
  { id: "lost" as const, label: "Taux churn", value: "8%", icon: TrendingDown, activeClass: "border-destructive bg-red-50 dark:bg-red-950/30", textClass: "text-destructive" },
] as const;

export default function RenewalsPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");
  const [contactFilter, setContactFilter] = useState<"all" | "contacted" | "not_contacted">("all");
  const [renewalFilter, setRenewalFilter] = useState<"all" | "renewed" | "pending" | "lost">("all");
  const [dateRange, setDateRange] = useState<DateRange>({ from: startOfYear(new Date()), to: endOfYear(new Date()) });
  const [activeKPI, setActiveKPI] = useState<ActiveKPI>(null);

  const handleKPIClick = (id: ActiveKPI) => {
    if (activeKPI === id) {
      // Reset
      setActiveKPI(null);
      setContactFilter("all");
      setRenewalFilter("all");
      return;
    }
    setActiveKPI(id);
    if (id === "renewed" || id === "lost") {
      setContactFilter("all");
      setRenewalFilter(id);
    } else if (id === "contacted" || id === "not_contacted") {
      setRenewalFilter("all");
      setContactFilter(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Renouvellement</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pipeline et suivi des renouvellements</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ProductSelector value={selectedProduct} onChange={setSelectedProduct} />
          <PeriodFilter onPeriodChange={setDateRange} />
        </div>
      </div>

      {/* Clickable KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPI_CARDS.map((kpi) => {
          const isActive = activeKPI === kpi.id;
          return (
            <Card
              key={kpi.id}
              onClick={() => handleKPIClick(kpi.id)}
              className={cn(
                "border-border/60 cursor-pointer transition-all hover:shadow-md",
                isActive && kpi.activeClass
              )}
            >
              <CardContent className="p-4 text-center">
                <kpi.icon className={cn("h-4 w-4 mx-auto mb-1", kpi.textClass)} />
                <div className={cn("text-2xl sm:text-3xl font-bold", kpi.textClass)}>{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">Pipeline des Renouvellements</CardTitle>
            <RenewalStatusToggles
              contactFilter={contactFilter}
              renewalFilter={renewalFilter}
              onContactFilterChange={(v) => { setContactFilter(v); setActiveKPI(null); }}
              onRenewalFilterChange={(v) => { setRenewalFilter(v); setActiveKPI(null); }}
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <RenewalPipelineTable
            selectedProduct={selectedProduct}
            contactFilter={contactFilter}
            renewalFilter={renewalFilter}
            dateRange={dateRange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
