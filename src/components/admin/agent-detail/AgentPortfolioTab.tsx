import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFCFA } from "@/utils/formatCurrency";

interface Props { agentId: string; }

export const AgentPortfolioTab = ({ agentId }: Props) => {
  const [clients, setClients] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [clientsRes, policiesRes] = await Promise.all([
        supabase.from("broker_clients").select("client_id, assigned_at, profiles:client_id(first_name, last_name, email, phone)").eq("broker_id", agentId),
        supabase.from("subscriptions").select("id, monthly_premium, status, start_date, products(name)").eq("assigned_broker_id", agentId).order("start_date", { ascending: false }),
      ]);
      setClients(clientsRes.data || []);
      setPolicies(policiesRes.data || []);
      setLoading(false);
    })();
  }, [agentId]);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Clients ({clients.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Contact</TableHead><TableHead>Assigné le</TableHead></TableRow></TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.client_id}>
                  <TableCell className="font-medium">{c.profiles?.first_name} {c.profiles?.last_name}</TableCell>
                  <TableCell className="text-xs"><div>{c.profiles?.phone || "—"}</div><div className="text-muted-foreground">{c.profiles?.email || ""}</div></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.assigned_at).toLocaleDateString("fr-FR")}</TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucun client</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Polices ({policies.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Début</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Prime mens.</TableHead></TableRow></TableHeader>
            <TableBody>
              {policies.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.products?.name || "—"}</TableCell>
                  <TableCell className="text-xs">{p.start_date ? new Date(p.start_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{p.status}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">{formatFCFA(Number(p.monthly_premium) || 0)}</TableCell>
                </TableRow>
              ))}
              {policies.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucune police</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};