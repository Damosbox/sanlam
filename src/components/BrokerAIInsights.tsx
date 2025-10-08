import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InsightCard } from "@/components/InsightCard";
import { RecommendationCard } from "@/components/RecommendationCard";

interface InsightData {
  insights: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
  }>;
  recommendations: Array<{
    action: string;
    impact: string;
    priority: string;
  }>;
  summary: string;
}

export const BrokerAIInsights = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const { toast } = useToast();

  const generateInsights = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erreur",
          description: "Non authentifié",
          variant: "destructive",
        });
        return;
      }

      // Fetch broker's claims data
      const { data: claims } = await supabase
        .from("claims")
        .select("claim_type, status, cost_estimation, ai_confidence, created_at")
        .eq("assigned_broker_id", user.id);

      if (!claims || claims.length === 0) {
        toast({
          title: "Information",
          description: "Aucun sinistre disponible pour générer des analyses IA.",
        });
        setLoading(false);
        return;
      }

      // Calculate enriched statistics
      const byType = claims.reduce((acc: any[], claim) => {
        const existing = acc.find(item => item.type === claim.claim_type);
        if (existing) {
          existing.count++;
          existing.totalCost += claim.cost_estimation || 0;
        } else {
          acc.push({
            type: claim.claim_type,
            count: 1,
            totalCost: claim.cost_estimation || 0
          });
        }
        return acc;
      }, []);

      const byStatus = claims.reduce((acc: any[], claim) => {
        const existing = acc.find(item => item.status === claim.status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ status: claim.status, count: 1 });
        }
        return acc;
      }, []);

      const claimsData = {
        total: claims.length,
        pending: claims.filter(c => c.status === "Submitted").length,
        reviewed: claims.filter(c => c.status === "Reviewed").length,
        totalCost: claims.reduce((sum, c) => sum + (c.cost_estimation || 0), 0),
        avgConfidence: claims.reduce((sum, c) => sum + (c.ai_confidence || 0), 0) / claims.length,
        byType,
        byStatus,
        highValueCount: claims.filter(c => (c.cost_estimation || 0) > 5000).length
      };

      // Call new broker-insights edge function
      const { data, error } = await supabase.functions.invoke('broker-insights', {
        body: { claimsData }
      });

      if (error) throw error;

      setInsights(data as InsightData);
      toast({
        title: "Succès",
        description: "Analyse IA générée",
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'analyse IA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Recommandations IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Générez des insights et recommandations basés sur vos sinistres assignés
          </p>
          
          <Button 
            onClick={generateInsights} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Générer l'analyse
              </>
            )}
          </Button>

          {insights && (
            <div className="mt-6 space-y-6">
              {insights.summary && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">Résumé exécutif</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insights.summary}</p>
                  </div>
                </div>
              )}

              {insights.insights && insights.insights.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Insights détectés
                    <Badge variant="secondary">{insights.insights.length}</Badge>
                  </h4>
                  <div className="grid gap-3">
                    {insights.insights.map((insight, index) => (
                      <InsightCard
                        key={index}
                        type={insight.type}
                        title={insight.title}
                        description={insight.description}
                        priority={insight.priority}
                      />
                    ))}
                  </div>
                </div>
              )}

              {insights.recommendations && insights.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recommandations
                    <Badge variant="secondary">{insights.recommendations.length}</Badge>
                  </h4>
                  <div className="space-y-2">
                    {insights.recommendations.map((rec, index) => (
                      <RecommendationCard
                        key={index}
                        action={rec.action}
                        impact={rec.impact}
                        priority={rec.priority}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
