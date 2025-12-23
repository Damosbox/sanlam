import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, MessageCircle, Mail, Send, User, Shield, StickyNote, UserPlus, Pencil, Database, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LeadStatusBadge, statusConfig } from "./LeadStatusBadge";
import { LeadKYCSection } from "./LeadKYCSection";
import { ConvertToClientSection } from "./ConvertToClientSection";
import { AdditionalDataSection } from "./AdditionalDataSection";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;
type LeadNote = Tables<"lead_notes">;

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (leadId: string, status: Lead["status"]) => void;
  onEditLead?: (lead: Lead) => void;
}

export const LeadDetailSheet = ({ 
  lead, 
  open, 
  onOpenChange, 
  onStatusChange,
  onEditLead
}: LeadDetailSheetProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [noteContent, setNoteContent] = useState("");

  const handleGuidedSales = () => {
    if (lead) {
      navigate(`/b2b/sales?contactId=${lead.id}&type=prospect`);
      onOpenChange(false);
    }
  };

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["lead-notes", lead?.id],
    queryFn: async () => {
      if (!lead?.id) return [];
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LeadNote[];
    },
    enabled: !!lead?.id,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !lead) throw new Error("Non authentifié");
      const { error } = await supabase.from("lead_notes").insert({
        lead_id: lead.id,
        broker_id: userData.user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notes", lead?.id] });
      setNoteContent("");
      toast({ title: "Note ajoutée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter la note", variant: "destructive" });
    },
  });

  const handleCall = () => {
    if (lead?.phone) window.open(`tel:${lead.phone}`, "_blank");
  };

  const handleWhatsApp = () => {
    const number = lead?.whatsapp || lead?.phone;
    if (number) {
      const cleanNumber = number.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  const handleEmail = () => {
    if (lead?.email) window.open(`mailto:${lead.email}`, "_blank");
  };

  if (!lead) return null;

  const initials = `${lead.first_name?.[0] || ""}${lead.last_name?.[0] || ""}`.toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b bg-slate-50/50">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <SheetTitle className="text-lg">
                {lead.first_name} {lead.last_name}
              </SheetTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {lead.product_interest && (
                  <span className="font-medium text-foreground">{lead.product_interest}</span>
                )}
                <span>•</span>
                <span>{format(new Date(lead.created_at), "dd MMM yyyy", { locale: fr })}</span>
              </div>
              <LeadStatusBadge status={lead.status} className="mt-1" />
            </div>
          </div>

          {/* Contact Line */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-4 flex-wrap">
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {lead.phone}
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {lead.email}
              </span>
            )}
            {lead.whatsapp && lead.whatsapp !== lead.phone && (
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {lead.whatsapp}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={handleCall} disabled={!lead.phone}>
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleWhatsApp} 
              disabled={!lead.whatsapp && !lead.phone}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleEmail} disabled={!lead.email}>
              <Mail className="h-4 w-4" />
            </Button>
            {onEditLead && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditLead(lead)}
                className="gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={handleGuidedSales}
              className="ml-auto gap-1.5"
            >
              <ShoppingCart className="h-4 w-4" />
              Vente Guidée
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="mx-6 mt-2 grid w-auto grid-cols-4 shrink-0">
            <TabsTrigger value="info" className="gap-1.5 text-xs">
              <StickyNote className="h-3.5 w-3.5" />
              Infos
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5 text-xs">
              <Database className="h-3.5 w-3.5" />
              Données
            </TabsTrigger>
            <TabsTrigger value="kyc" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              KYC
            </TabsTrigger>
            <TabsTrigger value="convert" className="gap-1.5 text-xs">
              <UserPlus className="h-3.5 w-3.5" />
              Convertir
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0">
            <TabsContent value="info" className="mt-0 p-6 space-y-4">
              {/* Notes complémentaires */}
              {lead.notes && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Données complémentaires</p>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                </div>
              )}

              {lead.notes && <Separator />}

              {/* Status Selector */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Changer le statut</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(statusConfig) as Lead["status"][]).map((status) => (
                    <Button
                      key={status}
                      variant={lead.status === status ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onStatusChange(lead.id, status)}
                    >
                      {statusConfig[status].label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notes Section */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Notes & Timeline</p>
                
                {/* Add Note */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ajouter une note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                  <Button 
                    size="icon" 
                    onClick={() => noteContent.trim() && addNoteMutation.mutate(noteContent)}
                    disabled={!noteContent.trim() || addNoteMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                  {notesLoading ? (
                    <div className="text-sm text-muted-foreground text-center py-4">Chargement...</div>
                  ) : notes?.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Aucune note pour ce prospect
                    </div>
                  ) : (
                    notes?.map((note) => (
                      <div 
                        key={note.id} 
                        className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1"
                      >
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-0 p-6">
              <AdditionalDataSection leadId={lead.id} />
            </TabsContent>

            <TabsContent value="kyc" className="mt-0 p-6">
              <LeadKYCSection leadId={lead.id} />
            </TabsContent>

            <TabsContent value="convert" className="mt-0 p-6">
              <ConvertToClientSection 
                lead={lead} 
                onConverted={() => onOpenChange(false)} 
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
