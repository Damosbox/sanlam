import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Target, Timer, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIStats {
  leadsAssigned24h: number;
  conversionRate: number;
  avgConversionDays: number;
  estimatedCommissions: number;
}

export const DashboardKPIs = () => {
  const [stats, setStats] = useState<KPIStats>({
    leadsAssigned24h: 0,
    conversionRate: 0,
    avgConversionDays: 0,
    estimatedCommissions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch subscriptions for commissions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("status, monthly_premium")
        .eq("assigned_broker_id", user.id);

      // Fetch leads
      const { data: leads } = await supabase
        .from("leads")
        .select("status, created_at")
        .eq("assigned_broker_id", user.id);

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const monthlyRevenue = subscriptions?.reduce((sum, sub) => sum + (sub.monthly_premium || 0), 0) || 0;
      const totalLeads = leads?.length || 1;
      const convertedLeads = leads?.filter(l => l.status === "converti").length || 0;
      const conversionRate = Math.round((convertedLeads / totalLeads) * 100);
      const leadsLast24h = leads?.filter(l => new Date(l.created_at) >= yesterday).length || 0;

      setStats({
        leadsAssigned24h: leadsLast24h,
        conversionRate,
        avgConversionDays: 4.2,
        estimatedCommissions: Math.round(monthlyRevenue * 0.15),
      });
    } catch (error) {
      console.error("Error fetching KPI stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const kpis = [
    { 
      label: "Leads (24h)", 
      value: stats.leadsAssigned24h.toString(), 
      icon: Users, 
      trend: "+3 vs hier",
    },
    { 
      label: "Taux conversion", 
      value: `${stats.conversionRate}%`, 
      icon: Target, 
      trend: "+2.5% vs mois dernier",
    },
    { 
      label: "Temps conversion", 
      value: `${stats.avgConversionDays}j`, 
      icon: Timer, 
      trend: "-0.8j vs moyenne",
    },
    { 
      label: "Commissions MTD", 
      value: `${stats.estimatedCommissions.toLocaleString()}`, 
      icon: Wallet, 
      trend: "FCFA",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 sm:h-8 w-20" />
                  <Skeleton className="h-2 w-24" />
                </div>
                <Skeleton className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {kpis.map((kpi, index) => (
        <Card 
          key={kpi.label} 
          className={cn(
            "border-border/60 transition-all duration-200 hover:shadow-soft hover:border-primary/20",
            "animate-fade-in"
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-0.5 sm:mb-1 truncate">
                  {kpi.label}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                  {kpi.value}
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate">
                  {kpi.trend}
                </p>
              </div>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <kpi.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
