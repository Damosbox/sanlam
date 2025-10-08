import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const BrokerAIInsights = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
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
        setInsights("Aucun sinistre disponible pour générer des analyses IA.");
        return;
      }

      // Call AI edge function for insights
      const { data, error } = await supabase.functions.invoke('ai-diagnostic', {
        body: {
          profile: {
            claimsCount: claims.length,
            avgConfidence: claims.reduce((sum, c) => sum + (c.ai_confidence || 0), 0) / claims.length,
            types: [...new Set(claims.map(c => c.claim_type))],
            pending: claims.filter(c => c.status === "Submitted").length,
          }
        }
      });

      if (error) throw error;

      setInsights(JSON.stringify(data.recommendations, null, 2));
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
            <div className="mt-4 p-4 rounded-lg bg-muted">
              <pre className="text-xs whitespace-pre-wrap">{insights}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
