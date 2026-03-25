import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Target, TrendingUp, Download } from "lucide-react";
import { PeriodFilter, computeDateRange, DateRange } from "@/components/broker/dashboard/PeriodFilter";
import { Progress } from "@/components/ui/progress";
import { formatFCFA } from "@/utils/formatCurrency";
import { TopBottomAgents } from "@/components/admin/TopBottomAgents";
import { exportToCSV } from "@/utils/exportCsv";

interface AgentPerf {
  agentId: string;
  agentName: string;
  targetPremium: number;
  realizedPremium: number;
  targetConversions: number;
  realizedConversions: number;
  commissionEstimated: number;
}

const COMMISSION_RATE = 0.10;

export default function AgentPerformancePage() {
  const [data, setData] = useState<AgentPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(computeDateRange("fiscal_year"));

  useEffect(() => { fetchData(); }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: targets } = await supabase.from("agent_targets").select("*")
        .lte("period_start", dateRange.to.toISOString()).gte("period_end", dateRange.from.toISOString());

      const { data: brokerRoles } = await supabase.from("user_roles").select("user_id").eq("role", "broker");
      const brokerIds = (brokerRoles || []).map((r) => r.user_id);
      if (brokerIds.length === 0) { setData([]); setLoading(false); return; }

      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", brokerIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`]));

      const { data: subs } = await supabase.from("subscriptions").select("assigned_broker_id, monthly_premium")
        .eq("status", "active").gte("start_date", dateRange.from.toISOString()).lte("start_date", dateRange.to.toISOString());

      const { data: leads } = await supabase.from("leads").select("assigned_broker_id, status")
        .eq("status", "converti").gte("created_at", dateRange.from.toISOString()).lte("created_at", dateRange.to.toISOString());

      const targetMap = new Map<string, { premium: number; conversions: number }>();
      for (const t of targets || []) {
        const cur = targetMap.get(t.agent_id) || { premium: 0, conversions: 0 };
        cur.premium += Number(t.target_premium) || 0;
        cur.conversions += Number(t.target_conversions) || 0;
        targetMap.set(t.agent_id, cur);
      }

      const realizedPremium = new Map<string, number>();
      for (const s of subs || []) {
        if (!s.assigned_broker_id) continue;
        realizedPremium.set(s.assigned_broker_id, (realizedPremium.get(s.assigned_broker_id) || 0) + (Number(s.monthly_premium) || 0));
      }

      const realizedConv = new Map<string, number>();
      for (const l of leads || []) {
        if (!l.assigned_broker_id) continue;
        realizedConv.set(l.assigned_broker_id, (realizedConv.get(l.assigned_broker_id) || 0) + 1);
      }

      const result: AgentPerf[] = brokerIds.map((id) => {
        const rp = realizedPremium.get(id) || 0;
        return {
          agentId: id, agentName: profileMap.get(id) || "—",
          targetPremium: targetMap.get(id)?.premium || 0, realizedPremium: rp,
          targetConversions: targetMap.get(id)?.conversions || 0, realizedConversions: realizedConv.get(id) || 0,
          commissionEstimated: rp * COMMISSION_RATE,
        };
      });

      setData(result.sort((a, b) => {
        const rateA = a.targetPremium > 0 ? a.realizedPremium / a.targetPremium : 0;
        const rateB = b.targetPremium > 0 ? b.realizedPremium / b.targetPremium : 0;
        return rateB - rateA;
      }));
    } catch (error) {
      console.error("Error fetching performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalTarget = data.reduce((s, d) => s + d.targetPremium, 0);
  const totalRealized = data.reduce((s, d) => s + d.realizedPremium, 0);
  const totalCommissions = data.reduce((s, d) => s + d.commissionEstimated, 0);
  const globalRate = totalTarget > 0 ? (totalRealized / totalTarget) * 100 : 0;

  const withTarget = data.filter((d) => d.targetPremium > 0);
  const topAgents = withTarget.slice(0, 3).map((d) => ({
    name: d.agentName,
    value: `${(d.targetPremium > 0 ? (d.realizedPremium / d.targetPremium) * 100 : 0).toFixed(0)}%`,
  }));
  const bottomAgents = withTarget.slice(-3).reverse().map((d) => ({
    name: d.agentName,
    value: `${(d.targetPremium > 0 ? (d.realizedPremium / d.targetPremium) * 100 : 0).toFixed(0)}%`,
  }));

  const handleExport = () => {
    exportToCSV(data.map((d) => ({
      Agent: d.agentName, "Objectif CA": d.targetPremium, "CA Réalisé": d.realizedPremium,
      "% CA": d.targetPremium > 0 ? ((d.realizedPremium / d.targetPremium) * 100).toFixed(1) : "0",
      "Obj. Conv.": d.targetConversions, "Conv. Réal.": d.realizedConversions,
      "Commission estimée": d.commissionEstimated.toFixed(0),
    })), "performance-agents");
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Agents</h1>
          <p className="text-muted-foreground">Objectifs vs réalisé par agent</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />CSV</Button>
          <PeriodFilter onPeriodChange={setDateRange} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Objectif CA Global</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatFCFA(totalTarget)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">CA Réalisé</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatFCFA(totalRealized)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taux d'atteinte</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{globalRate.toFixed(1)}%</div><Progress value={Math.min(globalRate, 100)} className="mt-2" /></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Commissions estimées</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatFCFA(totalCommissions)}</div><p className="text-xs text-muted-foreground">Taux : {(COMMISSION_RATE * 100).toFixed(0)}%</p></CardContent></Card>
      </div>

      <TopBottomAgents metricLabel="Taux d'atteinte CA" topAgents={topAgents} bottomAgents={bottomAgents} />

      <Card>
        <CardHeader><CardTitle>Détail par Agent</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Objectif CA</TableHead>
                <TableHead className="text-right">CA Réalisé</TableHead>
                <TableHead className="text-center">% CA</TableHead>
                <TableHead className="text-center">Obj. Conv.</TableHead>
                <TableHead className="text-center">Conv. Réal.</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Progression</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a) => {
                const caRate = a.targetPremium > 0 ? (a.realizedPremium / a.targetPremium) * 100 : 0;
                return (
                  <TableRow key={a.agentId}>
                    <TableCell className="font-medium">{a.agentName}</TableCell>
                    <TableCell className="text-right">{formatFCFA(a.targetPremium)}</TableCell>
                    <TableCell className="text-right">{formatFCFA(a.realizedPremium)}</TableCell>
                    <TableCell className="text-center"><Badge variant={caRate >= 100 ? "default" : caRate >= 70 ? "secondary" : "destructive"}>{caRate.toFixed(0)}%</Badge></TableCell>
                    <TableCell className="text-center">{a.targetConversions}</TableCell>
                    <TableCell className="text-center">{a.realizedConversions}</TableCell>
                    <TableCell className="text-right">{formatFCFA(a.commissionEstimated)}</TableCell>
                    <TableCell className="w-32"><Progress value={Math.min(caRate, 100)} /></TableCell>
                  </TableRow>
                );
              })}
              {data.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun agent trouvé</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
