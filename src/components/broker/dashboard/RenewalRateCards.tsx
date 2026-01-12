import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatFCFA } from "@/utils/formatCurrency";
import type { ProductType } from "./ProductSelector";

interface RenewalStats {
  rateByCount: number;
  rateByPremium: number;
  totalToRenew: number;
  totalRenewed: number;
  premiumToRenew: number;
  premiumRenewed: number;
  deltaCount: number;
  deltaPremium: number;
}

interface RenewalRateCardsProps {
  selectedProduct: ProductType;
}

export const RenewalRateCards = ({ selectedProduct }: RenewalRateCardsProps) => {
  const [stats, setStats] = useState<RenewalStats>({
    rateByCount: 0,
    rateByPremium: 0,
    totalToRenew: 0,
    totalRenewed: 0,
    premiumToRenew: 0,
    premiumRenewed: 0,
    deltaCount: 0,
    deltaPremium: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRenewalStats();
  }, [selectedProduct]);

  const fetchRenewalStats = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all subscriptions for renewal calculation
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*, products(name, category)")
        .eq("assigned_broker_id", user.id);

      if (!subscriptions) {
        setIsLoading(false);
        return;
      }

      // Filter by product type if not "all"
      let filteredSubs = subscriptions;
      if (selectedProduct !== "all") {
        const categoryMap: Record<string, string[]> = {
          auto: ["auto", "automobile"],
          mrh: ["mrh", "habitation", "multirisque"],
          sante: ["sante", "santé", "health"],
          vie: ["vie", "epargne", "épargne", "savings"],
          obseques: ["obseques", "obsèques", "funeral"],
        };
        
        const categories = categoryMap[selectedProduct] || [];
        filteredSubs = subscriptions.filter(sub => {
          const productCategory = ((sub.products as any)?.category || "").toLowerCase();
          const productName = ((sub.products as any)?.name || "").toLowerCase();
          return categories.some(cat => 
            productCategory.includes(cat) || productName.includes(cat)
          );
        });
      }

      // Calculate renewal stats
      const now = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(now.getMonth() + 3);

      const toRenew = filteredSubs.filter(sub => {
        const endDate = new Date(sub.end_date);
        return endDate <= threeMonthsFromNow && endDate >= now;
      });

      const renewed = filteredSubs.filter(sub => sub.status === "active");
      const expired = filteredSubs.filter(sub => {
        const endDate = new Date(sub.end_date);
        return endDate < now;
      });

      const totalToRenewCount = toRenew.length + expired.length;
      const totalRenewedCount = renewed.length;
      
      const premiumToRenew = toRenew.reduce((sum, sub) => sum + (sub.monthly_premium * 12), 0) +
                             expired.reduce((sum, sub) => sum + (sub.monthly_premium * 12), 0);
      const premiumRenewed = renewed.reduce((sum, sub) => sum + (sub.monthly_premium * 12), 0);

      // Calculate rates (avoid division by zero)
      const rateByCount = totalToRenewCount > 0 
        ? Math.round((totalRenewedCount / (totalRenewedCount + totalToRenewCount)) * 100) 
        : 0;
      
      const totalPremium = premiumToRenew + premiumRenewed;
      const rateByPremium = totalPremium > 0 
        ? Math.round((premiumRenewed / totalPremium) * 100) 
        : 0;

      // Mock delta values (would come from historical data)
      const deltaCount = Math.round((Math.random() - 0.5) * 10);
      const deltaPremium = Math.round((Math.random() - 0.5) * 8);

      setStats({
        rateByCount,
        rateByPremium,
        totalToRenew: totalToRenewCount,
        totalRenewed: totalRenewedCount,
        premiumToRenew,
        premiumRenewed,
        deltaCount,
        deltaPremium,
      });
    } catch (error) {
      console.error("Error fetching renewal stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-4">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Taux Renouvellement",
      sublabel: "Nombre de polices",
      rate: stats.rateByCount,
      delta: stats.deltaCount,
      detail: `${stats.totalRenewed} / ${stats.totalRenewed + stats.totalToRenew}`,
    },
    {
      label: "Taux Renouvellement",
      sublabel: "Volume prime",
      rate: stats.rateByPremium,
      delta: stats.deltaPremium,
      detail: `${formatFCFA(stats.premiumRenewed)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, index) => (
        <Card 
          key={card.sublabel}
          className="border-border/60 animate-fade-in overflow-hidden"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardContent className="p-4 relative">
            {/* Background circle decoration */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/5" />
            
            <div className="relative z-10">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                {card.label}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mb-3">
                {card.sublabel}
              </p>
              
              {/* Circular progress indicator */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                    {/* Background circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="6"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${card.rate * 1.76} 176`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-foreground">
                      {card.rate}%
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  {/* Delta indicator */}
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    card.delta > 0 
                      ? "bg-success/10 text-success" 
                      : card.delta < 0 
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {card.delta > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : card.delta < 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    {card.delta > 0 ? "+" : ""}{card.delta} pts
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground mt-2 truncate">
                    {card.detail}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
