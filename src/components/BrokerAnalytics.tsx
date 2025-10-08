import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Clock, DollarSign } from "lucide-react";

interface BrokerStats {
  pendingClaims: number;
  reviewedClaims: number;
  avgReviewTime: string;
  totalValue: number;
}

export const BrokerAnalytics = () => {
  const [stats, setStats] = useState<BrokerStats>({
    pendingClaims: 0,
    reviewedClaims: 0,
    avgReviewTime: "N/A",
    totalValue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: claims } = await supabase
        .from("claims")
        .select("status, cost_estimation, created_at");

      if (claims) {
        const pending = claims.filter((c) => c.status === "Submitted").length;
        const reviewed = claims.filter((c) => c.status === "Reviewed").length;
        const totalValue = claims.reduce(
          (sum, claim) => sum + (claim.cost_estimation || 0),
          0
        );

        setStats({
          pendingClaims: pending,
          reviewedClaims: reviewed,
          avgReviewTime: "24h",
          totalValue,
        });
      }
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
          <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgReviewTime}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Par sinistre
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
          <DollarSign className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalValue.toLocaleString()} FCFA
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Portefeuille actif
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
