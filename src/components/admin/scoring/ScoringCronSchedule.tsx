import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const SCHEDULES = [
  {
    name: "Quotidien",
    cron: "0 2 * * *",
    when: "Tous les jours à 02h00 UTC",
    scope: "Clients non scorés ou stale > 30 j",
    badge: "Delta",
  },
  {
    name: "Hebdomadaire",
    cron: "0 3 * * 1",
    when: "Tous les lundis à 03h00 UTC",
    scope: "Recalcul complet du portefeuille",
    badge: "Full",
  },
  {
    name: "Mensuel",
    cron: "0 4 1 * *",
    when: "Le 1er du mois à 04h00 UTC",
    scope: "Recalcul complet + rapport de couverture",
    badge: "Full",
  },
];

export function ScoringCronSchedule() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Planifications automatiques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {SCHEDULES.map((s) => (
          <div
            key={s.name}
            className="flex items-start justify-between gap-3 rounded-md border p-3"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.when}</p>
              <p className="text-xs text-muted-foreground">{s.scope}</p>
            </div>
            <div className="text-right space-y-1.5">
              <Badge variant="outline" className="font-mono text-[10px]">
                {s.cron}
              </Badge>
              <div>
                <Badge
                  variant={s.badge === "Delta" ? "secondary" : "default"}
                  className="text-[10px]"
                >
                  {s.badge}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}