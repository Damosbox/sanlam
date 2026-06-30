import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AlertTriangle, CheckCircle2, ChevronDown, Users } from "lucide-react";
import { useState } from "react";

interface CoverageData {
  total: number;
  scored: number;
  unscored: number;
  unscoredClients: { id: string; name: string }[];
}

async function fetchCoverage(): Promise<CoverageData> {
  const { data: customers } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "customer");
  const ids = (customers ?? []).map((c) => c.user_id as string);
  const total = ids.length;

  if (total === 0) {
    return { total: 0, scored: 0, unscored: 0, unscoredClients: [] };
  }

  const { data: scored } = await supabase
    .from("client_scores")
    .select("client_id")
    .eq("product_type", "all")
    .in("client_id", ids);
  const scoredSet = new Set((scored ?? []).map((r) => r.client_id as string));
  const unscoredIds = ids.filter((id) => !scoredSet.has(id));

  let unscoredClients: { id: string; name: string }[] = [];
  if (unscoredIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", unscoredIds.slice(0, 100));
    unscoredClients = (profiles ?? []).map((p: any) => ({
      id: p.id,
      name: p.display_name || p.email || p.id.slice(0, 8),
    }));
  }

  return {
    total,
    scored: scoredSet.size,
    unscored: unscoredIds.length,
    unscoredClients,
  };
}

export function ScoringCoverageCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["scoring-coverage"],
    queryFn: fetchCoverage,
    refetchInterval: 60_000,
  });
  const [open, setOpen] = useState(false);

  const total = data?.total ?? 0;
  const scored = data?.scored ?? 0;
  const unscored = data?.unscored ?? 0;
  const pct = total > 0 ? Math.round((scored / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {unscored > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {unscored} client{unscored > 1 ? "s" : ""} non scoré
            {unscored > 1 ? "s" : ""}
          </AlertTitle>
          <AlertDescription>
            Ces clients seront traités automatiquement au prochain run quotidien
            (02h00 UTC). Vous pouvez aussi lancer un recalcul manuel ci-dessous.
          </AlertDescription>
        </Alert>
      )}
      {!isLoading && unscored === 0 && total > 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Couverture complète</AlertTitle>
          <AlertDescription>
            Les {total} clients du portefeuille disposent d'un score à jour.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Couverture du scoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Total clients</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Scorés</p>
              <p className="text-2xl font-bold text-primary">{scored}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Non scorés</p>
              <p
                className={
                  "text-2xl font-bold " +
                  (unscored > 0 ? "text-destructive" : "text-muted-foreground")
                }
              >
                {unscored}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span>Couverture</span>
              <span className="font-mono">{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>

          {unscored > 0 && data?.unscoredClients.length ? (
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span>
                    Voir les clients non scorés
                    {unscored > data.unscoredClients.length &&
                      ` (top ${data.unscoredClients.length})`}
                  </span>
                  <ChevronDown
                    className={
                      "h-4 w-4 transition-transform " + (open ? "rotate-180" : "")
                    }
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.unscoredClients.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{c.name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive" className="text-[10px]">
                            Non scoré
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}