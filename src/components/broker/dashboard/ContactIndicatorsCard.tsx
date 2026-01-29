import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, PhoneOff, PhoneCall, AlertCircle, RefreshCcw, Users, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { ProductType } from "./ProductSelector";
import { cn } from "@/lib/utils";

interface ContactStats {
  toCall: number;
  contacted: number;
  reached: number;
  phoneIssue: number;
}

interface ContactIndicatorsCardProps {
  selectedProduct?: ProductType;
}

export function ContactIndicatorsCard({ selectedProduct = "all" }: ContactIndicatorsCardProps) {
  const [stats, setStats] = useState<ContactStats>({
    toCall: 0,
    contacted: 0,
    reached: 0,
    phoneIssue: 0,
  });
  const [renewalRate, setRenewalRate] = useState(0);
  const [churnRate, setChurnRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContactStats();
  }, [selectedProduct]);

  const fetchContactStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch subscriptions with renewal data
      let query = supabase
        .from("subscriptions")
        .select("contact_status, renewal_status, products(category)")
        .eq("assigned_broker_id", user.id)
        .eq("status", "active");

      const { data: subscriptions } = await query;

      // Filter by product if needed
      let filtered = subscriptions || [];
      if (selectedProduct !== "all") {
        const categoryMap: Record<string, string[]> = {
          auto: ["auto", "automobile"],
          mrh: ["mrh", "habitation", "multirisque"],
          sante: ["sante", "santé", "health"],
          vie: ["vie", "epargne", "épargne", "savings"],
          obseques: ["obseques", "obsèques", "funeral"],
        };
        const categories = categoryMap[selectedProduct] || [];
        filtered = filtered.filter((sub) => {
          const productCategory = ((sub.products as any)?.category || "").toLowerCase();
          return categories.some((cat) => productCategory.includes(cat));
        });
      }

      // Calculate stats
      const toCall = filtered.filter((s) => s.contact_status === "not_contacted").length;
      const contacted = filtered.filter((s) => s.contact_status === "contacted").length;
      const reached = filtered.filter((s) => s.contact_status === "reached").length;
      const phoneIssue = filtered.filter((s) => s.contact_status === "phone_issue").length;

      // Calculate renewal and churn rates
      const totalWithDecision = filtered.filter((s) => 
        s.renewal_status === "renewed" || s.renewal_status === "lost"
      ).length;
      const renewed = filtered.filter((s) => s.renewal_status === "renewed").length;
      const lost = filtered.filter((s) => s.renewal_status === "lost").length;

      const renewalRateCalc = totalWithDecision > 0 ? Math.round((renewed / totalWithDecision) * 100) : 0;
      const churnRateCalc = totalWithDecision > 0 ? Math.round((lost / totalWithDecision) * 100) : 0;

      setStats({ toCall, contacted, reached, phoneIssue });
      setRenewalRate(renewalRateCalc);
      setChurnRate(churnRateCalc);
    } catch (error) {
      console.error("Error fetching contact stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const total = stats.toCall + stats.contacted + stats.reached + stats.phoneIssue;
  const reachedPercent = total > 0 ? Math.round((stats.reached / total) * 100) : 0;

  const chartData = [
    { name: "À appeler", value: stats.toCall, color: "hsl(var(--muted-foreground))" },
    { name: "Contactés", value: stats.contacted, color: "hsl(var(--primary))" },
    { name: "Atteints", value: stats.reached, color: "hsl(142, 76%, 36%)" },
    { name: "Pb téléphone", value: stats.phoneIssue, color: "hsl(0, 84%, 60%)" },
  ].filter((d) => d.value > 0);

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          Indicateurs de Contact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Stats Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <PhoneOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm">À appeler</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-foreground">{stats.toCall}</span>
                <span className="text-xs text-muted-foreground ml-1">({total > 0 ? Math.round((stats.toCall / total) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-xs sm:text-sm">Contactés</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-foreground">{stats.contacted}</span>
                <span className="text-xs text-muted-foreground ml-1">({total > 0 ? Math.round((stats.contacted / total) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-emerald-600" />
                <span className="text-xs sm:text-sm">Atteints</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-foreground">{stats.reached}</span>
                <span className="text-xs text-emerald-600 ml-1">({reachedPercent}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs sm:text-sm">Pb téléphone</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-foreground">{stats.phoneIssue}</span>
                <span className="text-xs text-red-500 ml-1">({total > 0 ? Math.round((stats.phoneIssue / total) * 100) : 0}%)</span>
              </div>
            </div>
          </div>

          {/* Column 2: Pie Chart */}
          <div className="h-[160px] flex items-center justify-center">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Aucune donnée
              </div>
            )}
          </div>

          {/* Column 3: Summary Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <RefreshCcw className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-primary">{renewalRate}%</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Taux renouvellement</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center">
              <Users className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-emerald-600">{reachedPercent}%</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Clients atteints</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center">
              <PhoneOff className="h-4 w-4 text-amber-600 mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-amber-600">{stats.toCall}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">A contacter</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-center">
              <TrendingDown className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-red-500">{churnRate}%</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Taux churn</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
