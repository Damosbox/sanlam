import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  Mail, 
  MessageCircle, 
  Phone,
  CheckCircle,
  XCircle,
  Send,
  Clock,
  AlertTriangle,
  FileText,
  Loader2,
  Eye,
  Edit,
  ShoppingCart
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { formatFCFA } from "@/utils/formatCurrency";
import { toast } from "sonner";
import { QuotationDetailDialog } from "./QuotationDetailDialog";

interface Quotation {
  id: string;
  lead_id: string | null;
  product_type: string;
  product_name: string;
  premium_amount: number;
  premium_frequency: string;
  payment_status: string;
  payment_link: string | null;
  valid_until: string | null;
  created_at: string;
  leads?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

const productTypeLabels: Record<string, string> = {
  auto: "Auto",
  mrh: "Habitation",
  sante: "Santé",
  vie: "Vie",
  molo_molo: "Molo Molo",
  pack_obseques: "Pack Obsèques",
  assistance_voyage: "Voyage",
};

const frequencyLabels: Record<string, string> = {
  mensuel: "/mois",
  trimestriel: "/trim.",
  annuel: "/an",
};

export const PendingQuotationsTable = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["pending-quotations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          leads (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq("broker_id", user.id)
        .eq("payment_status", "pending_payment")
        .order("valid_until", { ascending: true });

      if (error) throw error;
      return data as Quotation[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("quotations")
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-quotations"] });
      toast.success("Statut mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const filteredQuotations = quotations.filter((q) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${q.leads?.first_name || ""} ${q.leads?.last_name || ""}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      q.product_name.toLowerCase().includes(searchLower) ||
      q.product_type.toLowerCase().includes(searchLower)
    );
  });

  const getExpirationBadge = (validUntil: string | null, paymentStatus: string) => {
    // Show status-based badge first
    if (paymentStatus === "paid") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 gap-1 text-xs">
          <CheckCircle className="h-3 w-3" />
          Converti
        </Badge>
      );
    }
    
    if (paymentStatus === "cancelled") {
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <XCircle className="h-3 w-3" />
          Annulé
        </Badge>
      );
    }

    if (!validUntil) return null;
    
    const expirationDate = new Date(validUntil);
    const daysLeft = differenceInDays(expirationDate, new Date());
    
    if (isPast(expirationDate)) {
      return (
        <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
          <Clock className="h-3 w-3" />
          Expiré
        </Badge>
      );
    }
    
    if (daysLeft <= 2) {
      return (
        <Badge className="bg-red-100 text-red-700 gap-1 text-xs">
          <AlertTriangle className="h-3 w-3" />
          {daysLeft === 0 ? "Aujourd'hui" : `${daysLeft}j`}
        </Badge>
      );
    }
    
    if (daysLeft <= 7) {
      return (
        <Badge className="bg-amber-100 text-amber-700 gap-1 text-xs">
          <Clock className="h-3 w-3" />
          {daysLeft}j restants
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-blue-100 text-blue-700 gap-1 text-xs">
        <Clock className="h-3 w-3" />
        En cours
      </Badge>
    );
  };

  const handleViewDetail = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setDetailDialogOpen(true);
  };

  const handleModify = (quotation: Quotation) => {
    const params = new URLSearchParams();
    if (quotation.lead_id) {
      params.set("contactId", quotation.lead_id);
      params.set("type", "prospect");
    }
    params.set("quotationId", quotation.id);
    params.set("product", quotation.product_type);
    navigate(`/b2b/sales?${params.toString()}`);
  };

  const handleSubscribe = (quotation: Quotation) => {
    // Mark as paid and redirect to subscription completion
    updateStatusMutation.mutate({ id: quotation.id, status: "paid" });
    toast.success("Souscription finalisée");
  };

  const handleContact = (type: "phone" | "whatsapp" | "email", quotation: Quotation) => {
    const lead = quotation.leads;
    if (!lead) return;

    switch (type) {
      case "phone":
        if (lead.phone) window.open(`tel:${lead.phone}`, "_blank");
        break;
      case "whatsapp":
        if (lead.phone) {
          const cleanNumber = lead.phone.replace(/\D/g, "");
          const message = encodeURIComponent(
            `Bonjour ${lead.first_name}, votre cotation ${quotation.product_name} est toujours en attente. Souhaitez-vous finaliser votre souscription ?`
          );
          window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
        }
        break;
      case "email":
        if (lead.email) {
          const subject = encodeURIComponent(`Votre cotation ${quotation.product_name}`);
          const body = encodeURIComponent(
            `Bonjour ${lead.first_name},\n\nVotre cotation pour ${quotation.product_name} est toujours en attente.\n\nPrime: ${formatFCFA(quotation.premium_amount)}${frequencyLabels[quotation.premium_frequency] || ""}\n\nN'hésitez pas à me contacter pour finaliser votre souscription.`
          );
          window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, "_blank");
        }
        break;
    }
  };

  const handleResendLink = (quotation: Quotation) => {
    if (quotation.payment_link && quotation.leads?.phone) {
      const cleanNumber = quotation.leads.phone.replace(/\D/g, "");
      const message = encodeURIComponent(
        `Bonjour ${quotation.leads.first_name}, voici votre lien de paiement pour ${quotation.product_name}: ${quotation.payment_link}`
      );
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
      toast.success("Redirection vers WhatsApp...");
    } else {
      toast.error("Lien de paiement non disponible");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un prospect ou produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Prospect</TableHead>
              <TableHead className="min-w-[140px]">Produit</TableHead>
              <TableHead className="min-w-[120px]">Prime</TableHead>
              <TableHead className="min-w-[100px]">Cotation</TableHead>
              <TableHead className="min-w-[100px]">Expiration</TableHead>
              <TableHead className="min-w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune cotation en attente de paiement</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">
                        {quotation.leads 
                          ? `${quotation.leads.first_name} ${quotation.leads.last_name}`
                          : "Prospect inconnu"
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {quotation.leads?.email || quotation.leads?.phone || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{quotation.product_name}</div>
                      <Badge variant="outline" className="text-xs mt-0.5">
                        {productTypeLabels[quotation.product_type] || quotation.product_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">
                      {formatFCFA(quotation.premium_amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {frequencyLabels[quotation.premium_frequency] || quotation.premium_frequency}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(quotation.created_at), "dd MMM", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {getExpirationBadge(quotation.valid_until, quotation.payment_status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewDetail(quotation)}
                        title="Consulter"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleModify(quotation)}
                        disabled={quotation.payment_status === "paid"}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleViewDetail(quotation)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Consulter
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleModify(quotation)}
                            disabled={quotation.payment_status === "paid"}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleContact("phone", quotation)}
                            disabled={!quotation.leads?.phone}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Appeler
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleContact("whatsapp", quotation)}
                            disabled={!quotation.leads?.phone}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleContact("email", quotation)}
                            disabled={!quotation.leads?.email}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleResendLink(quotation)}
                            disabled={!quotation.payment_link}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Renvoyer le lien
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleSubscribe(quotation)}
                            disabled={quotation.payment_status === "paid"}
                            className="text-primary"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Souscrire
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              id: quotation.id, 
                              status: "paid" 
                            })}
                            disabled={quotation.payment_status === "paid"}
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                            Marquer payé
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              id: quotation.id, 
                              status: "cancelled" 
                            })}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Annuler
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {filteredQuotations.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>
            {filteredQuotations.length} cotation{filteredQuotations.length > 1 ? "s" : ""} en attente
          </span>
          <span className="font-medium">
            Total: {formatFCFA(filteredQuotations.reduce((sum, q) => sum + Number(q.premium_amount), 0))}
          </span>
        </div>
      )}

      <QuotationDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        quotation={selectedQuotation}
        onSubscribe={() => {
          if (selectedQuotation) {
            handleSubscribe(selectedQuotation);
            setDetailDialogOpen(false);
          }
        }}
      />
    </div>
  );
};
