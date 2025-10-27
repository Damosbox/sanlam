import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

export const AdminLoyaltyRewards = () => {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .order('cost_in_points');

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les récompenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRewardStatus = async (rewardId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .update({ is_active: !currentStatus })
        .eq('id', rewardId);

      if (error) throw error;

      toast({
        title: "Récompense mise à jour",
        description: `Récompense ${!currentStatus ? 'activée' : 'désactivée'}`,
      });

      fetchRewards();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la récompense",
        variant: "destructive",
      });
    }
  };

  const getRewardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      discount: 'Réduction',
      gift_card: 'Bon cadeau',
      premium_reduction: 'Réduction prime',
      free_option: 'Option gratuite',
      partner_voucher: 'Bon partenaire',
      lottery_entry: 'Tirage au sort',
      priority_service: 'Service prioritaire',
    };
    return labels[type] || type;
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      bronze: 'Bronze',
      silver: 'Argent',
      gold: 'Or',
      platinum: 'Platine',
    };
    return labels[level] || level;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-32 bg-muted rounded"></div>
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
          {rewards.length} récompenses disponibles
        </p>
        <Button className="gap-2" disabled>
          <Plus className="w-4 h-4" />
          Nouvelle récompense (bientôt)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <Card key={reward.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{reward.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {reward.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    {getRewardTypeLabel(reward.reward_type)}
                  </Badge>
                  <Badge variant="secondary">
                    {getLevelLabel(reward.required_level)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <p className="text-2xl font-bold text-primary">{reward.cost_in_points} pts</p>
                    {reward.stock_available !== null && (
                      <p className="text-xs text-muted-foreground">Stock: {reward.stock_available}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={reward.is_active}
                      onCheckedChange={() => toggleRewardStatus(reward.id, reward.is_active)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" disabled>
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Trash2 className="w-3 h-3" />
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