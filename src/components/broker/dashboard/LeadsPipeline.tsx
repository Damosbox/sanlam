import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type LeadStatus = "nouveau" | "en_cours" | "relance" | "converti" | "perdu";

interface PipelineStats {
  nouveau: number;
  en_cours: number;
  relance: number;
  converti: number;
  perdu: number;
}

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  nouveau: { label: "Nouveau", color: "bg-primary" },
  en_cours: { label: "En cours", color: "bg-muted-foreground" },
  relance: { label: "Relance", color: "bg-warning" },
  converti: { label: "Converti", color: "bg-success" },
  perdu: { label: "Perdu", color: "bg-destructive/60" },
};

export const LeadsPipeline = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PipelineStats>({
    nouveau: 0,
    en_cours: 0,
    relance: 0,
    converti: 0,
    perdu: 0,
  });

  useEffect(() => {
    fetchPipelineStats();
  }, []);

  const fetchPipelineStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: leads } = await supabase
        .from("leads")
        .select("status")
        .eq("assigned_broker_id", user.id);

      if (leads) {
        const counts: PipelineStats = {
          nouveau: 0,
          en_cours: 0,
          relance: 0,
          converti: 0,
          perdu: 0,
        };

        leads.forEach((lead) => {
          const status = lead.status as LeadStatus;
          if (status in counts) {
            counts[status]++;
          }
        });

        setStats(counts);
      }
    } catch (error) {
      console.error("Error fetching pipeline stats:", error);
    }
  };

  const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;

  const handleStatusClick = (status: LeadStatus) => {
    navigate(`/b2b/leads?status=${status}`);
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Pipeline Leads</h3>
          <span className="text-xs text-muted-foreground">{total} total</span>
        </div>
        
        {/* Compact progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
          {(Object.keys(statusConfig) as LeadStatus[]).map((status) => {
            const width = (stats[status] / total) * 100;
            if (width === 0) return null;
            return (
              <div
                key={status}
                className={cn(statusConfig[status].color, "transition-all duration-500")}
                style={{ width: `${width}%` }}
              />
            );
          })}
        </div>

        {/* Status tabs */}
        <Tabs defaultValue="nouveau" className="w-full">
          <TabsList className="w-full h-8 bg-muted/50 p-0.5">
            {(Object.keys(statusConfig) as LeadStatus[]).map((status) => (
              <TabsTrigger
                key={status}
                value={status}
                onClick={() => handleStatusClick(status)}
                className={cn(
                  "flex-1 h-7 text-xs gap-1.5 data-[state=active]:shadow-sm",
                  "transition-all duration-200"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig[status].color)} />
                <span className="hidden sm:inline">{statusConfig[status].label}</span>
                <span className="font-semibold">{stats[status]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
};
