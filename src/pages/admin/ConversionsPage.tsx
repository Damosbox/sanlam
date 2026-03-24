import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, UserCheck, ArrowRight } from "lucide-react";
import { PeriodFilter, computeDateRange, DateRange } from "@/components/broker/dashboard/PeriodFilter";
import { Progress } from "@/components/ui/progress";

interface ConversionData {
  agentId: string;
  agentName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  byProduct: Record<string, { total: number; converted: number }>;
}

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  qualifie: "Qualifié",
  proposition: "Proposition",
  negoce: "Négocié",
  converti: "Converti",
  perdu: "Perdu",
};

export default function ConversionsPage() {
  const [data, setData] = useState<ConversionData[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(computeDateRange("fiscal_year"));

  useEffect(() => {
    fetchConversions();
  }, [dateRange]);

  const fetchConversions = async () => {
    setLoading(true);
    try {
      // Get all leads in the period
      const { data: leads } = await supabase
        .from("leads")
        .select("id, status, assigned_broker_id, product_interest, created_at")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      setAllLeads(leads || []);

      // Get broker profiles
      const brokerIds = [...new Set((leads || []).map((l) => l.assigned_broker_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", brokerIds.length > 0 ? brokerIds : ["00000000-0000-0000-0000-000000000000"]);

      const profileMap = new Map((profiles || []).map((p) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`]));

      // Group by agent
      const agentMap = new Map<string, ConversionData>();
      for (const lead of leads || []) {
        const agentId = lead.assigned_broker_id || "unassigned";
        if (!agentMap.has(agentId)) {
          agentMap.set(agentId, {
            agentId,
            agentName: profileMap.get(agentId) || "Non assigné",
            totalLeads: 0,
            convertedLeads: 0,
            conversionRate: 0,
            byProduct: {},
          });
        }
        const agent = agentMap.get(agentId)!;
        agent.totalLeads++;
        if (lead.status === "converti") agent.convertedLeads++;

        const product = lead.product_interest || "Autre";
        if (!agent.byProduct[product]) agent.byProduct[product] = { total: 0, converted: 0 };
        agent.byProduct[product].total++;
        if (lead.status === "converti") agent.byProduct[product].converted++;
      }

      // Calculate conversion rates
      for (const agent of agentMap.values()) {
        agent.conversionRate = agent.totalLeads > 0 ? (agent.convertedLeads / agent.totalLeads) * 100 : 0;
      }

      setData(Array.from(agentMap.values()).sort((a, b) => b.conversionRate - a.conversionRate));
    } catch (error) {
      console.error("Error fetching conversions:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalLeads = allLeads.length;
  const convertedLeads = allLeads.filter((l) => l.status === "converti").length;
  const globalRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  // Status distribution
  const statusCounts = allLeads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
          <h1 className="text-2xl font-bold">Conversions Prospect → Client</h1>
          <p className="text-muted-foreground">Suivi des taux de conversion par agent et par produit</p>
        </div>
        <PeriodFilter onPeriodChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertis</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertedLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Global</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalRate.toFixed(1)}%</div>
            <Progress value={globalRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {Object.entries(statusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {STATUS_LABELS[status] || status}: {count as number}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Table by Agent */}
      <Card>
        <CardHeader>
          <CardTitle>Conversions par Agent</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="text-center">Prospects</TableHead>
                <TableHead className="text-center">Convertis</TableHead>
                <TableHead className="text-center">Taux</TableHead>
                <TableHead>Progression</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((agent) => (
                <TableRow key={agent.agentId}>
                  <TableCell className="font-medium">{agent.agentName}</TableCell>
                  <TableCell className="text-center">{agent.totalLeads}</TableCell>
                  <TableCell className="text-center">{agent.convertedLeads}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {agent.conversionRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="w-40">
                    <Progress value={agent.conversionRate} />
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune donnée sur cette période
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
