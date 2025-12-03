import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Clock, FileText, Shield, TrendingUp, 
  Users, Target, Wallet, Timer 
} from "lucide-react";

interface KPIStats {
  pendingClaims: number;
  reviewedClaims: number;
  activePolicies: number;
  monthlyRevenue: number;
  conversionRate: number;
  leadsAssigned24h: number;
  estimatedCommissions: number;
  avgConversionDays: number;
}

export const DashboardKPIs = () => {
  const [stats, setStats] = useState<KPIStats>({
    pendingClaims: 0,
    reviewedClaims: 0,
    activePolicies: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    leadsAssigned24h: 0,
    estimatedCommissions: 0,
    avgConversionDays: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch claims
      const { data: claims } = await supabase
        .from("claims")
        .select("status, cost_estimation")
        .eq("assigned_broker_id", user.id);

      // Fetch subscriptions
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

      const pending = claims?.filter(c => c.status === "Submitted").length || 0;
      const reviewed = claims?.filter(c => c.status === "Reviewed").length || 0;
      const totalPolicies = subscriptions?.filter(s => s.status === "active").length || 0;
      const monthlyRevenue = subscriptions?.reduce((sum, sub) => sum + (sub.monthly_premium || 0), 0) || 0;

      const totalLeads = leads?.length || 1;
      const convertedLeads = leads?.filter(l => l.status === "converti").length || 0;
      const conversionRate = Math.round((convertedLeads / totalLeads) * 100);

      const leadsLast24h = leads?.filter(l => new Date(l.created_at) >= yesterday).length || 0;

      setStats({
        pendingClaims: pending,
        reviewedClaims: reviewed,
        activePolicies: totalPolicies,
        monthlyRevenue,
        conversionRate,
        leadsAssigned24h: leadsLast24h,
        estimatedCommissions: Math.round(monthlyRevenue * 0.15),
        avgConversionDays: 4.2,
      });
    } catch (error) {
      console.error("Error fetching KPI stats:", error);
    }
  };

  const kpis = [
    { 
      label: "Sinistres en attente", 
      value: stats.pendingClaims.toString(), 
      icon: Clock, 
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    { 
      label: "Sinistres examinés", 
      value: stats.reviewedClaims.toString(), 
      icon: FileText, 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      label: "Polices actives", 
      value: stats.activePolicies.toString(), 
      icon: Shield, 
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      label: "Revenus mensuels", 
      value: `${stats.monthlyRevenue.toLocaleString()} FCFA`, 
      icon: TrendingUp, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      label: "Taux conversion", 
      value: `${stats.conversionRate}%`, 
      icon: Target, 
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    { 
      label: "Leads (24h)", 
      value: stats.leadsAssigned24h.toString(), 
      icon: Users, 
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    { 
      label: "Commissions MTD", 
      value: `${stats.estimatedCommissions.toLocaleString()} FCFA`, 
      icon: Wallet, 
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    { 
      label: "Temps conversion", 
      value: `${stats.avgConversionDays} jours`, 
      icon: Timer, 
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Indicateurs clés</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${kpi.bgColor} flex items-center justify-center`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
