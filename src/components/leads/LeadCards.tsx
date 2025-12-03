import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, MessageCircle, FileText, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LeadStatusBadge } from "./LeadStatusBadge";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

interface LeadCardsProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onQuickQuote: (lead: Lead) => void;
}

export const LeadCards = ({ leads, onSelectLead, onQuickQuote }: LeadCardsProps) => {
  const handleCall = (e: React.MouseEvent, phone: string | null) => {
    e.stopPropagation();
    if (phone) window.open(`tel:${phone}`, "_blank");
  };

  const handleWhatsApp = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const number = lead.whatsapp || lead.phone;
    if (number) {
      const cleanNumber = number.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun lead trouvé
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => {
        const initials = `${lead.first_name?.[0] || ""}${lead.last_name?.[0] || ""}`.toUpperCase();
        
        return (
          <Card 
            key={lead.id} 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20"
            onClick={() => onSelectLead(lead)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.email || lead.phone || "Pas de contact"}
                    </p>
                  </div>
                </div>
                <LeadStatusBadge status={lead.status} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {lead.product_interest && (
                  <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                    {lead.product_interest}
                  </span>
                )}
                {lead.source && (
                  <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                    {lead.source}
                  </span>
                )}
              </div>

              {lead.next_followup_at && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                  <Clock className="h-3 w-3" />
                  Relance: {format(new Date(lead.next_followup_at), "dd MMM", { locale: fr })}
                </div>
              )}

              <div className="mt-4 pt-3 border-t flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={(e) => handleCall(e, lead.phone)}
                  disabled={!lead.phone}
                >
                  <Phone className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={(e) => handleWhatsApp(e, lead)}
                  disabled={!lead.whatsapp && !lead.phone}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  className="ml-auto h-8 gap-1.5 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickQuote(lead);
                  }}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Devis
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
