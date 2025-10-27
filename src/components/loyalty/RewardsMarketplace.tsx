import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Gift, Lock, CheckCircle, Loader2 } from "lucide-react";

interface Reward {
  id: string;
  name: string;
  description: string;
  reward_type: string;
  cost_in_points: number;
  required_level: string;
  reward_value: number | null;
  image_url: string | null;
  terms_conditions: string | null;
  stock_available: number | null;
}

interface LoyaltyProfile {
  total_points: number;
  current_level: string;
}

export const RewardsMarketplace = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [rewardsData, profileData] = await Promise.all([
        supabase.from('loyalty_rewards').select('*').eq('is_active', true).order('cost_in_points'),
        supabase.from('loyalty_profiles').select('*').eq('user_id', user.id).single()
      ]);

      if (rewardsData.data) setRewards(rewardsData.data);
      if (profileData.data) setProfile(profileData.data);
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

  const canClaimReward = (reward: Reward) => {
    if (!profile) return false;
    
    const levelOrder: Record<string, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
    const hasLevel = levelOrder[profile.current_level] >= levelOrder[reward.required_level];
    const hasPoints = profile.total_points >= reward.cost_in_points;
    const inStock = reward.stock_available === null || reward.stock_available > 0;
    
    return hasLevel && hasPoints && inStock;
  };

  const claimReward = async () => {
    if (!selectedReward) return;

    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke('loyalty-claim-reward', {
        body: { rewardId: selectedReward.id }
      });

      if (error) throw error;

      toast({
        title: "Récompense réclamée !",
        description: `Code de rédemption: ${data.userReward.redemption_code}`,
      });

      setSelectedReward(null);
      fetchData();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réclamer la récompense",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
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
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded"></div>
              </div>
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
            <h3 className="text-lg font-semibold">Boutique de récompenses</h3>
            <p className="text-sm text-muted-foreground">
              Vous avez {profile?.total_points.toLocaleString()} points
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const canClaim = canClaimReward(reward);
            const levelOrder: Record<string, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
            const hasLevel = profile && levelOrder[profile.current_level] >= levelOrder[reward.required_level];

            return (
              <Card 
                key={reward.id} 
                className={`${canClaim ? 'hover:shadow-lg cursor-pointer' : 'opacity-60'} transition-all`}
                onClick={() => canClaim && setSelectedReward(reward)}
              >
                <CardContent className="p-0">
                  <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                    {reward.image_url ? (
                      <img src={reward.image_url} alt={reward.name} className="w-full h-full object-cover" />
                    ) : (
                      <Gift className="w-16 h-16 text-primary" />
                    )}
                    {!hasLevel && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold">{reward.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {reward.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {getRewardTypeLabel(reward.reward_type)}
                      </Badge>
                      <Badge 
                        variant={hasLevel ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {getLevelLabel(reward.required_level)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="font-bold text-lg">{reward.cost_in_points} pts</span>
                      {reward.stock_available !== null && (
                        <span className="text-xs text-muted-foreground">
                          Stock: {reward.stock_available}
                        </span>
                      )}
                    </div>

                    <Button 
                      className="w-full" 
                      disabled={!canClaim}
                      onClick={() => setSelectedReward(reward)}
                    >
                      {!hasLevel ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Niveau requis
                        </>
                      ) : profile && profile.total_points < reward.cost_in_points ? (
                        "Points insuffisants"
                      ) : reward.stock_available === 0 ? (
                        "Rupture de stock"
                      ) : (
                        "Réclamer"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Reward Details Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedReward?.name}</DialogTitle>
            <DialogDescription>{selectedReward?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-medium">Coût</span>
              <span className="text-xl font-bold">{selectedReward?.cost_in_points} points</span>
            </div>

            {selectedReward?.reward_value && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium">Valeur</span>
                <span className="font-bold">{selectedReward.reward_value.toLocaleString()} FCFA</span>
              </div>
            )}

            {selectedReward?.terms_conditions && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Conditions</p>
                <p className="text-xs text-muted-foreground">{selectedReward.terms_conditions}</p>
              </div>
            )}

            {profile && selectedReward && (
              <div className="p-4 border rounded-lg">
                <p className="text-sm">
                  Après échange, il vous restera <span className="font-bold">{(profile.total_points - selectedReward.cost_in_points).toLocaleString()} points</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReward(null)}>
              Annuler
            </Button>
            <Button onClick={claimReward} disabled={claiming}>
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};