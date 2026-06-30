import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Loader2 } from "lucide-react";
import { PeriodFilter, computeDateRange, DateRange } from "@/components/broker/dashboard/PeriodFilter";
import { AgentOverviewTab } from "@/components/admin/agent-detail/AgentOverviewTab";
import { AgentLeadsTab } from "@/components/admin/agent-detail/AgentLeadsTab";
import { AgentPortfolioTab } from "@/components/admin/agent-detail/AgentPortfolioTab";
import { AgentQuotationsTab } from "@/components/admin/agent-detail/AgentQuotationsTab";
import { AgentCommissionsTab } from "@/components/admin/agent-detail/AgentCommissionsTab";
import { AgentActivityTab } from "@/components/admin/agent-detail/AgentActivityTab";

const PARTNER_TYPE_LABELS: Record<string, string> = {
  courtier: "Courtier", agent_general: "Agent Général", agent_mandataire: "Agent Mandataire",
  agent_sanlam: "Agent Sanlam Allianz", banquier: "Banquier",
};

interface AgentProfile {
  id: string; email: string | null; first_name: string | null; last_name: string | null; phone: string | null; partner_type: string | null;
}

export default function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(computeDateRange("fiscal_year"));

  useEffect(() => {
    if (!agentId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("profiles").select("id, email, first_name, last_name, phone, partner_type").eq("id", agentId).maybeSingle();
      setProfile(data as AgentProfile);
      setLoading(false);
    })();
  }, [agentId]);

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile || !agentId) return <div className="p-6"><p className="text-muted-foreground">Agent introuvable</p></div>;

  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "?";
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Agent";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/agents-portfolio")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{fullName}</h1>
                {profile.partner_type && (
                  <Badge variant="outline">{PARTNER_TYPE_LABELS[profile.partner_type] || profile.partner_type}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                {profile.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{profile.email}</span>}
                {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{profile.phone}</span>}
              </div>
            </div>
          </div>
          <PeriodFilter onPeriodChange={setDateRange} />
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="leads">Prospects</TabsTrigger>
          <TabsTrigger value="portfolio">Portefeuille</TabsTrigger>
          <TabsTrigger value="quotations">Cotations</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AgentOverviewTab agentId={agentId} dateRange={dateRange} />
        </TabsContent>
        <TabsContent value="leads" className="mt-6">
          <AgentLeadsTab agentId={agentId} />
        </TabsContent>
        <TabsContent value="portfolio" className="mt-6">
          <AgentPortfolioTab agentId={agentId} />
        </TabsContent>
        <TabsContent value="quotations" className="mt-6">
          <AgentQuotationsTab agentId={agentId} />
        </TabsContent>
        <TabsContent value="commissions" className="mt-6">
          <AgentCommissionsTab agentId={agentId} />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <AgentActivityTab agentId={agentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}