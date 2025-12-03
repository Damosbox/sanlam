import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, TrendingUp, AlertTriangle, 
  Target, ArrowRight, RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  type: "upsell" | "cross_sell" | "risk" | "opportunity";
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
}

const typeConfig = {
  upsell: { 
    icon: TrendingUp, 
    label: "Upsell", 
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  },
  cross_sell: { 
    icon: Target, 
    label: "Cross-sell", 
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  risk: { 
    icon: AlertTriangle, 
    label: "Risque", 
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20"
  },
  opportunity: { 
    icon: Sparkles, 
    label: "Opportunité", 
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  },
};

export const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    setIsLoading(true);
    
    // Simulated AI recommendations
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockRecommendations: Recommendation[] = [
      {
        id: "1",
        type: "opportunity",
        title: "3 clients proches de l'expiration",
        description: "Polices auto expirant dans les 30 prochains jours. Contactez-les pour renouvellement.",
        action: "Voir les clients",
        priority: "high",
      },
      {
        id: "2",
        type: "upsell",
        title: "Upgrade santé recommandé",
        description: "5 clients avec couverture santé basique pourraient bénéficier d'une formule premium.",
        action: "Analyser",
        priority: "medium",
      },
      {
        id: "3",
        type: "cross_sell",
        title: "Vente croisée habitation",
        description: "8 clients auto n'ont pas d'assurance habitation. Potentiel de conversion élevé.",
        action: "Voir opportunités",
        priority: "medium",
      },
      {
        id: "4",
        type: "risk",
        title: "Leads inactifs depuis 7 jours",
        description: "4 leads n'ont pas été contactés. Risque de perte vers la concurrence.",
        action: "Relancer",
        priority: "high",
      },
    ];

    setRecommendations(mockRecommendations);
    setIsLoading(false);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Recommandations IA
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={generateRecommendations}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          recommendations.map((rec) => {
            const config = typeConfig[rec.type];
            const Icon = config.icon;
            
            return (
              <div
                key={rec.id}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                  config.borderColor,
                  config.bgColor
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg bg-background/50")}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">
                        {rec.title}
                      </p>
                      <Badge variant="outline" className={cn("text-[10px]", config.color)}>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {rec.description}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn("h-7 text-xs px-2", config.color)}
                    >
                      {rec.action}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
