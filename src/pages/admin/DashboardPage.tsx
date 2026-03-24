import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminAnalytics } from "@/components/AdminAnalytics";
import { AdminNPSByProduct } from "@/components/admin/AdminNPSByProduct";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, RefreshCw, Loader2 } from "lucide-react";

interface StaleLeadAlert {
  agentName: string;
  count: number;
}

interface RenewalAlert {
  days: number;
  count: number;
}

export default function DashboardPage() {
  const [staleLeads, setStaleLeads] = useState<StaleLeadAlert[]>([]);
  const [renewals, setRenewals] = useState<RenewalAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      // Stale leads: last_contact_at > 7 days OR next_followup_at in the past
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      const { data: leads } = await supabase
        .from("leads")
        .select("assigned_broker_id, last_contact_at, next_followup_at, status")
        .not("status", "in", '("converti","perdu")');

      const staleByAgent = new Map<string, number>();
      for (const lead of leads || []) {
        const isStale =
          (!lead.last_contact_at || lead.last_contact_at < sevenDaysAgo) ||
          (lead.next_followup_at && lead.next_followup_at < now);
        if (isStale && lead.assigned_broker_id) {
          staleByAgent.set(lead.assigned_broker_id, (staleByAgent.get(lead.assigned_broker_id) || 0) + 1);
        }
      }

      // Get agent names
      const agentIds = Array.from(staleByAgent.keys());
      let staleResult: StaleLeadAlert[] = [];
      if (agentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", agentIds);
        const nameMap = new Map((profiles || []).map((p) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`]));
        staleResult = agentIds.map((id) => ({
          agentName: nameMap.get(id) || "—",
          count: staleByAgent.get(id) || 0,
        })).sort((a, b) => b.count - a.count);
      }
      setStaleLeads(staleResult);

      // Upcoming renewals: end_date in 30, 60, 90 days
      const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const in90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("end_date")
        .eq("status", "active")
        .not("end_date", "is", null)
        .lte("end_date", in90)
        .gte("end_date", now);

      let r30 = 0, r60 = 0, r90 = 0;
      for (const s of subs || []) {
        if (s.end_date! <= in30) r30++;
        else if (s.end_date! <= in60) r60++;
        else r90++;
      }

      setRenewals([
        { days: 30, count: r30 },
        { days: 60, count: r60 },
        { days: 90, count: r90 },
      ]);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const totalStale = staleLeads.reduce((s, l) => s + l.count, 0);
  const totalRenewals = renewals.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border">
        <h1 className="text-2xl font-bold mb-2">Tableau de Bord Administration</h1>
        <p className="text-muted-foreground">
          Bienvenue dans le panneau d'administration. Suivez les KPIs et gérez toutes les opérations.
        </p>
      </div>

      {/* Alerts Section */}
      {!loadingAlerts && (totalStale > 0 || totalRenewals > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {totalStale > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-base">Leads dormants ({totalStale})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Leads sans contact depuis 7+ jours ou relance en retard
                </p>
                <div className="space-y-2">
                  {staleLeads.slice(0, 5).map((sl, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm">{sl.agentName}</span>
                      <Badge variant="destructive">{sl.count}</Badge>
                    </div>
                  ))}
                  {staleLeads.length > 5 && (
                    <p className="text-xs text-muted-foreground">...et {staleLeads.length - 5} autres agents</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {totalRenewals > 0 && (
            <Card className="border-orange-500/50">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <RefreshCw className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-base">Renouvellements imminents ({totalRenewals})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Polices arrivant à échéance prochainement
                </p>
                <div className="space-y-2">
                  {renewals.map((r) => (
                    <div key={r.days} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Sous {r.days} jours</span>
                      </div>
                      <Badge variant={r.days <= 30 ? "destructive" : "secondary"}>{r.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {loadingAlerts && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement des alertes...
        </div>
      )}
      
      <AdminAnalytics />
      
      <AdminNPSByProduct />
    </div>
  );
}
