import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Gift, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface LoyaltyProfile {
  total_points: number;
  current_level: string;
  level_progress: number;
  points_to_next_level: number;
  badges_earned: unknown;
  referral_code: string;
  referral_count: number;
}

interface LoyaltyLevel {
  level_name: string;
  color_theme: string;
  icon: string;
  benefits: any;
}

export const LoyaltyDashboard = () => {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [levels, setLevels] = useState<LoyaltyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileData, levelsData] = await Promise.all([
        supabase.from('loyalty_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('loyalty_levels').select('*').order('display_order')
      ]);

      if (profileData.data) setProfile(profileData.data);
      if (levelsData.data) setLevels(levelsData.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre profil fidélité",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Profil fidélité non trouvé</p>
        </CardContent>
      </Card>
    );
  }

  const currentLevelData = levels.find(l => l.level_name === profile.current_level);
  const nextLevel = levels.find(l => levels.indexOf(l) === levels.findIndex(l => l.level_name === profile.current_level) + 1);

  const levelLabels: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Argent',
    gold: 'Or',
    platinum: 'Platine',
  };

  return (
    <div className="space-y-6">
      {/* Main Level Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className="text-9xl opacity-10">{currentLevelData?.icon}</div>
        </div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="secondary" 
                  className="text-lg px-3 py-1"
                  style={{ backgroundColor: currentLevelData?.color_theme + '20' }}
                >
                  {currentLevelData?.icon} {levelLabels[profile.current_level]}
                </Badge>
              </div>
              <h3 className="text-3xl font-bold">{profile.total_points.toLocaleString()} pts</h3>
              <p className="text-sm text-muted-foreground">Points de fidélité</p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/b2c?tab=loyalty-missions')}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Voir missions
            </Button>
          </div>

          {nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression vers {levelLabels[nextLevel.level_name]}</span>
                <span className="font-medium">{profile.level_progress}%</span>
              </div>
              <Progress value={profile.level_progress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                Plus que {profile.points_to_next_level} points pour débloquer le niveau {levelLabels[nextLevel.level_name]}
              </p>
            </div>
          )}

          {!nextLevel && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <Trophy className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium">Niveau maximum atteint ! 🎉</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Array.isArray(profile.badges_earned) ? profile.badges_earned.length : 0}</p>
              <p className="text-xs text-muted-foreground">Badges débloqués</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile.referral_count}</p>
              <p className="text-xs text-muted-foreground">Parrainages</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentLevelData?.benefits?.discount || 0}%</p>
              <p className="text-xs text-muted-foreground">Réduction active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Section */}
      {profile.badges_earned && Array.isArray(profile.badges_earned) && profile.badges_earned.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Vos badges
            </h4>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
              {profile.badges_earned.map((badge: any, idx: number) => (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-3xl">
                    {badge.icon || '🏆'}
                  </div>
                  <p className="text-xs font-medium truncate">{badge.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6 text-center">
            <Zap className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h4 className="font-semibold mb-2">Compléter des missions</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Gagnez des points en complétant des missions adaptées à votre profil
            </p>
            <Button onClick={() => navigate('/b2c?tab=loyalty-missions')}>
              Voir les missions
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardContent className="p-6 text-center">
            <Gift className="w-12 h-12 mx-auto mb-3 text-secondary" />
            <h4 className="font-semibold mb-2">Échanger vos points</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Découvrez les récompenses exclusives et utilisez vos points
            </p>
            <Button variant="secondary" onClick={() => navigate('/b2c?tab=loyalty-rewards')}>
              Voir récompenses
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};