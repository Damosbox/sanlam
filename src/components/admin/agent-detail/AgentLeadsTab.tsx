import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeadsPipeline } from "@/components/broker/dashboard/LeadsPipeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { agentId: string; }

export const AgentLeadsTab = ({ agentId }: Props) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("leads")
        .select("id, first_name, last_name, email, phone, status, product_interest, created_at")
        .eq("assigned_broker_id", agentId)
        .order("created_at", { ascending: false });
      setLeads(data || []);
      setLoading(false);
    })();
  }, [agentId]);

  return (
    <div className="space-y-6">
      <LeadsPipeline overrideAgentId={agentId} />
      <Card>
        <CardHeader><CardTitle className="text-base">Liste des prospects ({leads.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.first_name} {l.last_name}</TableCell>
                    <TableCell className="text-xs"><div>{l.phone || "—"}</div><div className="text-muted-foreground">{l.email || ""}</div></TableCell>
                    <TableCell className="text-sm">{l.product_interest || "—"}</TableCell>
                    <TableCell><LeadStatusBadge status={l.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun prospect</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};