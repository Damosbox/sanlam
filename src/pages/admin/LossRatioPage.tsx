import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, TrendingUp, Shield, Download } from "lucide-react";
import { PeriodFilter, computeDateRange, DateRange } from "@/components/broker/dashboard/PeriodFilter";
import { formatFCFA } from "@/utils/formatCurrency";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TopBottomAgents } from "@/components/admin/TopBottomAgents";
import { exportToCSV } from "@/utils/exportCsv";

interface AgentLossRatio {
  agentId: string;
  agentName: string;
  totalPremiums: number;
  totalClaims: number;
  lossRatio: number;
  claimCount: number;
}

const THRESHOLD = 70;

export default function LossRatioPage() {
  const [data, setData] = useState<AgentLossRatio[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(computeDateRange("fiscal_year"));

  useEffect(() => { fetchData(); }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: brokerRoles } = await supabase.from("user_roles").select("user_id").eq("role", "broker");
      const brokerIds = (brokerRoles || []).map((r) => r.user_id);
      if (brokerIds.length === 0) { setData([]); setLoading(false); return; }

      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", brokerIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`]));

      const { data: subs } = await supabase.from("subscriptions").select("assigned_broker_id, monthly_premium")
        .eq("status", "active").gte("start_date", dateRange.from.toISOString()).lte("start_date", dateRange.to.toISOString());

      const { data: claims } = await supabase.from("claims").select("assigned_broker_id, cost_estimation")
        .gte("created_at", dateRange.from.toISOString()).lte("created_at", dateRange.to.toISOString());

      const premiumMap = new Map<string, number>();
      for (const s of subs || []) { if (!s.assigned_broker_id) continue; premiumMap.set(s.assigned_broker_id, (premiumMap.get(s.assigned_broker_id) || 0) + (Number(s.monthly_premium) || 0)); }

      const claimMap = new Map<string, { total: number; count: number }>();
      for (const c of claims || []) { if (!c.assigned_broker_id) continue; const cur = claimMap.get(c.assigned_broker_id) || { total: 0, count: 0 }; cur.total += Number(c.cost_estimation) || 0; cur.count++; claimMap.set(c.assigned_broker_id, cur); }

      const result: AgentLossRatio[] = brokerIds.map((id) => {
        const premiums = premiumMap.get(id) || 0;
        const claimData = claimMap.get(id) || { total: 0, count: 0 };
        return { agentId: id, agentName: profileMap.get(id) || "—", totalPremiums: premiums, totalClaims: claimData.total, lossRatio: premiums > 0 ? (claimData.total / premiums) * 100 : 0, claimCount: claimData.count };
      }).sort((a, b) => b.lossRatio - a.lossRatio);

      setData(result);
    } catch (error) { console.error("Error fetching loss ratio:", error); } finally { setLoading(false); }
  };

  const totalPremiums = data.reduce((s, d) => s + d.totalPremiums, 0);
  const totalClaims = data.reduce((s, d) => s + d.totalClaims, 0);
  const globalRatio = totalPremiums > 0 ? (totalClaims / totalPremiums) * 100 : 0;
  const aboveThreshold = data.filter((d) => d.lossRatio > THRESHOLD).length;

  const chartData = data.filter((d) => d.totalPremiums > 0).slice(0, 15).map((d) => ({
    name: d.agentName.trim().split(" ").map(n => n.charAt(0)).join("") || "?",
    fullName: d.agentName, ratio: Math.round(d.lossRatio),
  }));

  // Top3 = lowest ratio (best), Bottom3 = highest ratio (worst)
  const withPremiums = data.filter((d) => d.totalPremiums > 0);
  const sorted = [...withPremiums].sort((a, b) => a.lossRatio - b.lossRatio);
  const topAgents = sorted.slice(0, 3).map((d) => ({ name: d.agentName, value: `${d.lossRatio.toFixed(1)}%` }));
  const bottomAgents = sorted.slice(-3).reverse().map((d) => ({ name: d.agentName, value: `${d.lossRatio.toFixed(1)}%` }));

  const handleExport = () => {
    exportToCSV(data.map((d) => ({
      Agent: d.agentName, Primes: d.totalPremiums, Sinistres: d.totalClaims,
      "Nb Sinistres": d.claimCount, "Ratio (%)": d.lossRatio.toFixed(1),
    })), "sinistralite");
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sinistralité par Agent</h1>
          <p className="text-muted-foreground">Ratio sinistres / primes encaissées</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />CSV</Button>
          <PeriodFilter onPeriodChange={setDateRange} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Primes Totales</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatFCFA(totalPremiums)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Sinistres Totaux</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatFCFA(totalClaims)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ratio Global</CardTitle><Shield className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${globalRatio > THRESHOLD ? "text-destructive" : "text-primary"}`}>{globalRatio.toFixed(1)}%</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Agents &gt; {THRESHOLD}%</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{aboveThreshold}</div></CardContent></Card>
      </div>

      <TopBottomAgents metricLabel="Ratio sinistralité" topAgents={topAgents} bottomAgents={bottomAgents} title="Classement Agents (ratio le plus bas = meilleur)" />

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Ratio de sinistralité par agent</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" /><YAxis unit="%" />
                <Tooltip formatter={(value: number) => [`${value}%`, "Ratio"]} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""} />
                <Bar dataKey="ratio" radius={[4, 4, 0, 0]}>{chartData.map((entry, i) => (<Cell key={i} className={entry.ratio > THRESHOLD ? "fill-destructive" : "fill-primary"} />))}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead className="text-right">Primes</TableHead><TableHead className="text-right">Sinistres</TableHead><TableHead className="text-center">Nb Sinistres</TableHead><TableHead className="text-center">Ratio</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.map((a) => (
                <TableRow key={a.agentId}>
                  <TableCell className="font-medium">{a.agentName}</TableCell>
                  <TableCell className="text-right">{formatFCFA(a.totalPremiums)}</TableCell>
                  <TableCell className="text-right">{formatFCFA(a.totalClaims)}</TableCell>
                  <TableCell className="text-center">{a.claimCount}</TableCell>
                  <TableCell className="text-center"><Badge variant={a.lossRatio > THRESHOLD ? "destructive" : "secondary"}>{a.lossRatio.toFixed(1)}%</Badge></TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune donnée</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
