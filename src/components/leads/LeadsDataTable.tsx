import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, MessageCircle, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LeadStatusBadge } from "./LeadStatusBadge";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

interface LeadsDataTableProps {
  leads: Lead[];
  density: "compact" | "standard" | "card";
  onSelectLead: (lead: Lead) => void;
}

export const LeadsDataTable = ({ leads, density, onSelectLead }: LeadsDataTableProps) => {
  const navigate = useNavigate();
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

  const rowPadding = density === "compact" ? "py-2" : density === "standard" ? "py-3" : "py-4";
  const avatarSize = density === "compact" ? "h-8 w-8" : "h-10 w-10";
  const textSize = density === "compact" ? "text-xs" : "text-sm";

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun lead trouvé
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
            <TableHead className="w-[200px]">Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="hidden md:table-cell">Type client</TableHead>
            <TableHead className="hidden lg:table-cell">Nbre de contrats</TableHead>
            <TableHead className="hidden lg:table-cell">Nbre de cotations</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const initials = `${lead.first_name?.[0] || ""}${lead.last_name?.[0] || ""}`.toUpperCase();
            
            return (
              <TableRow 
                key={lead.id} 
                className={`cursor-pointer hover:bg-slate-50 transition-colors duration-200 ${rowPadding}`}
                onClick={() => onSelectLead(lead)}
              >
                <TableCell className={rowPadding}>
                  <div className="flex items-center gap-3">
                    <Avatar className={avatarSize}>
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <button
                        className={`font-medium ${textSize} text-left hover:text-primary hover:underline transition-colors`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                      >
                        {lead.first_name} {lead.last_name}
                      </button>
                      {lead.product_interest && (
                        <p className="text-xs text-muted-foreground">{lead.product_interest}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className={`${rowPadding} ${textSize}`}>
                  <div className="space-y-0.5">
                    <p>{lead.phone || "—"}</p>
                    <p className="text-xs text-muted-foreground">{lead.email || ""}</p>
                  </div>
                </TableCell>
                <TableCell className={`hidden md:table-cell ${rowPadding} ${textSize}`}>
                  {lead.source || "Prospect"}
                </TableCell>
                <TableCell className={`hidden lg:table-cell ${rowPadding} ${textSize} text-center`}>
                  <button
                    className="text-primary hover:underline font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/b2b/policies?prospectId=${lead.id}`);
                    }}
                  >
                    0
                  </button>
                </TableCell>
                <TableCell className={`hidden lg:table-cell ${rowPadding} ${textSize} text-center`}>
                  <button
                    className="text-primary hover:underline font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/b2b/sales?prospectId=${lead.id}`);
                    }}
                  >
                    0
                  </button>
                </TableCell>
                <TableCell className={rowPadding}>
                  <LeadStatusBadge status={lead.status} />
                </TableCell>
                <TableCell className={`${rowPadding} text-right`}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleCall(e, lead.phone)}
                      disabled={!lead.phone}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={(e) => handleWhatsApp(e, lead)}
                      disabled={!lead.whatsapp && !lead.phone}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
