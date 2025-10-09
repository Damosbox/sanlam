import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  basePremium: number;
  coverages: any;
  reason: string;
  similarityScore: number;
  usersCount: number;
}

interface Props {
  onSubscribe?: (productId: string) => void;
}

export const PeopleLikeYouRecommendations = ({ onSubscribe }: Props) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-recommendations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les recommandations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Des personnes comme vous ont souscrit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Recommandations personnalisées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Complétez votre profil pour recevoir des recommandations personnalisées
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Des personnes comme vous ont souscrit
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Recommandations basées sur votre profil et les choix d'utilisateurs similaires
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="overflow-hidden transition-base hover:shadow-medium">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{rec.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {rec.category}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-primary font-semibold mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">{rec.similarityScore}%</span>
                  </div>
                  {rec.usersCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {rec.usersCount} utilisateur{rec.usersCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {rec.description}
              </p>

              <div className="bg-primary/5 p-3 rounded-lg mb-3">
                <p className="text-xs font-medium mb-1 text-primary">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Pourquoi pour vous ?
                </p>
                <p className="text-xs text-foreground">
                  {rec.reason}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">À partir de</p>
                  <p className="font-semibold text-lg">
                    {Number(rec.basePremium).toLocaleString('fr-FR')} FCFA
                    <span className="text-xs text-muted-foreground font-normal">/mois</span>
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => onSubscribe?.(rec.id)}
                  className="transition-base"
                >
                  Découvrir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};