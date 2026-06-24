import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Award,
  Medal,
  Trophy,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClientScore, useRecalcClientScore } from "@/hooks/useClientScore";
import { useUserRole } from "@/hooks/useUserRole";
import {
  VF_NIVEAU_LABEL,
  VF_FIELD_LABELS,
  VF_SCORE_MIN,
  VF_SCORE_MAX,
  getNextThreshold,
  type VfNiveau,
} from "@/lib/scoring/vfV2";
import { ScoringActionDialog } from "./ScoringActionDialog";
import { ScoringHistoryList } from "./ScoringHistoryList";

interface ClientValueScoreProps {
  clientId: string;
  productType?: string;
  compact?: boolean;
}

const NIVEAU_ICON: Record<VfNiveau, typeof Trophy> = {
  bronze: Medal,
  argent: Medal,
  or: Award,
  platine: Trophy,
};

const NIVEAU_COLOR: Record<VfNiveau, string> = {
  bronze: "text-amber-700 bg-amber-50 border-amber-200",
  argent: "text-slate-700 bg-slate-100 border-slate-300",
  or: "text-yellow-700 bg-yellow-50 border-yellow-300",
  platine: "text-cyan-700 bg-cyan-50 border-cyan-300",
};

const CRITERIA = [
  { key: "vf_score_anciennete", label: "Ancienneté", max: 20 },
  { key: "vf_score_prime", label: "Prime", max: 30 },
  { key: "vf_score_multi_equipements", label: "Multi-équipements", max: 20 },
  { key: "vf_score_sinistre", label: "Sinistre responsable", max: 15, min: -5 },
  { key: "vf_score_action_ponctuelle", label: "Action ponctuelle", max: 15 },
] as const;

export const ClientValueScore = ({ clientId, compact = false }: ClientValueScoreProps) => {
  const { data: score, isLoading, error, refetch } = useClientScore(clientId);
  const recalc = useRecalcClientScore();
  const { role } = useUserRole();
  const [actionOpen, setActionOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const canSeeKyc =
    role === "admin" ||
    role === "backoffice_crc" ||
    role === "backoffice_conformite" ||
    role === "compliance";

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Chargement du score">
        <Skeleton className="h-24 w-full" />
        {!compact && <Skeleton className="h-32 w-full" />}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-center space-y-2">
          <p className="text-sm text-destructive">Erreur lors du chargement du score</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const scoreGlobal = score?.vf_score_global;
  const hasScore = typeof scoreGlobal === "number";
  const niveau = (score?.vf_niveau as VfNiveau | null) ?? null;

  // No data — propose to calculate
  if (!hasScore) {
    if (compact) {
      return <span className="text-xs text-muted-foreground">Score non disponible</span>;
    }
    return (
      <Card>
        <CardContent className="p-4 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Score de fidélité non disponible</p>
          <Button
            size="sm"
            onClick={() => recalc.mutate({ clientId, trigger: "manual" })}
            disabled={recalc.isPending}
          >
            {recalc.isPending ? "Calcul en cours…" : "Calculer le score"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isNegative = scoreGlobal < 0;
  const { next, pointsTo } = getNextThreshold(scoreGlobal);
  // Progress bar covers the full range [-5..100]; bar fill in % of range
  const range = VF_SCORE_MAX - VF_SCORE_MIN;
  const fillPct = ((scoreGlobal - VF_SCORE_MIN) / range) * 100;
  const NiveauIcon = niveau ? NIVEAU_ICON[niveau] : Medal;

  // ===== Compact view (portfolio table / inline) =====
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn("text-xs gap-1", niveau && NIVEAU_COLOR[niveau])}
        >
          <NiveauIcon className="h-3 w-3" aria-hidden="true" />
          {niveau ? VF_NIVEAU_LABEL[niveau] : "—"}
        </Badge>
        <span
          className={cn(
            "text-xs font-mono font-semibold",
            isNegative && "text-destructive",
          )}
          aria-label={`Score ${scoreGlobal} sur 100`}
        >
          {scoreGlobal > 0 ? "+" : ""}
          {scoreGlobal}/100
        </span>
        {score?.vf_is_partial && (
          <Badge variant="outline" className="text-[10px]">Partiel</Badge>
        )}
      </div>
    );
  }

  // ===== Full view =====
  return (
    <div className="space-y-4">
      {/* Header score card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Score de fidélité
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-4xl font-bold",
                    isNegative ? "text-destructive" : "text-primary",
                  )}
                >
                  {scoreGlobal > 0 ? "+" : ""}
                  {scoreGlobal}
                </span>
                <span className="text-lg text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <Badge
                variant="outline"
                className={cn("gap-1.5", niveau && NIVEAU_COLOR[niveau])}
              >
                <NiveauIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {niveau ? VF_NIVEAU_LABEL[niveau] : "—"}
              </Badge>
              {score?.vf_is_partial && (
                <div>
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    Score partiel
                  </Badge>
                </div>
              )}
              {canSeeKyc && score?.vf_kyc_flag && (
                <div>
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                    KYC / AML
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar -5..100 with malus segment */}
          <div
            role="progressbar"
            aria-valuenow={scoreGlobal}
            aria-valuemin={VF_SCORE_MIN}
            aria-valuemax={VF_SCORE_MAX}
            aria-label={`Score de fidélité ${scoreGlobal} sur 100, niveau ${
              niveau ? VF_NIVEAU_LABEL[niveau] : "inconnu"
            }`}
            className="relative h-2 w-full rounded-full bg-muted overflow-hidden"
          >
            {/* Zone malus (rouge léger) à gauche du 0 */}
            <div
              className="absolute inset-y-0 left-0 bg-destructive/20"
              style={{
                width: `${((0 - VF_SCORE_MIN) / range) * 100}%`,
              }}
              aria-hidden="true"
            />
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all",
                isNegative ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${Math.max(2, fillPct)}%` }}
              aria-hidden="true"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {isNegative ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex items-center gap-1 text-destructive font-medium cursor-help"
                      tabIndex={0}
                      aria-describedby="malus-tooltip"
                    >
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      Malus actif
                    </span>
                  </TooltipTrigger>
                  <TooltipContent id="malus-tooltip">
                    Le client a 2 sinistres responsables ou plus sur les 12 derniers mois.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : next ? (
              <span>
                {pointsTo} pt{pointsTo > 1 ? "s" : ""} pour passer{" "}
                <strong>{VF_NIVEAU_LABEL[next]}</strong>
              </span>
            ) : (
              <span>Niveau maximum atteint</span>
            )}
            {score?.calculated_at && (
              <span className="text-[11px]">
                MAJ {new Date(score.calculated_at).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>

          {score?.vf_is_partial && score.vf_missing_fields?.length ? (
            <p className="text-xs text-muted-foreground">
              Champs manquants :{" "}
              {score.vf_missing_fields
                .map((f) => VF_FIELD_LABELS[f] ?? f)
                .join(", ")}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => recalc.mutate({ clientId, trigger: "manual" })}
              disabled={recalc.isPending}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5 mr-1.5", recalc.isPending && "animate-spin")}
                aria-hidden="true"
              />
              Recalculer
            </Button>
            <Button size="sm" onClick={() => setActionOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Action ponctuelle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Détail des 5 critères */}
      <Collapsible open={detailOpen} onOpenChange={setDetailOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <span>Voir le détail des 5 critères</span>
            {detailOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card>
            <CardContent className="p-4 space-y-2">
              {CRITERIA.map((c) => {
                const value = (score as any)?.[c.key] as number | null;
                const min = (c as any).min ?? 0;
                const span = c.max - min;
                const v = value ?? 0;
                const pct = span > 0 ? ((v - min) / span) * 100 : 0;
                return (
                  <div key={c.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{c.label}</span>
                      <span className="font-mono">
                        {v} / {c.max}
                        {min < 0 && ` (min ${min})`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          v < 0 ? "bg-destructive" : "bg-primary",
                        )}
                        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Historique */}
      <ScoringHistoryList clientId={clientId} />

      <ScoringActionDialog
        clientId={clientId}
        open={actionOpen}
        onOpenChange={setActionOpen}
      />
    </div>
  );
};
    setIsLoading(true);
    try {
      // Fetch client data for score calculation
      const [subsResult, claimsResult] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*, products(name, category)")
          .eq("user_id", clientId),
        supabase
          .from("claims")
          .select("*")
          .eq("user_id", clientId),
      ]);

      const subscriptions = subsResult.data || [];
      const claims = claimsResult.data || [];

      // Filter by product type if specified
      let filteredSubs = subscriptions;
      if (productType && productType !== "all") {
        const categoryMap: Record<string, string[]> = {
          auto: ["auto", "automobile"],
          mrh: ["mrh", "habitation"],
          sante: ["sante", "santé"],
          vie: ["vie", "epargne"],
          obseques: ["obseques", "obsèques"],
        };
        const categories = categoryMap[productType] || [];
        filteredSubs = subscriptions.filter(sub => {
          const cat = ((sub.products as any)?.category || "").toLowerCase();
          return categories.some(c => cat.includes(c));
        });
      }

      // Calculate dimensions (simulated scoring algorithm)
      const totalPremium = filteredSubs.reduce((sum, s) => sum + (s.monthly_premium * 12), 0);
      const avgPremium = filteredSubs.length > 0 ? totalPremium / filteredSubs.length : 0;
      const claimsCount = claims.length;
      const claimsCost = claims.reduce((sum, c) => sum + (c.cost_estimation || 0), 0);
      const sinistralite = totalPremium > 0 ? (claimsCost / totalPremium) : 0;
      
      // Calculate contract ages
      const now = new Date();
      const avgAnciennete = filteredSubs.length > 0 
        ? filteredSubs.reduce((sum, s) => {
            const start = new Date(s.start_date);
            return sum + ((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
          }, 0) / filteredSubs.length
        : 0;

      // Score dimensions (0-10 scale)
      const dimensions = {
        prime: Math.min(10, Math.round((avgPremium / 100000) * 10) / 10 || 5),
        sinistre: Math.min(10, Math.round((1 - sinistralite) * 10) / 10 || 7),
        charge: Math.min(10, Math.round((1 - (claimsCount * 0.2)) * 10) / 10 || 8),
        responsabilite: Math.round(5 + Math.random() * 4),
        duree: Math.min(10, Math.round(avgAnciennete * 2) || 3),
        garantie: Math.round(5 + Math.random() * 4),
        couverture: Math.round(6 + Math.random() * 3),
        anciennete: Math.min(10, Math.round(avgAnciennete * 2.5) || 4),
        objet: Math.round(5 + Math.random() * 4),
      };

      // Calculate global score (weighted average)
      const weights = { prime: 2, sinistre: 2, charge: 1.5, responsabilite: 1, duree: 1.5, garantie: 1, couverture: 1, anciennete: 1.5, objet: 0.5 };
      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
      const weightedSum = Object.entries(dimensions).reduce((sum, [key, val]) => {
        return sum + val * (weights[key as keyof typeof weights] || 1);
      }, 0);
      const scoreGlobal = Math.round((weightedSum / totalWeight) * 10);

      // Calculate class (1-5 stars)
      const classe = Math.ceil(scoreGlobal / 20);

      // Prepare radar data
      const radarData = [
        { subject: "Prime", value: dimensions.prime, fullMark: 10 },
        { subject: "Sinistre", value: dimensions.sinistre, fullMark: 10 },
        { subject: "Charge", value: dimensions.charge, fullMark: 10 },
        { subject: "Garantie", value: dimensions.garantie, fullMark: 10 },
        { subject: "Durée", value: dimensions.duree, fullMark: 10 },
        { subject: "Ancienneté", value: dimensions.anciennete, fullMark: 10 },
      ];

      setScore({ scoreGlobal, classe, dimensions, radarData });
    } catch (error) {
      console.error("Error calculating client score:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        {!compact && <Skeleton className="h-64 w-full" />}
      </div>
    );
  }

  if (!score) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Impossible de calculer le score client
      </div>
    );
  }

  // Compact view - just the badge
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i < score.classe ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <Badge variant="outline" className="text-xs font-bold">
          {score.scoreGlobal}/100
        </Badge>
      </div>
    );
  }

  // Full view with radar chart and grid
  return (
    <div className="space-y-4">
      {/* Global Score Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Score Global Client</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-primary">{score.scoreGlobal}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Classe</p>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-5 w-5",
                      i < score.classe ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Profil de Valeur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={score.radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 10]} 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Score Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Détail des Scores /10</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(score.dimensions).slice(0, 9).map(([key, value]) => {
              const config = DIMENSION_CONFIG[key as keyof typeof DIMENSION_CONFIG];
              const Icon = config?.icon || Star;
              return (
                <div 
                  key={key}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={cn("h-4 w-4", config?.color || "text-muted-foreground")} />
                    <span className="text-lg font-bold">{value.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{config?.label || key}</p>
                  {/* Mini progress bar */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(value / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
