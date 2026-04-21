import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Inbox, AlertCircle } from "lucide-react";

interface Props { agentId: string; }

interface ActivityItem {
  id: string;
  type: "subscription" | "lead" | "claim";
  label: string;
  date: string;
}

export const AgentActivityTab = ({ agentId }: Props) => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [subs, leads, claims] = await Promise.all([
        supabase.from("subscriptions").select("id, created_at, products(name)").eq("assigned_broker_id", agentId).order("created_at", { ascending: false }).limit(20),
        supabase.from("leads").select("id, created_at, first_name, last_name").eq("assigned_broker_id", agentId).order("created_at", { ascending: false }).limit(20),
        supabase.from("claims").select("id, created_at, claim_type").eq("assigned_broker_id", agentId).order("created_at", { ascending: false }).limit(20),
      ]);
      const activities: ActivityItem[] = [
        ...(subs.data || []).map((s: any) => ({ id: s.id, type: "subscription" as const, label: `Souscription ${s.products?.name || "produit"}`, date: s.created_at })),
        ...(leads.data || []).map((l: any) => ({ id: l.id, type: "lead" as const, label: `Nouveau prospect ${l.first_name} ${l.last_name}`, date: l.created_at })),
        ...(claims.data || []).map((c: any) => ({ id: c.id, type: "claim" as const, label: `Sinistre ${c.claim_type}`, date: c.created_at })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 40);
      setItems(activities);
      setLoading(false);
    })();
  }, [agentId]);

  const iconFor = (t: ActivityItem["type"]) =>
    t === "subscription" ? <FileCheck className="h-4 w-4 text-emerald-600" /> :
    t === "lead" ? <Inbox className="h-4 w-4 text-blue-600" /> :
    <AlertCircle className="h-4 w-4 text-amber-600" />;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Activité récente</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aucune activité</p>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={`${it.type}-${it.id}`} className="flex items-center gap-3 pb-3 border-b last:border-0">
                {iconFor(it.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{it.label}</p>
                  <p className="text-xs text-muted-foreground">{new Date(it.date).toLocaleString("fr-FR")}</p>
                </div>
                <Badge variant="outline" className="text-xs">{it.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};