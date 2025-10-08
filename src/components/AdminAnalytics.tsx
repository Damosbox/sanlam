import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, FileText, Users } from "lucide-react";

interface Analytics {
  totalClaims: number;
  totalAmount: number;
  approvedClaims: number;
  pendingClaims: number;
  totalUsers: number;
  approvalRate: number;
}

export const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalClaims: 0,
    totalAmount: 0,
    approvedClaims: 0,
    pendingClaims: 0,
    totalUsers: 0,
    approvalRate: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Get claims data
      const { data: claims } = await supabase
        .from("claims")
        .select("status, cost_estimation");

      // Get users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (claims) {
        const totalAmount = claims.reduce(
          (sum, claim) => sum + (claim.cost_estimation || 0),
          0
        );
        const approvedClaims = claims.filter((c) => c.status === "Approved").length;
        const pendingClaims = claims.filter((c) => c.status === "Submitted").length;
        const approvalRate =
          claims.length > 0 ? (approvedClaims / claims.length) * 100 : 0;

        setAnalytics({
          totalClaims: claims.length,
          totalAmount,
          approvedClaims,
          pendingClaims,
          totalUsers: usersCount || 0,
          approvalRate,
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Sinistres</CardTitle>
          <FileText className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalClaims}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.pendingClaims} en attente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
          <DollarSign className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics.totalAmount.toLocaleString()} FCFA
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Toutes les estimations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Taux d'Approbation</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics.approvalRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.approvedClaims} approuvés
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
          <Users className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalUsers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total des comptes
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
