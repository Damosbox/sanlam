import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, TrendingUp, Briefcase, UserCheck, Download } from "lucide-react";
import { PeriodFilter, computeDateRange, DateRange } from "@/components/broker/dashboard/PeriodFilter";
import { formatFCFA } from "@/utils/formatCurrency";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TopBottomAgents } from "@/components/admin/TopBottomAgents";
import { exportToCSV } from "@/utils/exportCsv";

interface AgentPortfolio {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  partner_type: string | null;
  clientCount: number;
  leadCount: number;
  totalPremium: number;
  activePolicies: number;
}

interface MonthlyCA { month: string; ca: number; }

const PARTNER_TYPE_LABELS: Record<string, string> = {
  courtier: "Courtier", agent_general: "Agent Général", agent_mandataire: "Agent Mandataire",
  agent_sanlam: "Agent Sanlam Allianz", banquier: "Banquier",
};

export default function AgentsPortfolioPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentPortfolio[]>([]);
  const [monthlyCA, setMonthlyCA] = useState<MonthlyCA[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(computeDateRange("fiscal_year"));

  useEffect(() => { fetchAgents(); }, [dateRange]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const { data: brokerRoles } = await supabase.from("user_roles").select("user_id").eq("role", "broker");
      if (!brokerRoles || brokerRoles.length === 0) { setAgents([]); setMonthlyCA([]); setLoading(false); return; }
      const brokerIds = brokerRoles.map((r) => r.user_id);

      const { data: profiles } = await supabase.from("profiles").select("id, email, first_name, last_name, partner_type").in("id", brokerIds);

      const { data: allSubs } = await supabase.from("subscriptions").select("assigned_broker_id, monthly_premium, start_date")
        .eq("status", "active").gte("start_date", dateRange.from.toISOString()).lte("start_date", dateRange.to.toISOString());

      const monthMap = new Map<string, number>();
      for (const s of allSubs || []) { const d = new Date(s.start_date); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; monthMap.set(key, (monthMap.get(key) || 0) + (Number(s.monthly_premium) || 0)); }
      setMonthlyCA(Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, ca]) => ({ month, ca })));

      const portfolios: AgentPortfolio[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count: clientCount } = await supabase.from("broker_clients").select("*", { count: "exact", head: true }).eq("broker_id", profile.id);
          const { count: leadCount } = await supabase.from("leads").select("*", { count: "exact", head: true }).eq("assigned_broker_id", profile.id);
          const agentSubs = (allSubs || []).filter((s) => s.assigned_broker_id === profile.id);
          const totalPremium = agentSubs.reduce((sum, s) => sum + (Number(s.monthly_premium) || 0), 0);
          const { count: activePolicies } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("assigned_broker_id", profile.id).eq("status", "active");
          return { id: profile.id, email: profile.email, first_name: profile.first_name, last_name: profile.last_name, partner_type: profile.partner_type, clientCount: clientCount || 0, leadCount: leadCount || 0, totalPremium, activePolicies: activePolicies || 0 };
        })
      );
      setAgents(portfolios);
    } catch (error) { console.error("Error fetching agents portfolio:", error); } finally { setLoading(false); }
  };

  const totals = agents.reduce((acc, a) => ({ clients: acc.clients + a.clientCount, leads: acc.leads + a.leadCount, premium: acc.premium + a.totalPremium, policies: acc.policies + a.activePolicies }), { clients: 0, leads: 0, premium: 0, policies: 0 });

  const sorted = [...agents].sort((a, b) => b.totalPremium - a.totalPremium);
  const topAgents = sorted.slice(0, 3).map((a) => ({ name: `${a.first_name || ""} ${a.last_name || ""}`, value: formatFCFA(a.totalPremium) }));
  const bottomAgents = sorted.slice(-3).reverse().map((a) => ({ name: `${a.first_name || ""} ${a.last_name || ""}`, value: formatFCFA(a.totalPremium) }));

  const handleExport = () => {
    exportToCSV(agents.map((a) => ({
      Agent: `${a.first_name || ""} ${a.last_name || ""}`, Type: PARTNER_TYPE_LABELS[a.partner_type || ""] || "—",
      Clients: a.clientCount, Prospects: a.leadCount, "Polices actives": a.activePolicies, "CA (FCFA)": a.totalPremium,
    })), "portefeuille-agents");
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portefeuille Agents</h1>
          <p className="text-muted-foreground">Vue consolidée du portefeuille et chiffre d'affaires par agent</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />CSV</Button>
          <PeriodFilter onPeriodChange={setDateRange} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Agents</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{agents.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Clients</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totals.clients}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Polices Actives</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totals.policies}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">CA Total</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatFCFA(totals.premium)}</div></CardContent></Card>
      </div>

      <TopBottomAgents metricLabel="CA Total" topAgents={topAgents} bottomAgents={bottomAgents} />

      {monthlyCA.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Évolution du CA mensuel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyCA}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="month" className="text-xs" /><YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(value: number) => [formatFCFA(value), "CA"]} /><Bar dataKey="ca" className="fill-primary" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Type</TableHead><TableHead className="text-center">Clients</TableHead><TableHead className="text-center">Prospects</TableHead><TableHead className="text-center">Polices actives</TableHead><TableHead className="text-right">CA (primes)</TableHead></TableRow></TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/agents/${agent.id}`)}>
                  <TableCell><div><p className="font-medium">{agent.first_name} {agent.last_name}</p><p className="text-xs text-muted-foreground">{agent.email}</p></div></TableCell>
                  <TableCell><Badge variant="outline">{PARTNER_TYPE_LABELS[agent.partner_type || ""] || "—"}</Badge></TableCell>
                  <TableCell className="text-center font-medium">{agent.clientCount}</TableCell>
                  <TableCell className="text-center font-medium">{agent.leadCount}</TableCell>
                  <TableCell className="text-center font-medium">{agent.activePolicies}</TableCell>
                  <TableCell className="text-right font-semibold">{formatFCFA(agent.totalPremium)}</TableCell>
                </TableRow>
              ))}
              {agents.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun agent trouvé</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
