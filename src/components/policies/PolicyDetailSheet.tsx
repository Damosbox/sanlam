import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, MessageCircle, Mail, User, FileText, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PolicyDocumentsDownload } from "./PolicyDocumentsDownload";

interface PolicyData {
  id: string;
  policy_number: string;
  monthly_premium: number;
  start_date: string;
  status: string;
  user_id: string;
  profiles: {
    display_name: string;
    email: string;
    phone?: string;
  } | null;
  products: {
    name: string;
  } | null;
}

interface PolicyDetailSheetProps {
  policy: PolicyData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PolicyDetailSheet = ({ policy, open, onOpenChange }: PolicyDetailSheetProps) => {
  if (!policy) return null;

  const clientName = policy.profiles?.display_name || "Client";
  const clientEmail = policy.profiles?.email || "";
  const clientPhone = policy.profiles?.phone || "";
  const initials = clientName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleCall = () => {
    if (clientPhone) {
      window.open(`tel:${clientPhone}`, "_self");
    }
  };

  const handleWhatsApp = () => {
    if (clientPhone) {
      const phone = clientPhone.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}`, "_blank");
    }
  };

  const handleEmail = () => {
    if (clientEmail) {
      window.open(`mailto:${clientEmail}`, "_self");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      active: { variant: "default", label: "Actif" },
      cancelled: { variant: "destructive", label: "Annulé" },
      expired: { variant: "secondary", label: "Expiré" },
    };
    const { variant, label } = config[status] || { variant: "secondary", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Police {policy.policy_number}
          </SheetTitle>
        </SheetHeader>

        {/* Client Info */}
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Client</span>
                </div>
                <h3 className="font-semibold text-lg">{clientName}</h3>
                {clientEmail && (
                  <p className="text-sm text-muted-foreground truncate">{clientEmail}</p>
                )}
                {clientPhone && (
                  <p className="text-sm text-muted-foreground">{clientPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Policy Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Détails de la police</span>
            </div>
            
            <div className="grid gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Produit</span>
                <span className="font-medium">{policy.products?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Prime mensuelle
                </span>
                <span className="font-medium">{policy.monthly_premium.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date de début
                </span>
                <span className="font-medium">
                  {format(new Date(policy.start_date), "dd MMMM yyyy", { locale: fr })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Statut</span>
                {getStatusBadge(policy.status)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Documents Section */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents de la police
            </h4>
            <PolicyDocumentsDownload
              subscriptionId={policy.id}
              policyNumber={policy.policy_number}
              clientEmail={clientEmail}
              clientPhone={clientPhone}
            />
          </div>

          <Separator />

          {/* Quick Actions */}
          <div>
            <h4 className="font-medium mb-3">Actions rapides</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCall}
                disabled={!clientPhone}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Appeler
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsApp}
                disabled={!clientPhone}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmail}
                disabled={!clientEmail}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
