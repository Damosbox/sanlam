import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, TrendingUp, Briefcase, UserCheck } from "lucide-react";
import { PeriodFilter, computeDateRange, DateRange } from "@/components/broker/dashboard/PeriodFilter";
import { formatFCFA } from "@/utils/formatCurrency";

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

const PARTNER_TYPE_LABELS: Record<string, string> = {
  courtier: "Courtier",
  agent_general: "Agent Général",
  agent_mandataire: "Agent Mandataire",
  agent_sanlam: "Agent Sanlam Allianz",
  banquier: "Banquier",
};

export default function AgentsPortfolioPage() {
  const [agents, setAgents] = useState<AgentPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(computeDateRange("fiscal_year"));

  useEffect(() => {
    fetchAgents();
  }, [dateRange]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // Get all broker profiles
      const { data: brokerRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "broker");

      if (!brokerRoles || brokerRoles.length === 0) {
        setAgents([]);
        setLoading(false);
        return;
      }

      const brokerIds = brokerRoles.map((r) => r.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, partner_type")
        .in("id", brokerIds);

      // Build portfolio for each agent
      const portfolios: AgentPortfolio[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Count clients
          const { count: clientCount } = await supabase
            .from("broker_clients")
            .select("*", { count: "exact", head: true })
            .eq("broker_id", profile.id);

          // Count leads
          const { count: leadCount } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("assigned_broker_id", profile.id);

          // Sum premiums from subscriptions in period
          const { data: subs } = await supabase
            .from("subscriptions")
            .select("monthly_premium")
            .eq("assigned_broker_id", profile.id)
            .eq("status", "active")
            .gte("start_date", dateRange.from.toISOString())
            .lte("start_date", dateRange.to.toISOString());

          const totalPremium = (subs || []).reduce(
            (sum, s) => sum + (Number(s.monthly_premium) || 0),
            0
          );

          // Count active policies
          const { count: activePolicies } = await supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("assigned_broker_id", profile.id)
            .eq("status", "active");

          return {
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            partner_type: profile.partner_type,
            clientCount: clientCount || 0,
            leadCount: leadCount || 0,
            totalPremium,
            activePolicies: activePolicies || 0,
          };
        })
      );

      setAgents(portfolios);
    } catch (error) {
      console.error("Error fetching agents portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  const totals = agents.reduce(
    (acc, a) => ({
      clients: acc.clients + a.clientCount,
      leads: acc.leads + a.leadCount,
      premium: acc.premium + a.totalPremium,
      policies: acc.policies + a.activePolicies,
    }),
    { clients: 0, leads: 0, premium: 0, policies: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portefeuille Agents</h1>
          <p className="text-muted-foreground">Vue consolidée du portefeuille et chiffre d'affaires par agent</p>
        </div>
        <PeriodFilter onPeriodChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.clients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Polices Actives</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.policies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFCFA(totals.premium)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Clients</TableHead>
                <TableHead className="text-center">Prospects</TableHead>
                <TableHead className="text-center">Polices actives</TableHead>
                <TableHead className="text-right">CA (primes)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {agent.first_name} {agent.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {PARTNER_TYPE_LABELS[agent.partner_type || ""] || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{agent.clientCount}</TableCell>
                  <TableCell className="text-center font-medium">{agent.leadCount}</TableCell>
                  <TableCell className="text-center font-medium">{agent.activePolicies}</TableCell>
                  <TableCell className="text-right font-semibold">{formatFCFA(agent.totalPremium)}</TableCell>
                </TableRow>
              ))}
              {agents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun agent trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
