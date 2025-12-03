import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type LeadStatus = "nouveau" | "en_cours" | "relance" | "converti" | "perdu";

interface PipelineStats {
  nouveau: number;
  en_cours: number;
  relance: number;
  converti: number;
  perdu: number;
}

const statusConfig: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  nouveau: { label: "Nouveau", color: "text-blue-600", bgColor: "bg-blue-500" },
  en_cours: { label: "En cours", color: "text-amber-600", bgColor: "bg-amber-500" },
  relance: { label: "Relance", color: "text-orange-600", bgColor: "bg-orange-500" },
  converti: { label: "Converti", color: "text-green-600", bgColor: "bg-green-500" },
  perdu: { label: "Perdu", color: "text-red-600", bgColor: "bg-red-500" },
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
  const [activeStatus, setActiveStatus] = useState<LeadStatus | null>(null);

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

  const handleClick = (status: LeadStatus) => {
    setActiveStatus(status);
    navigate(`/b2b/leads?status=${status}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Pipeline des Leads</h2>
      
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        {/* Progress bar */}
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          {(Object.keys(statusConfig) as LeadStatus[]).map((status) => {
            const width = (stats[status] / total) * 100;
            if (width === 0) return null;
            return (
              <div
                key={status}
                className={cn(statusConfig[status].bgColor, "transition-all duration-500")}
                style={{ width: `${width}%` }}
              />
            );
          })}
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(statusConfig) as LeadStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => handleClick(status)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200",
                "hover:shadow-md hover:scale-[1.02]",
                activeStatus === status
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-muted/50"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", statusConfig[status].bgColor)} />
              <span className="text-sm font-medium">{statusConfig[status].label}</span>
              <span className={cn(
                "text-sm font-bold px-2 py-0.5 rounded-full",
                statusConfig[status].bgColor + "/10",
                statusConfig[status].color
              )}>
                {stats[status]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
