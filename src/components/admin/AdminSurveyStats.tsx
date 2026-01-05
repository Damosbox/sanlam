import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, CheckCircle, Star } from "lucide-react";

export const AdminSurveyStats = () => {
  const { data: sends } = useQuery({
    queryKey: ["survey-sends-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_sends")
        .select("status, recipient_type, created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: responses } = useQuery({
    queryKey: ["survey-responses-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("nps_score, submitted_at");
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const totalSent = sends?.filter((s) => s.status !== "pending").length || 0;
  const totalCompleted = sends?.filter((s) => s.status === "completed").length || 0;
  const responseRate = totalSent > 0 ? Math.round((totalCompleted / totalSent) * 100) : 0;

  // NPS calculation
  const npsScores = responses?.map((r) => r.nps_score).filter(Boolean) as number[];
  const promoters = npsScores?.filter((s) => s >= 9).length || 0;
  const passives = npsScores?.filter((s) => s >= 7 && s <= 8).length || 0;
  const detractors = npsScores?.filter((s) => s <= 6).length || 0;
  const totalNps = npsScores?.length || 1;
  const npsScore = Math.round(((promoters - detractors) / totalNps) * 100);

  // Status distribution
  const statusData = [
    { name: "Envoyé", value: sends?.filter((s) => s.status === "sent").length || 0, color: "hsl(var(--primary))" },
    { name: "Ouvert", value: sends?.filter((s) => s.status === "opened").length || 0, color: "hsl(var(--yellow))" },
    { name: "Complété", value: sends?.filter((s) => s.status === "completed").length || 0, color: "hsl(var(--bright-green))" },
    { name: "Expiré", value: sends?.filter((s) => s.status === "expired").length || 0, color: "hsl(var(--red))" },
  ];

  // NPS distribution
  const npsDistribution = [
    { name: "Promoteurs (9-10)", value: promoters, color: "hsl(var(--bright-green))" },
    { name: "Passifs (7-8)", value: passives, color: "hsl(var(--yellow))" },
    { name: "Détracteurs (0-6)", value: detractors, color: "hsl(var(--red))" },
  ];

  // Audience distribution
  const clientSends = sends?.filter((s) => s.recipient_type === "client").length || 0;
  const brokerSends = sends?.filter((s) => s.recipient_type === "broker").length || 0;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Statistiques des enquêtes</h3>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total envoyé</p>
                <p className="text-2xl font-bold">{totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[hsl(var(--bright-green))]/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[hsl(var(--bright-green))]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de réponse</p>
                <p className="text-2xl font-bold">{responseRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[hsl(var(--yellow))]/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-[hsl(var(--yellow))]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score NPS</p>
                <p className="text-2xl font-bold">{npsScore > 0 ? `+${npsScore}` : npsScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Réponses totales</p>
                <p className="text-2xl font-bold">{responses?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution des statuts</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution NPS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={npsDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {npsDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Audience breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par audience</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Clients</span>
                <span className="text-2xl font-bold">{clientSends}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${(clientSends / (clientSends + brokerSends || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Intermédiaires</span>
                <span className="text-2xl font-bold">{brokerSends}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-[hsl(var(--bright-green))]"
                  style={{
                    width: `${(brokerSends / (clientSends + brokerSends || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
