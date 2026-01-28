import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, PhoneOff, PhoneCall, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { ProductType } from "./ProductSelector";

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
        .select("contact_status, products(category)")
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

      setStats({ toCall, contacted, reached, phoneIssue });
    } catch (error) {
      console.error("Error fetching contact stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const total = stats.toCall + stats.contacted + stats.reached + stats.phoneIssue;
  const reachedPercent = total > 0 ? Math.round((stats.reached / total) * 100) : 0;
  const phoneIssuePercent = total > 0 ? Math.round((stats.phoneIssue / (stats.contacted + stats.reached + stats.phoneIssue || 1)) * 100) : 0;

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
          <Skeleton className="h-32 w-full" />
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
        <div className="grid grid-cols-2 gap-4">
          {/* Stats Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <PhoneOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">À appeler</span>
              </div>
              <span className="font-semibold text-foreground">{stats.toCall}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm">Contactés</span>
              </div>
              <span className="font-semibold text-foreground">{stats.contacted}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-emerald-600" />
                <span className="text-sm">Atteints</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-foreground">{stats.reached}</span>
                <span className="text-xs text-emerald-600 ml-1">({reachedPercent}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Pb téléphone</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-foreground">{stats.phoneIssue}</span>
                <span className="text-xs text-red-500 ml-1">({phoneIssuePercent}%)</span>
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="h-[160px]">
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
        </div>
      </CardContent>
    </Card>
  );
}
