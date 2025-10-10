import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Clock, Shield } from "lucide-react";

interface BrokerStats {
  pendingClaims: number;
  reviewedClaims: number;
  totalPolicies: number;
  monthlyRevenue: number;
}

export const BrokerAnalytics = () => {
  const [stats, setStats] = useState<BrokerStats>({
    pendingClaims: 0,
    reviewedClaims: 0,
    totalPolicies: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch claims stats
      const { data: claims } = await supabase
        .from("claims")
        .select("status, cost_estimation, created_at")
        .eq("assigned_broker_id", user.id);

      // Fetch subscriptions stats
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("status, monthly_premium")
        .eq("assigned_broker_id", user.id);

      const pending = claims?.filter((c) => c.status === "Submitted").length || 0;
      const reviewed = claims?.filter((c) => c.status === "Reviewed").length || 0;
      const totalPolicies = subscriptions?.length || 0;
      const monthlyRevenue = subscriptions?.reduce(
        (sum, sub) => sum + (sub.monthly_premium || 0),
        0
      ) || 0;

      setStats({
        pendingClaims: pending,
        reviewedClaims: reviewed,
        totalPolicies,
        monthlyRevenue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">En attente</CardTitle>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingClaims}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Sinistres à examiner
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Examinés</CardTitle>
          <FileText className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.reviewedClaims}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Ce mois
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Polices actives</CardTitle>
          <Shield className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPolicies}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Assignées au courtier
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Revenus mensuels</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.monthlyRevenue.toLocaleString()} FCFA
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Primes totales
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
