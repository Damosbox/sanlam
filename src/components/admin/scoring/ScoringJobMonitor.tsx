import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Play, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ScoringCoverageCard } from "./ScoringCoverageCard";
import { ScoringCronSchedule } from "./ScoringCronSchedule";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MANUAL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes entre 2 lancements manuels

const TRIGGER_LABEL: Record<string, string> = {
  manual: "Manuel",
  cron_daily: "Cron quotidien",
  cron_weekly: "Cron hebdo",
  cron_monthly: "Cron mensuel",
  monthly_job: "Manuel (legacy)",
};

export function ScoringJobMonitor() {
  const qc = useQueryClient();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: runs, isLoading, refetch } = useQuery({
    queryKey: ["scoring-job-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_job_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const launch = useMutation({
    mutationFn: async () => {
      const lastManual = runs?.find((r: any) =>
        ["manual", "monthly_job"].includes(r.trigger),
      );
      if (lastManual) {
        const elapsed = Date.now() - new Date(lastManual.started_at).getTime();
        if (elapsed < MANUAL_COOLDOWN_MS) {
          const wait = Math.ceil((MANUAL_COOLDOWN_MS - elapsed) / 1000);
          throw new Error(
            `Veuillez patienter ${wait}s avant de relancer un job manuel.`,
          );
        }
      }
      const { data, error } = await supabase.functions.invoke(
        "score-monthly-recalc",
        { body: {} },
      );
      if (error) throw error;
      return data as { run_id: string; processed: number; errors_count: number };
    },
    onSuccess: (data) => {
      toast.success(
        `Job terminé : ${data.processed} clients traités, ${data.errors_count} erreur(s).`,
      );
      qc.invalidateQueries({ queryKey: ["scoring-job-runs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lastRun = runs?.[0];
  const lastError = lastRun?.status === "error";

  const lastManualRun = runs?.find((r: any) =>
    ["manual", "monthly_job"].includes(r.trigger),
  );
  const cooldownRemainingMs = lastManualRun
    ? Math.max(
        0,
        MANUAL_COOLDOWN_MS - (now - new Date(lastManualRun.started_at).getTime()),
      )
    : 0;
  const cooldownActive = cooldownRemainingMs > 0;
  const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);
  const cooldownLabel =
    cooldownSeconds >= 60
      ? `${Math.floor(cooldownSeconds / 60)} min ${String(cooldownSeconds % 60).padStart(2, "0")}s`
      : `${cooldownSeconds}s`;

  return (
    <div className="space-y-4">
      <ScoringCoverageCard />
      <ScoringCronSchedule />

      {lastError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Le dernier job de recalcul s'est terminé en erreur ({lastRun?.errors_count} erreur(s)).
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Historique des exécutions</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Rafraîchir
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      onClick={() => launch.mutate()}
                      disabled={launch.isPending || cooldownActive}
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      {launch.isPending
                        ? "Exécution…"
                        : cooldownActive
                        ? `Disponible dans ${cooldownLabel}`
                        : "Lancer maintenant"}
                    </Button>
                  </span>
                </TooltipTrigger>
                {cooldownActive && (
                  <TooltipContent>
                    Délai de sécurité de 5 min entre deux lancements manuels.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Démarré</TableHead>
                <TableHead>Déclencheur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Clients</TableHead>
                <TableHead className="text-right">Non scorés</TableHead>
                <TableHead className="text-right">Erreurs</TableHead>
                <TableHead className="text-right">Durée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!runs || runs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    Aucune exécution enregistrée.
                  </TableCell>
                </TableRow>
              )}
              {runs?.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    {format(new Date(r.started_at), "d MMM yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-xs">
                    {TRIGGER_LABEL[r.trigger] ?? r.trigger}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "success"
                          ? "default"
                          : r.status === "error"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {r.clients_processed ?? "—"}
                    {r.clients_total != null && (
                      <span className="text-muted-foreground"> / {r.clients_total}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {r.clients_unscored != null ? (
                      <span className={r.clients_unscored > 0 ? "text-destructive" : ""}>
                        {r.clients_unscored}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {r.errors_count ?? 0}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)} s` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}