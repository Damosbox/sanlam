import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Star, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface ScoreDimension {
  dimension: string;
  label: string;
  value: number;
  maxValue: number;
  trend?: "up" | "down" | "stable";
  description: string;
}

interface ScoreDetailPopoverProps {
  score: number;
  classe: number;
  clientId: string;
  clientType: "prospect" | "client";
  children: React.ReactNode;
}

// Generate mock score dimensions based on client type
const generateMockDimensions = (
  score: number,
  clientType: "prospect" | "client"
): ScoreDimension[] => {
  if (clientType === "prospect") {
    return [
      {
        dimension: "potentiel",
        label: "Potentiel",
        value: Math.round(score * 0.8 + Math.random() * 20),
        maxValue: 100,
        trend: "up",
        description: "Estimation du potentiel de conversion",
      },
      {
        dimension: "engagement",
        label: "Engagement",
        value: Math.round(40 + Math.random() * 40),
        maxValue: 100,
        trend: "stable",
        description: "Niveau d'interaction avec vos communications",
      },
      {
        dimension: "profil",
        label: "Profil",
        value: Math.round(50 + Math.random() * 30),
        maxValue: 100,
        description: "Complétude des informations profil",
      },
      {
        dimension: "urgence",
        label: "Urgence",
        value: Math.round(30 + Math.random() * 50),
        maxValue: 100,
        trend: "up",
        description: "Indicateur de besoin immédiat",
      },
    ];
  }

  return [
    {
      dimension: "prime",
      label: "Prime",
      value: Math.round(score * 0.9 + Math.random() * 10),
      maxValue: 100,
      trend: "stable",
      description: "Valeur des primes annuelles",
    },
    {
      dimension: "anciennete",
      label: "Ancienneté",
      value: Math.round(50 + Math.random() * 40),
      maxValue: 100,
      trend: "up",
      description: "Durée de la relation client",
    },
    {
      dimension: "sinistralite",
      label: "Sinistralité",
      value: Math.round(60 + Math.random() * 30),
      maxValue: 100,
      description: "Ratio sinistres/primes (inversé)",
    },
    {
      dimension: "couverture",
      label: "Couverture",
      value: Math.round(40 + Math.random() * 40),
      maxValue: 100,
      trend: "down",
      description: "Niveau de couverture souscrite",
    },
    {
      dimension: "regularite",
      label: "Régularité",
      value: Math.round(70 + Math.random() * 25),
      maxValue: 100,
      trend: "stable",
      description: "Ponctualité des paiements",
    },
    {
      dimension: "multi_produits",
      label: "Multi-produits",
      value: Math.round(20 + Math.random() * 60),
      maxValue: 100,
      description: "Diversification du portefeuille",
    },
    {
      dimension: "recommandation",
      label: "Recommandation",
      value: Math.round(30 + Math.random() * 50),
      maxValue: 100,
      trend: "up",
      description: "Potentiel de parrainage",
    },
    {
      dimension: "responsabilite",
      label: "Responsabilité",
      value: Math.round(50 + Math.random() * 40),
      maxValue: 100,
      description: "Historique des responsabilités",
    },
    {
      dimension: "fidelite",
      label: "Fidélité",
      value: Math.round(60 + Math.random() * 35),
      maxValue: 100,
      trend: "stable",
      description: "Probabilité de renouvellement",
    },
  ];
};

const TrendIcon = ({ trend }: { trend?: "up" | "down" | "stable" }) => {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

export const ScoreDetailPopover = ({
  score,
  classe,
  clientId,
  clientType,
  children,
}: ScoreDetailPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dimensions = generateMockDimensions(score, clientType);

  // Prepare data for radar chart
  const radarData = dimensions.map((d) => ({
    subject: d.label,
    value: d.value,
    fullMark: d.maxValue,
  }));

  const getScoreInterpretation = (score: number): string => {
    if (score >= 80) return "Excellent client à forte valeur";
    if (score >= 60) return "Bon client avec potentiel de développement";
    if (score >= 40) return "Client standard, opportunités de cross-sell";
    if (score >= 20) return "Client à surveiller, risque de churn";
    return "Client à risque, action requise";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0"
        sideOffset={10}
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Score Valeur Client</h4>
              <p className="text-xs text-muted-foreground">
                {clientType === "prospect" ? "Score prédictif" : "Basé sur l'activité"}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < classe
                        ? "text-amber-500 fill-amber-500"
                        : "text-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
              <p className="text-lg font-bold text-primary">{score}/100</p>
            </div>
          </div>

          {/* Interpretation */}
          <div className="bg-muted/50 rounded-lg p-2 flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {getScoreInterpretation(score)}
            </p>
          </div>

          {/* Radar Chart */}
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Dimensions List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground">
              Détail des dimensions
            </p>
            {dimensions.map((dim) => (
              <div
                key={dim.dimension}
                className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{dim.label}</span>
                  {dim.trend && <TrendIcon trend={dim.trend} />}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        dim.value >= 70
                          ? "bg-emerald-500"
                          : dim.value >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                      )}
                      style={{ width: `${dim.value}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-right">
                    {dim.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
