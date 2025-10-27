import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Clock, Sparkles, Loader2, Brain } from "lucide-react";
import { QuizPreventionModal } from "./QuizPreventionModal";

interface UserMission {
  id: string;
  status: string;
  progress: number;
  expires_at: string | null;
  points_earned: number | null;
  loyalty_missions: {
    id: string;
    name: string;
    description: string;
    mission_type: string;
    points_reward: number;
  };
}

export const MissionsList = () => {
  const [missions, setMissions] = useState<UserMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_missions')
        .select('*, loyalty_missions(*)')
        .eq('user_id', user.id)
        .in('status', ['available', 'in_progress'])
        .order('loyalty_missions(priority)', { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les missions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIMissions = async () => {
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('loyalty-ai-missions');

      if (error) throw error;

      toast({
        title: "Missions générées !",
        description: `${data.missions.length} nouvelles missions personnalisées ajoutées`,
      });

      fetchMissions();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les missions IA",
        variant: "destructive",
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getMissionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      payment: 'Paiement',
      referral: 'Parrainage',
      profile_update: 'Profil',
      quiz: 'Quiz',
      claim_free: 'Sans sinistre',
      social_share: 'Partage',
      document_upload: 'Document',
      subscription: 'Souscription',
      renewal: 'Renouvellement',
      app_download: 'Application',
      survey: 'Enquête',
    };
    return labels[type] || type;
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Vos missions</h3>
            <p className="text-sm text-muted-foreground">
              Complétez des missions pour gagner des points
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowQuiz(true)}
              variant="outline"
              className="gap-2"
            >
              <Brain className="w-4 h-4" />
              Quiz Prévention
            </Button>
            <Button 
              onClick={generateAIMissions} 
              disabled={generatingAI}
              className="gap-2"
            >
              {generatingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Missions IA
                </>
              )}
            </Button>
          </div>
        </div>

      {missions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-semibold mb-2">Aucune mission disponible</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Générez des missions personnalisées avec l'IA
            </p>
            <Button onClick={generateAIMissions} disabled={generatingAI}>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer des missions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => {
            const daysRemaining = getDaysRemaining(mission.expires_at);
            
            return (
              <Card key={mission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getStatusIcon(mission.status)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{mission.loyalty_missions.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {mission.loyalty_missions.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          +{mission.loyalty_missions.points_reward} pts
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getMissionTypeLabel(mission.loyalty_missions.mission_type)}
                        </Badge>
                        
                        {daysRemaining !== null && daysRemaining < 7 && (
                          <Badge 
                            variant="destructive" 
                            className="text-xs"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {daysRemaining === 0 ? "Expire aujourd'hui" : `${daysRemaining}j restants`}
                          </Badge>
                        )}
                      </div>

                      {mission.status === 'in_progress' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progression</span>
                            <span>{mission.progress}%</span>
                          </div>
                          <Progress value={mission.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>

    <QuizPreventionModal 
      open={showQuiz} 
      onOpenChange={setShowQuiz}
      onComplete={() => {
        fetchMissions();
      }}
    />
  </>
  );
};