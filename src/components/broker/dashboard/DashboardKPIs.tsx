import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, FileText, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import { RenewalRateCards } from "./RenewalRateCards";
import { ProductSpecificKPIs } from "./ProductSpecificKPIs";
import type { ProductType } from "./ProductSelector";

interface KPIStats {
  commissionsMTD: number;
  totalGWP: number;
  totalPolicies: number;
  topSalesByGWP: { name: string; gwp: number }[];
  topSalesByPolicy: { name: string; count: number }[];
}

interface DashboardKPIsProps {
  selectedProduct?: ProductType;
}

export const DashboardKPIs = ({ selectedProduct = "all" }: DashboardKPIsProps) => {
  const [stats, setStats] = useState<KPIStats>({
    commissionsMTD: 0,
    totalGWP: 0,
    totalPolicies: 0,
    topSalesByGWP: [],
    topSalesByPolicy: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedProduct]);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch subscriptions with product info
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("monthly_premium, product_id, products(name, category)")
        .eq("assigned_broker_id", user.id);

      // Filter by product type if not "all"
      let filteredSubs = subscriptions || [];
      if (selectedProduct !== "all") {
        const categoryMap: Record<string, string[]> = {
          auto: ["auto", "automobile"],
          mrh: ["mrh", "habitation", "multirisque"],
          sante: ["sante", "santé", "health"],
          vie: ["vie", "epargne", "épargne", "savings"],
          obseques: ["obseques", "obsèques", "funeral"],
        };
        
        const categories = categoryMap[selectedProduct] || [];
        filteredSubs = (subscriptions || []).filter(sub => {
          const productCategory = ((sub.products as any)?.category || "").toLowerCase();
          const productName = ((sub.products as any)?.name || "").toLowerCase();
          return categories.some(cat => 
            productCategory.includes(cat) || productName.includes(cat)
          );
        });
      }

      const totalGWP = filteredSubs.reduce((sum, sub) => sum + (sub.monthly_premium || 0) * 12, 0);
      const totalPolicies = filteredSubs.length;
      const commissionsMTD = Math.round(totalGWP * 0.15 / 12);

      // Calculate top sales by product
      const productStats: Record<string, { gwp: number; count: number }> = {};
      filteredSubs.forEach(sub => {
        const productName = (sub.products as any)?.name || "Autre";
        if (!productStats[productName]) {
          productStats[productName] = { gwp: 0, count: 0 };
        }
        productStats[productName].gwp += (sub.monthly_premium || 0) * 12;
        productStats[productName].count += 1;
      });

      const topSalesByGWP = Object.entries(productStats)
        .map(([name, data]) => ({ name, gwp: data.gwp }))
        .sort((a, b) => b.gwp - a.gwp)
        .slice(0, 3);

      const topSalesByPolicy = Object.entries(productStats)
        .map(([name, data]) => ({ name, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setStats({
        commissionsMTD,
        totalGWP,
        totalPolicies,
        topSalesByGWP,
        topSalesByPolicy,
      });
    } catch (error) {
      console.error("Error fetching KPI stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const kpis = [
    { 
      label: "Commissions du mois", 
      value: formatFCFA(stats.commissionsMTD), 
      icon: Wallet, 
      trend: "Mois en cours",
      highlight: true,
    },
    { 
      label: "Primes Totales", 
      value: formatFCFA(stats.totalGWP), 
      icon: TrendingUp, 
      trend: "Prime annuelle brute",
    },
    { 
      label: "Polices vendues", 
      value: stats.totalPolicies.toString(), 
      icon: FileText, 
      trend: "Contrats actifs",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-3 sm:p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Renewal Rate Cards - Motor Dashboard Style */}
      <RenewalRateCards selectedProduct={selectedProduct} />

      {/* Main KPIs */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {kpis.map((kpi, index) => (
          <Card 
            key={kpi.label} 
            className={cn(
              "border-border/60 transition-all duration-200 hover:shadow-soft hover:border-primary/20",
              "animate-fade-in",
              kpi.highlight && "bg-primary/5 border-primary/30"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-0.5 sm:mb-1 truncate">
                    {kpi.label}
                  </p>
                  <p className={cn(
                    "text-base sm:text-xl font-bold tracking-tight",
                    kpi.highlight ? "text-primary" : "text-foreground"
                  )}>
                    {kpi.value}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate">
                    {kpi.trend}
                  </p>
                </div>
                <div className={cn(
                  "w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0",
                  kpi.highlight ? "bg-primary/20" : "bg-primary/10"
                )}>
                  <kpi.icon className={cn(
                    "w-3.5 h-3.5 sm:w-4 sm:h-4",
                    kpi.highlight ? "text-primary" : "text-primary"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Product-Specific KPIs */}
      <ProductSpecificKPIs selectedProduct={selectedProduct} />

      {/* Top 3 Sales */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Top 3 by GWP */}
        <Card className="border-border/60 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" />
              <p className="text-xs sm:text-sm font-semibold text-foreground">Top 3 par Primes</p>
            </div>
            <div className="space-y-2">
              {stats.topSalesByGWP.length > 0 ? stats.topSalesByGWP.map((sale, i) => (
                <div key={sale.name} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="flex items-center gap-2 truncate">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      i === 0 ? "bg-amber-100 text-amber-700" : 
                      i === 1 ? "bg-gray-100 text-gray-600" : 
                      "bg-orange-100 text-orange-700"
                    )}>
                      {i + 1}
                    </span>
                    <span className="truncate text-foreground">{sale.name}</span>
                  </span>
                  <span className="font-medium text-muted-foreground shrink-0">{formatFCFA(sale.gwp)}</span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">Aucune vente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 3 by Policy count */}
        <Card className="border-border/60 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-500" />
              <p className="text-xs sm:text-sm font-semibold text-foreground">Top 3 par Polices</p>
            </div>
            <div className="space-y-2">
              {stats.topSalesByPolicy.length > 0 ? stats.topSalesByPolicy.map((sale, i) => (
                <div key={sale.name} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="flex items-center gap-2 truncate">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      i === 0 ? "bg-blue-100 text-blue-700" : 
                      i === 1 ? "bg-gray-100 text-gray-600" : 
                      "bg-blue-50 text-blue-600"
                    )}>
                      {i + 1}
                    </span>
                    <span className="truncate text-foreground">{sale.name}</span>
                  </span>
                  <span className="font-medium text-muted-foreground shrink-0">{sale.count} contrats</span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">Aucune vente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
