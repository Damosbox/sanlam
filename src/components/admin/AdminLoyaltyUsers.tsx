import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Trophy, TrendingUp } from "lucide-react";

export const AdminLoyaltyUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_profiles')
        .select('*, profiles(display_name, email)')
        .order('total_points', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-orange-100 text-orange-800 border-orange-300',
      silver: 'bg-gray-100 text-gray-800 border-gray-300',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      platinum: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[level] || 'bg-muted';
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      bronze: '🥉 Bronze',
      silver: '🥈 Argent',
      gold: '🥇 Or',
      platinum: '💎 Platine',
    };
    return labels[level] || level;
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.profiles?.display_name?.toLowerCase().includes(query) ||
      user.profiles?.email?.toLowerCase().includes(query) ||
      user.referral_code?.toLowerCase().includes(query)
    );
  });

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
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher par nom, email ou code de parrainage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} utilisateurs
        </p>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((user, idx) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
                    #{idx + 1}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">
                      {user.profiles?.display_name || user.profiles?.email || 'Utilisateur'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Code: {user.referral_code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-2xl font-bold text-primary">
                        {user.total_points}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>

                  <div className="text-right">
                    <Badge className={getLevelColor(user.current_level) + " border"}>
                      {getLevelLabel(user.current_level)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user.level_progress}% vers le suivant
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{user.referral_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">parrainages</p>
                  </div>

                  <div className="text-right">
                    <span className="font-semibold">
                      {Array.isArray(user.badges_earned) ? user.badges_earned.length : 0}
                    </span>
                    <p className="text-xs text-muted-foreground">badges</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};