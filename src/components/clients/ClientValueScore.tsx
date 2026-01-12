import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Star, TrendingUp, AlertTriangle, Shield, Clock, CreditCard, Target, Users, Wallet } from "lucide-react";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface ClientValueScoreProps {
  clientId: string;
  productType?: string;
  compact?: boolean;
}

interface ScoreData {
  scoreGlobal: number;
  classe: number;
  dimensions: {
    prime: number;
    sinistre: number;
    charge: number;
    responsabilite: number;
    duree: number;
    garantie: number;
    couverture: number;
    anciennete: number;
    objet: number;
  };
  radarData: { subject: string; value: number; fullMark: number }[];
}

const DIMENSION_CONFIG = {
  prime: { label: "Prime", icon: Wallet, color: "text-emerald-600" },
  sinistre: { label: "Sinistralité", icon: AlertTriangle, color: "text-amber-600" },
  charge: { label: "Charge", icon: CreditCard, color: "text-blue-600" },
  responsabilite: { label: "Responsabilité", icon: Shield, color: "text-purple-600" },
  duree: { label: "Durée", icon: Clock, color: "text-cyan-600" },
  garantie: { label: "Garantie", icon: Target, color: "text-rose-600" },
  couverture: { label: "Couverture", icon: Shield, color: "text-indigo-600" },
  anciennete: { label: "Ancienneté", icon: Users, color: "text-orange-600" },
  objet: { label: "Objet", icon: Star, color: "text-teal-600" },
};

export const ClientValueScore = ({ clientId, productType, compact = false }: ClientValueScoreProps) => {
  const [score, setScore] = useState<ScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateScore();
  }, [clientId, productType]);

  const calculateScore = async () => {
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
