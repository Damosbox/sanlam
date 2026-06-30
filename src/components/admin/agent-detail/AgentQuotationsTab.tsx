import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFCFA } from "@/utils/formatCurrency";
import { FileText } from "lucide-react";

interface Props { agentId: string; }

export const AgentQuotationsTab = ({ agentId }: Props) => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("quotations")
        .select("*")
        .eq("broker_id", agentId)
        .order("created_at", { ascending: false });
      setQuotes(data || []);
      setLoading(false);
    })();
  }, [agentId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Cotations générées ({quotes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Cotation</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead className="text-right">Prime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono text-xs">{q.quote_number || q.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">{q.client_name || "—"}</TableCell>
                  <TableCell className="text-sm">{q.product_name || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{q.status || "draft"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{q.created_at ? new Date(q.created_at).toLocaleDateString("fr-FR") : "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{formatFCFA(Number(q.total_premium) || 0)}</TableCell>
                </TableRow>
              ))}
              {quotes.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune cotation</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};