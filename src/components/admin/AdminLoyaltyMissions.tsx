import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

export const AdminLoyaltyMissions = () => {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_missions')
        .select('*')
        .order('priority', { ascending: false });

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

  const toggleMissionStatus = async (missionId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('loyalty_missions')
        .update({ is_active: !currentStatus })
        .eq('id', missionId);

      if (error) throw error;

      toast({
        title: "Mission mise à jour",
        description: `Mission ${!currentStatus ? 'activée' : 'désactivée'}`,
      });

      fetchMissions();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la mission",
        variant: "destructive",
      });
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {missions.length} missions configurées
        </p>
        <Button className="gap-2" disabled>
          <Plus className="w-4 h-4" />
          Nouvelle mission (bientôt)
        </Button>
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <Card key={mission.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{mission.name}</h4>
                    <Badge variant="outline">
                      {getMissionTypeLabel(mission.mission_type)}
                    </Badge>
                    <Badge variant="secondary">
                      +{mission.points_reward} pts
                    </Badge>
                    {mission.is_recurring && (
                      <Badge>
                        ♻️ {mission.recurrence_period}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {mission.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Priorité: {mission.priority}</span>
                    <span>Créé le {new Date(mission.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={mission.is_active}
                      onCheckedChange={() => toggleMissionStatus(mission.id, mission.is_active)}
                    />
                    <span className="text-sm">{mission.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <Button variant="ghost" size="icon" disabled>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};