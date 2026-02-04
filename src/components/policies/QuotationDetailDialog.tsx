import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatFCFA } from "@/utils/formatCurrency";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  FileText, 
  User, 
  Calendar, 
  CreditCard,
  Edit,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuotationDetails {
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
  coverage_details?: any;
  leads?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

interface QuotationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: QuotationDetails | null;
  onSubscribe?: () => void;
}

const productTypeLabels: Record<string, string> = {
  auto: "Assurance Auto",
  mrh: "Assurance Habitation",
  sante: "Assurance Santé",
  vie: "Assurance Vie",
  molo_molo: "Épargne Molo Molo",
  pack_obseques: "Pack Obsèques",
  assistance_voyage: "Assistance Voyage",
};

const frequencyLabels: Record<string, string> = {
  mensuel: "Mensuel",
  trimestriel: "Trimestriel",
  annuel: "Annuel",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_payment: { label: "En attente", variant: "secondary" },
  paid: { label: "Converti", variant: "default" },
  expired: { label: "Expiré", variant: "outline" },
  cancelled: { label: "Annulé", variant: "destructive" },
};

export const QuotationDetailDialog = ({
  open,
  onOpenChange,
  quotation,
  onSubscribe,
}: QuotationDetailDialogProps) => {
  const navigate = useNavigate();

  if (!quotation) return null;

  const status = statusConfig[quotation.payment_status] || statusConfig.pending_payment;
  const coverageDetails = quotation.coverage_details as any;
  const isExpired = quotation.valid_until && new Date(quotation.valid_until) < new Date();
  const isPaid = quotation.payment_status === "paid";

  const handleModify = () => {
    // Navigate to guided sales with pre-filled data
    const params = new URLSearchParams();
    if (quotation.lead_id) {
      params.set("contactId", quotation.lead_id);
      params.set("type", "prospect");
    }
    params.set("quotationId", quotation.id);
    params.set("product", quotation.product_type);
    
    navigate(`/b2b/sales?${params.toString()}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Détail de la Cotation
          </DialogTitle>
          <DialogDescription>
            Cotation créée le {format(new Date(quotation.created_at), "dd MMMM yyyy", { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Product */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{quotation.product_name}</p>
              <p className="text-sm text-muted-foreground">
                {productTypeLabels[quotation.product_type] || quotation.product_type}
              </p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <Separator />

          {/* Client Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Client / Prospect
            </div>
            {quotation.leads ? (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">
                  {quotation.leads.first_name} {quotation.leads.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {quotation.leads.email || quotation.leads.phone || "—"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Client non associé</p>
            )}
          </div>

          {/* Premium Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Prime
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-primary">
                  {formatFCFA(quotation.premium_amount)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {frequencyLabels[quotation.premium_frequency] || quotation.premium_frequency}
                </span>
              </div>
            </div>
          </div>

          {/* Validity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Validité
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date d'expiration</span>
              <span className={isExpired ? "text-destructive font-medium" : ""}>
                {quotation.valid_until
                  ? format(new Date(quotation.valid_until), "dd MMMM yyyy", { locale: fr })
                  : "Non définie"}
                {isExpired && " (Expirée)"}
              </span>
            </div>
          </div>

          {/* Coverage Details if available */}
          {coverageDetails && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Détails de la couverture</p>
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  {coverageDetails.formula && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Formule</span>
                      <span>{coverageDetails.formula}</span>
                    </div>
                  )}
                  {coverageDetails.duration && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durée</span>
                      <span>{coverageDetails.duration} an(s)</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Payment Link */}
          {quotation.payment_link && !isPaid && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 mb-2">Lien de paiement</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white px-2 py-1 rounded truncate">
                  {quotation.payment_link}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(quotation.payment_link!, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleModify}
              disabled={isPaid}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              className="flex-1"
              onClick={onSubscribe}
              disabled={isPaid || isExpired}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Souscrire
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
