import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Users, Zap, Gift, TrendingUp, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const AdminLoyaltyStats = () => {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: totalUsers },
        { count: activeMissions },
        { count: completedMissions },
        { count: claimedRewards },
        { data: levelDistribution },
        { data: topUsers },
      ] = await Promise.all([
        supabase.from('loyalty_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_missions').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('user_missions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('user_rewards').select('*', { count: 'exact', head: true }),
        supabase
          .from('loyalty_profiles')
          .select('current_level')
          .then(({ data }) => {
            const distribution = data?.reduce((acc: any, { current_level }) => {
              acc[current_level] = (acc[current_level] || 0) + 1;
              return acc;
            }, {});
            return { data: distribution };
          }),
        supabase
          .from('loyalty_profiles')
          .select('user_id, total_points, profiles(display_name)')
          .order('total_points', { ascending: false })
          .limit(5),
      ]);

      setStats({
        totalUsers,
        activeMissions,
        completedMissions,
        claimedRewards,
        levelDistribution,
        topUsers,
        completionRate: activeMissions ? Math.round((completedMissions / (completedMissions + activeMissions)) * 100) : 0,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const levelData = stats.levelDistribution ? Object.entries(stats.levelDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
  })) : [];

  const COLORS = ['#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs</p>
                <p className="text-3xl font-bold">{stats.totalUsers || 0}</p>
              </div>
              <Users className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Missions actives</p>
                <p className="text-3xl font-bold">{stats.activeMissions || 0}</p>
              </div>
              <Zap className="w-10 h-10 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Missions complétées</p>
                <p className="text-3xl font-bold">{stats.completedMissions || 0}</p>
              </div>
              <Target className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Récompenses réclamées</p>
                <p className="text-3xl font-bold">{stats.claimedRewards || 0}</p>
              </div>
              <Gift className="w-10 h-10 text-secondary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution des niveaux</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={levelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {levelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topUsers?.map((user: any, idx: number) => (
                <div key={user.user_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-yellow-500 text-white' : 
                      idx === 1 ? 'bg-gray-400 text-white' : 
                      idx === 2 ? 'bg-orange-600 text-white' : 
                      'bg-muted-foreground/20'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="font-medium">
                      {user.profiles?.display_name || 'Utilisateur'}
                    </span>
                  </div>
                  <span className="font-bold text-primary">{user.total_points} pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Taux d'engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Taux de complétion des missions</span>
                <span className="font-bold">{stats.completionRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-4">
                <div 
                  className="bg-primary h-4 rounded-full transition-all" 
                  style={{ width: `${stats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};