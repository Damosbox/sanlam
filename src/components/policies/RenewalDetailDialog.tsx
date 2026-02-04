import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatFCFA } from "@/utils/formatCurrency";
import { 
  CreditCard, 
  Smartphone, 
  Copy, 
  Check, 
  Send, 
  Loader2,
  ArrowRight,
  Calendar,
  FileText,
  Download
} from "lucide-react";
import { format, addYears } from "date-fns";
import { fr } from "date-fns/locale";

interface RenewalSubscription {
  id: string;
  policy_number: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  product_name: string;
  current_premium: number;
  end_date: string;
}

interface RenewalDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: RenewalSubscription | null;
}

const paymentMethods = [
  { 
    id: "wave", 
    name: "Wave", 
    icon: Smartphone, 
    color: "bg-blue-500",
    description: "Paiement mobile Wave"
  },
  { 
    id: "orange_money", 
    name: "Orange Money", 
    icon: Smartphone, 
    color: "bg-orange-500",
    description: "Paiement mobile Orange"
  },
  { 
    id: "mtn_momo", 
    name: "MTN MoMo", 
    icon: Smartphone, 
    color: "bg-yellow-500",
    description: "Paiement mobile MTN"
  },
  { 
    id: "card", 
    name: "Carte Bancaire", 
    icon: CreditCard, 
    color: "bg-slate-700",
    description: "Visa / Mastercard"
  },
];

const deliveryChannels = [
  { id: "whatsapp", name: "WhatsApp" },
  { id: "sms", name: "SMS" },
  { id: "email", name: "Email" },
];

export const RenewalDetailDialog = ({
  open,
  onOpenChange,
  subscription,
}: RenewalDetailDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState("wave");
  const [selectedChannel, setSelectedChannel] = useState("whatsapp");
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [paymentSent, setPaymentSent] = useState(false);

  // Calculate new premium (example: +3% increase)
  const newPremium = subscription 
    ? Math.round(subscription.current_premium * 1.03) 
    : 0;
  
  const newEndDate = subscription 
    ? addYears(new Date(subscription.end_date), 1) 
    : new Date();

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) throw new Error("Aucune police sélectionnée");

      // Generate mock payment link
      const mockLink = `https://pay.sanlam.cm/renew/${subscription.id}?amount=${newPremium}&method=${selectedPayment}`;
      
      // Update quotation or create renewal record
      const { error } = await supabase
        .from("subscriptions")
        .update({
          renewal_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (error) throw error;

      return mockLink;
    },
    onSuccess: (link) => {
      setPaymentLink(link);
      toast.success("Lien de paiement généré");
    },
    onError: () => {
      toast.error("Erreur lors de la génération du lien");
    },
  });

  const sendLinkMutation = useMutation({
    mutationFn: async () => {
      if (!subscription || !paymentLink) return;

      // Simulate sending link via selected channel
      const message = encodeURIComponent(
        `Bonjour ${subscription.client_name}, votre renouvellement ${subscription.product_name} est prêt. Nouvelle prime: ${formatFCFA(newPremium)}/an. Lien de paiement: ${paymentLink}`
      );

      switch (selectedChannel) {
        case "whatsapp":
          if (subscription.client_phone) {
            const cleanNumber = subscription.client_phone.replace(/\D/g, "");
            window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
          }
          break;
        case "email":
          if (subscription.client_email) {
            window.open(
              `mailto:${subscription.client_email}?subject=Renouvellement ${subscription.product_name}&body=${message}`,
              "_blank"
            );
          }
          break;
        case "sms":
          if (subscription.client_phone) {
            window.open(`sms:${subscription.client_phone}?body=${message}`, "_blank");
          }
          break;
      }

      return true;
    },
    onSuccess: () => {
      setPaymentSent(true);
      queryClient.invalidateQueries({ queryKey: ["broker-renewals"] });
      toast.success("Lien envoyé au client");
    },
  });

  const copyLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast.success("Lien copié");
    }
  };

  const handleClose = () => {
    setPaymentLink(null);
    setLinkCopied(false);
    setPaymentSent(false);
    setSelectedPayment("wave");
    setSelectedChannel("whatsapp");
    onOpenChange(false);
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Renouvellement de Police
          </DialogTitle>
          <DialogDescription>
            Générez un lien de paiement pour le renouvellement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Policy Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{subscription.client_name}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.policy_number}
                </p>
              </div>
              <Badge variant="outline">{subscription.product_name}</Badge>
            </div>

            <Separator />

            {/* Premium Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Prime actuelle</p>
                <p className="font-medium">{formatFCFA(subscription.current_premium)}/an</p>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nouvelle prime</p>
                  <p className="font-medium text-primary">{formatFCFA(newPremium)}/an</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nouvelle échéance</span>
              <span className="font-medium">
                {format(newEndDate, "dd MMMM yyyy", { locale: fr })}
              </span>
            </div>
          </div>

          {!paymentLink ? (
            <>
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>Mode de paiement</Label>
                <RadioGroup
                  value={selectedPayment}
                  onValueChange={setSelectedPayment}
                  className="grid grid-cols-2 gap-2"
                >
                  {paymentMethods.map((method) => (
                    <Label
                      key={method.id}
                      htmlFor={method.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPayment === method.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                      <div className={`p-1.5 rounded ${method.color}`}>
                        <method.icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Delivery Channel Selection */}
              <div className="space-y-3">
                <Label>Canal d'envoi</Label>
                <RadioGroup
                  value={selectedChannel}
                  onValueChange={setSelectedChannel}
                  className="flex gap-2"
                >
                  {deliveryChannels.map((channel) => (
                    <Label
                      key={channel.id}
                      htmlFor={`channel-${channel.id}`}
                      className={`flex-1 flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors ${
                        selectedChannel === channel.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={channel.id}
                        id={`channel-${channel.id}`}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{channel.name}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <Button
                className="w-full"
                onClick={() => generateLinkMutation.mutate()}
                disabled={generateLinkMutation.isPending}
              >
                {generateLinkMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  "Générer le lien de paiement"
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Payment Link Generated */}
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Lien généré avec succès</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded text-xs break-all">
                      {paymentLink}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyLink}>
                      {linkCopied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {!paymentSent ? (
                  <Button
                    className="w-full"
                    onClick={() => sendLinkMutation.mutate()}
                    disabled={sendLinkMutation.isPending}
                  >
                    {sendLinkMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer via {deliveryChannels.find(c => c.id === selectedChannel)?.name}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-blue-700">
                        Lien envoyé au client. En attente de paiement.
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" disabled>
                        <FileText className="h-4 w-4 mr-2" />
                        Avenant (après paiement)
                      </Button>
                      <Button variant="outline" className="flex-1" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        Attestation (après paiement)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
