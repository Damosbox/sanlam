import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatFCFA } from "@/utils/formatCurrency";
import {
  BENEFITS,
  DIRECTION_KPIS,
  MEMBERSHIP_TREND,
  OPERATIONAL_ALERTS,
  PARTNERS,
  SEVERITY_RANK,
  TIER_META,
  TIER_ORDER,
  isSlaBreached,
} from "@/data/zoPme";
import { KpiCard } from "../shared/KpiCard";
import { SeverityBadge } from "../shared/badges";
import { ScopeNote } from "../shared/states";
import { useZoPme } from "../ZoPmeProvider";
import {
  ArrowRight,
  CreditCard,
  Gift,
  Handshake,
  Smile,
  Store,
  Users,
} from "lucide-react";

const KPI_ICONS = {
  membres: Users,
  cartes: CreditCard,
  partenaires: Handshake,
  satisfaction: Smile,
} as const;

export function DirectionView({ period }: { period: string }) {
  const navigate = useNavigate();
  const { pmes, cards, benefits } = useZoPme();

  const kpis = DIRECTION_KPIS[period] ?? DIRECTION_KPIS["30d"];

  const tierDistribution = useMemo(() => {
    const counts = TIER_ORDER.map((tier) => ({
      tier,
      count: pmes.filter((p) => p.fidelite.palier === tier).length,
    }));
    const total = counts.reduce((s, c) => s + c.count, 0) || 1;
    return counts.map((c) => ({ ...c, pct: Math.round((c.count / total) * 100) }));
  }, [pmes]);

  const topPartners = useMemo(
    () => [...PARTNERS].sort((a, b) => b.volumePeriode - a.volumePeriode).slice(0, 5),
    []
  );

  const topBenefits = useMemo(
    () => [...benefits].sort((a, b) => b.usagesPeriode - a.usagesPeriode).slice(0, 5),
    [benefits]
  );

  const alerts = useMemo(() => {
    const slaBreaches = cards.filter(isSlaBreached).length;
    return [...OPERATIONAL_ALERTS]
      .map((a) =>
        a.categorie === "sla"
          ? {
              ...a,
              detail: `${slaBreaches} carte(s) dépassent leur SLA cible dans le cycle de production.`,
            }
          : a
      )
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  }, [cards]);

  const maxTrend = Math.max(...MEMBERSHIP_TREND.map((m) => m.adhesions));

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        Cockpit Direction en lecture seule : aucune action opérationnelle n'est disponible depuis
        cette vue. Les corrections se font depuis Marketing, Souscription ou Administration.
      </ScopeNote>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            trendDirection={kpi.trendDirection}
            icon={KPI_ICONS[kpi.key as keyof typeof KPI_ICONS]}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Répartition fidélité</CardTitle>
            <CardDescription>
              Score de fidélité /100 des PME réparti sur les 4 paliers Zô PME
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tierDistribution.map((t) => (
              <div key={t.tier}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: TIER_META[t.tier].color }}
                    />
                    {t.tier}
                  </span>
                  <span className="text-muted-foreground">
                    {t.count} PME · {t.pct} %
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${t.pct}%`, backgroundColor: TIER_META[t.tier].color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {TIER_META[t.tier].avantages}
                </p>
              </div>
            ))}
            <Separator />
            <ScopeNote tone="backend">
              Segmentation RFM non affichée ici : elle dépend de la future table d'activations et
              reste distincte du score de fidélité.
            </ScopeNote>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tendance adhésions / résiliations</CardTitle>
            <CardDescription>6 derniers mois, valeurs consolidées du programme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {MEMBERSHIP_TREND.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div
                      className="w-1/2 rounded-t bg-primary/80 transition-all"
                      style={{ height: `${(m.adhesions / maxTrend) * 100}%` }}
                      title={`${m.adhesions} adhésions`}
                    />
                    <div
                      className="w-1/3 rounded-t bg-destructive/50 transition-all"
                      style={{ height: `${(m.resiliations / maxTrend) * 100}%` }}
                      title={`${m.resiliations} résiliations`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary/80" /> Adhésions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-destructive/50" /> Résiliations
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Top 5 partenaires
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {topPartners.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                  <span className="text-xs font-semibold text-muted-foreground w-4">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.nom}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.categorie} · {p.usagesPeriode} usages
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold shrink-0">
                    {formatFCFA(p.volumePeriode)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Top 5 avantages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {topBenefits.map((b, i) => {
                const partner = PARTNERS.find((p) => p.id === b.partnerId);
                return (
                  <li key={b.id} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                    <span className="text-xs font-semibold text-muted-foreground w-4">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.libelle}</p>
                      <p className="text-xs text-muted-foreground truncate">{partner?.nom}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {b.usagesPeriode}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alertes opérationnelles</CardTitle>
          <CardDescription>
            SLA, conventions, inactivité et anomalies, triées par sévérité
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{alert.titre}</p>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.detail}</p>
                {alert.vueCible && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-1.5 text-xs"
                    onClick={() => navigate(`/b2b/zo-pme?vue=${alert.vueCible}`)}
                  >
                    Consulter la vue concernée
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
