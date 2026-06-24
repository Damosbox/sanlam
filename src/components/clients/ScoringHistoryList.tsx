import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useScoringActions, useScoringHistory } from "@/hooks/useClientScore";
import { VF_ACTION_TYPES, VF_NIVEAU_LABEL } from "@/lib/scoring/vfV2";
import { Skeleton } from "@/components/ui/skeleton";

const TRIGGER_LABEL: Record<string, string> = {
  action: "Action ponctuelle",
  monthly_job: "Recalcul mensuel",
  manual: "Recalcul manuel",
  seed: "Initialisation",
};

export function ScoringHistoryList({ clientId }: { clientId: string }) {
  const actions = useScoringActions(clientId);
  const history = useScoringHistory(clientId);

  return (
    <div className="space-y-6">
      <section>
        <h4 className="text-sm font-semibold mb-2">Actions ponctuelles (12 derniers mois)</h4>
        {actions.isLoading ? (
          <Skeleton className="h-16" />
        ) : !actions.data?.length ? (
          <p className="text-sm text-muted-foreground">Aucune action enregistrée.</p>
        ) : (
          <ul className="space-y-2">
            {actions.data.map((a) => {
              const def = VF_ACTION_TYPES.find((t) => t.value === a.type);
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{def?.label ?? a.type}</p>
                    {a.note && (
                      <p className="text-xs text-muted-foreground">{a.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">+{a.points} pts</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(a.created_at), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold mb-2">Historique des recalculs</h4>
        {history.isLoading ? (
          <Skeleton className="h-16" />
        ) : !history.data?.length ? (
          <p className="text-sm text-muted-foreground">Aucun recalcul enregistré.</p>
        ) : (
          <ul className="space-y-2">
            {history.data.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {TRIGGER_LABEL[h.trigger] ?? h.trigger}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(h.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <span className="font-mono">
                    {h.score_before ?? "—"} → <strong>{h.score_after}</strong>
                  </span>
                  {h.niveau_before !== h.niveau_after && h.niveau_after && (
                    <p className="text-xs text-primary">
                      {h.niveau_before ? VF_NIVEAU_LABEL[h.niveau_before as keyof typeof VF_NIVEAU_LABEL] : "—"}
                      {" → "}
                      {VF_NIVEAU_LABEL[h.niveau_after as keyof typeof VF_NIVEAU_LABEL]}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}