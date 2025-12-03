import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type LeadStatus = Tables<"leads">["status"];

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  nouveau: { 
    label: "Nouveau", 
    className: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100" 
  },
  en_cours: { 
    label: "En cours", 
    className: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100" 
  },
  relance: { 
    label: "Relance", 
    className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100" 
  },
  converti: { 
    label: "Converti", 
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
  },
  perdu: { 
    label: "Perdu", 
    className: "bg-rose-100 text-rose-600 border-rose-200 hover:bg-rose-100" 
  },
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export const LeadStatusBadge = ({ status, className }: LeadStatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`${config.className} ${className || ""}`}>
      {config.label}
    </Badge>
  );
};

export const getStatusLabel = (status: LeadStatus) => statusConfig[status].label;
export { statusConfig };
