import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2, Users, Gift, CheckCircle2 } from "lucide-react";

interface LoyaltyProfile {
  referral_code: string;
  referral_count: number;
}

interface Referral {
  id: string;
  status: string;
  reward_earned: number | null;
  created_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
}

export const ReferralProgram = () => {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileData, referralsData] = await Promise.all([
        supabase.from('loyalty_profiles').select('referral_code, referral_count').eq('user_id', user.id).single(),
        supabase
          .from('referral_tracking')
          .select('*, profiles!referral_tracking_referred_user_id_fkey(display_name, email)')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (profileData.data) setProfile(profileData.data);
      if (referralsData.data) setReferrals(referralsData.data as any);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de parrainage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!profile) return;

    try {
      await navigator.clipboard.writeText(profile.referral_code);
      toast({
        title: "Copié !",
        description: "Code de parrainage copié dans le presse-papier",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le code",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    if (!profile) return;
    const message = `Rejoignez Box Africa avec mon code de parrainage ${profile.referral_code} et bénéficiez d'avantages exclusifs ! 🎁`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      completed: 'Complété',
      rewarded: 'Récompensé',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      completed: 'bg-blue-500',
      rewarded: 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Programme de Parrainage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 bg-background rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Votre code de parrainage</p>
            <p className="text-4xl font-bold tracking-wider mb-4">{profile?.referral_code}</p>
            
            <div className="flex gap-2 justify-center">
              <Input 
                value={profile?.referral_code || ''} 
                readOnly 
                className="max-w-xs text-center font-mono"
              />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={shareViaWhatsApp} className="gap-2">
              <Share2 className="w-4 h-4" />
              Partager via WhatsApp
            </Button>
            <Button variant="outline" className="gap-2" disabled>
              <Share2 className="w-4 h-4" />
              Autres options (bientôt)
            </Button>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold">Gagnez 100 points par parrainage</p>
                <p className="text-sm text-muted-foreground">
                  Invitez vos amis et gagnez des points quand ils souscrivent
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{profile?.referral_count || 0}</p>
              <p className="text-sm text-muted-foreground">Parrainages</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-500">
                {referrals.filter(r => r.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Complétés</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-500">
                {referrals.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Vos filleuls</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun parrainage pour le moment</p>
              <p className="text-sm">Partagez votre code pour commencer !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div 
                  key={referral.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(referral.status)}`}></div>
                    <div>
                      <p className="font-medium">
                        {referral.profiles?.display_name || referral.profiles?.email || 'Utilisateur'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {getStatusLabel(referral.status)}
                    </Badge>
                    {referral.status === 'rewarded' && referral.reward_earned && (
                      <Badge className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        +{referral.reward_earned} pts
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};