import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, TrendingUp, AlertTriangle, 
  Target, ArrowRight, RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Recommendation {
  id: string;
  type: "upsell" | "cross_sell" | "risk" | "opportunity";
  title: string;
  description: string;
  action: string;
  priority?: "low" | "medium" | "high";
}

const typeConfig = {
  upsell: { 
    icon: TrendingUp, 
    label: "Upsell", 
    color: "text-success",
    bgColor: "bg-success/5",
  },
  cross_sell: { 
    icon: Target, 
    label: "Cross-sell", 
    color: "text-primary",
    bgColor: "bg-primary/5",
  },
  risk: { 
    icon: AlertTriangle, 
    label: "Risque", 
    color: "text-warning",
    bgColor: "bg-warning/5",
  },
  opportunity: { 
    icon: Sparkles, 
    label: "Opportunité", 
    color: "text-secondary",
    bgColor: "bg-secondary/5",
  },
};

export const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Non authentifié");
      }

      const { data, error } = await supabase.functions.invoke('broker-dashboard-recommendations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error("Format de réponse invalide");
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setHasError(true);
      toast.error("Erreur lors de la génération des recommandations IA");
      
      // Fallback to mock data if API fails
      setRecommendations([
        {
          id: "fallback-1",
          type: "opportunity",
          title: "Données en cours de chargement",
          description: "Actualisez pour obtenir des recommandations personnalisées",
          action: "Actualiser",
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/60 bg-gradient-to-br from-muted/30 to-background">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Analyse IA
            {!isLoading && !hasError && recommendations.length > 0 && (
              <Badge variant="secondary" className="text-[9px] px-1.5 h-4">
                {recommendations.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={generateRecommendations}
            disabled={isLoading}
            className="h-7 text-xs px-2"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
        <ScrollArea className="h-[180px] sm:h-[200px]">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 sm:h-16 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {recommendations.map((rec, index) => {
                const config = typeConfig[rec.type] || typeConfig.opportunity;
                const Icon = config.icon;
                
                return (
                  <div
                    key={rec.id}
                    className={cn(
                      "p-2.5 sm:p-3 rounded-lg transition-all duration-200",
                      "hover:bg-muted/50 group cursor-pointer",
                      config.bgColor
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 shrink-0", config.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                          <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                            {rec.title}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={cn("text-[8px] sm:text-[9px] px-1 sm:px-1.5 h-3.5 sm:h-4 shrink-0 hidden sm:flex", config.color)}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {rec.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 sm:h-6 text-[10px] sm:text-xs px-1.5 sm:px-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        {rec.action || <ArrowRight className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
