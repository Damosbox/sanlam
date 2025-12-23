import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Mail, MessageSquare, Smartphone, PenTool, FileText, CreditCard, Phone, Wallet, Send, Copy, Check } from "lucide-react";
import { GuidedSalesState } from "../types";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import { useState } from "react";
import { toast } from "sonner";

interface BindingStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["binding"]>) => void;
  onNext: () => void;
}

const signatureChannels = [{
  id: "email",
  label: "Email",
  icon: Mail,
  description: "Envoi du contrat par email"
}, {
  id: "sms",
  label: "SMS",
  icon: MessageSquare,
  description: "Lien de signature par SMS"
}, {
  id: "whatsapp",
  label: "WhatsApp",
  icon: Smartphone,
  description: "Partage via WhatsApp"
}, {
  id: "presential",
  label: "Signature Présentielle",
  icon: PenTool,
  description: "Signature sur tablette agent"
}];

const paymentMethods = [{
  id: "card",
  label: "Carte Bancaire",
  icon: CreditCard,
  color: "bg-blue-500",
  description: "Visa, Mastercard"
}, {
  id: "wave",
  label: "Wave",
  icon: Wallet,
  color: "bg-[#1DC8F2]",
  description: "Paiement Wave"
}, {
  id: "orange_money",
  label: "Orange Money",
  icon: Phone,
  color: "bg-orange-500",
  description: "Paiement Orange Money"
}, {
  id: "mtn_momo",
  label: "MTN MoMo",
  icon: Phone,
  color: "bg-yellow-500",
  description: "MTN Mobile Money"
}];

export const BindingStep = ({
  state,
  onUpdate,
  onNext
}: BindingStepProps) => {
  const { binding } = state;
  const [selectedPayment, setSelectedPayment] = useState<string>("wave");
  const [clientPhone, setClientPhone] = useState(state.clientIdentification?.phone || "");
  const [clientEmail, setClientEmail] = useState(state.clientIdentification?.email || "");
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate payment link (mock)
  const paymentLink = `https://pay.sanlam.sn/q/${Date.now().toString(36)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    setLinkCopied(true);
    toast.success("Lien copié dans le presse-papier");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSendPaymentLink = () => {
    const channel = binding.signatureChannel;
    if (channel === "email" && clientEmail) {
      toast.success(`Lien de paiement envoyé par email à ${clientEmail}`);
    } else if (channel === "sms" && clientPhone) {
      toast.success(`Lien de paiement envoyé par SMS au ${clientPhone}`);
    } else if (channel === "whatsapp" && clientPhone) {
      window.open(`https://wa.me/${clientPhone.replace(/\s/g, "")}?text=${encodeURIComponent(`Bonjour, voici votre lien de paiement pour votre assurance: ${paymentLink}`)}`, "_blank");
      toast.success("Redirection vers WhatsApp...");
    } else if (channel === "presential") {
      toast.success("Mode paiement en présence activé");
    } else {
      toast.error("Veuillez renseigner les coordonnées du client");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Finaliser la cotation</h1>
        <p className="text-muted-foreground mt-1">
          Sélectionnez le mode de paiement et envoyez le lien au client.
        </p>
      </div>

      {/* Recap Card */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Récapitulatif du contrat</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produit</span>
              <span className="font-medium">Assurance Auto - {state.coverage?.planTier || "Standard"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Garanties</span>
              <span className="font-medium">RC + Défense + Vol & Incendie</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Options</span>
              <span className="font-medium">Bris de glace, Assistance 0km</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-medium">Prime totale à payer</span>
              <span className="font-bold text-primary">{formatFCFA(state.calculatedPremium.total)}/an</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Mode de paiement</h3>
          
          <RadioGroup 
            value={selectedPayment} 
            onValueChange={setSelectedPayment} 
            className="grid grid-cols-2 gap-3"
          >
            {paymentMethods.map(method => (
              <div key={method.id}>
                <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="peer sr-only" />
                <Label 
                  htmlFor={`payment-${method.id}`} 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    "hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white", method.color)}>
                    <method.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{method.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{method.description}</p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Signature Channel Selection */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Envoyer au client via</h3>
          
          <RadioGroup 
            value={binding.signatureChannel} 
            onValueChange={v => onUpdate({ signatureChannel: v as any })} 
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {signatureChannels.map(channel => (
              <div key={channel.id}>
                <RadioGroupItem value={channel.id} id={channel.id} className="peer sr-only" />
                <Label 
                  htmlFor={channel.id} 
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-center",
                    "hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    binding.signatureChannel === channel.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    <channel.icon className="h-5 w-5" />
                  </div>
                  <p className="font-medium text-sm">{channel.label}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Contact fields based on selected channel */}
          <div className="mt-4 space-y-3">
            {(binding.signatureChannel === "sms" || binding.signatureChannel === "whatsapp") && (
              <div>
                <Label htmlFor="client-phone" className="text-sm">Téléphone du client</Label>
                <Input
                  id="client-phone"
                  type="tel"
                  placeholder="+221 77 123 45 67"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            {binding.signatureChannel === "email" && (
              <div>
                <Label htmlFor="client-email" className="text-sm">Email du client</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="client@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Payment Link */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Lien de paiement</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background p-2 rounded border truncate">
                {paymentLink}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Documents */}
          <Separator className="my-6" />
          <h4 className="font-medium mb-3">Documents à envoyer</h4>
          <div className="flex flex-wrap gap-2">
            {["Devis", "IPID", "CG"].map(doc => (
              <div key={doc} className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded">
                <FileText className="h-3 w-3" />
                <span>{doc}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1" 
              size="lg" 
              onClick={handleSendPaymentLink}
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer au client
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={onNext}
            >
              Émettre la police
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};