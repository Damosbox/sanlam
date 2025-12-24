import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, MessageSquare, Smartphone, PenTool, FileText, CreditCard, Phone, Wallet, Copy, Check, Fingerprint, Send } from "lucide-react";
import { GuidedSalesState, PaymentChannel } from "../types";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import { useState } from "react";
import { toast } from "sonner";
import { PaymentStatusDialog } from "./PaymentStatusDialog";

interface BindingStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["binding"]>) => void;
  onNext: () => void;
}

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

const paymentChannelOptions = [
  { id: "email" as PaymentChannel, label: "Email", icon: Mail },
  { id: "sms" as PaymentChannel, label: "SMS", icon: MessageSquare },
  { id: "whatsapp" as PaymentChannel, label: "WhatsApp", icon: Smartphone },
];

export const BindingStep = ({
  state,
  onUpdate,
  onNext
}: BindingStepProps) => {
  const { binding } = state;
  const [linkCopied, setLinkCopied] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Generate payment link (mock)
  const paymentLink = `https://pay.sanlam.ci/q/${Date.now().toString(36)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    setLinkCopied(true);
    toast.success("Lien copié dans le presse-papier");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Signature handlers
  const handlePresentialSignature = () => {
    toast.success("Zone de signature ouverte sur tablette");
    onUpdate({ signatureCompleted: true });
  };

  const handleSendOtp = () => {
    if (!binding.clientPhone) {
      toast.error("Veuillez renseigner le numéro de téléphone");
      return;
    }
    // Generate mock OTP
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(mockOtp);
    onUpdate({ signatureOtpSent: true });
    toast.success(`Code OTP envoyé au ${binding.clientPhone} (Code: ${mockOtp})`);
  };

  const handleVerifyOtp = () => {
    if (otpInput === otpCode) {
      onUpdate({ signatureOtpVerified: true, signatureCompleted: true });
      toast.success("Signature électronique validée !");
    } else {
      toast.error("Code OTP incorrect");
    }
  };

  // Payment channel handlers
  const handleChannelToggle = (channel: PaymentChannel) => {
    const current = binding.paymentChannels || [];
    const updated = current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel];
    onUpdate({ paymentChannels: updated });
  };

  const handleSendPaymentLink = () => {
    if (!binding.signatureCompleted) {
      toast.error("Veuillez d'abord finaliser la signature");
      return;
    }

    const channels = binding.paymentChannels || [];
    if (channels.length === 0) {
      toast.error("Veuillez sélectionner au moins un canal d'envoi");
      return;
    }

    // Validate contact info
    if (channels.includes("email") && !binding.clientEmail) {
      toast.error("Veuillez renseigner l'email du client");
      return;
    }
    if ((channels.includes("sms") || channels.includes("whatsapp")) && !binding.clientPhone) {
      toast.error("Veuillez renseigner le téléphone du client");
      return;
    }

    // Show payment dialog
    setShowPaymentDialog(true);
    onUpdate({ paymentLinkSent: true });
  };

  const handlePaymentReceived = () => {
    onUpdate({ paymentReceived: true });
    onNext();
  };

  const needsPhone = binding.paymentChannels?.includes("sms") || binding.paymentChannels?.includes("whatsapp");
  const needsEmail = binding.paymentChannels?.includes("email");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Finaliser le contrat</h1>
        <p className="text-muted-foreground mt-1">
          Signez le contrat puis envoyez le lien de paiement au client.
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

      {/* Signature Section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Signature du contrat
            {binding.signatureCompleted && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ✓ Signée
              </span>
            )}
          </h3>
          
          <RadioGroup 
            value={binding.signatureType} 
            onValueChange={v => onUpdate({ signatureType: v as "presential" | "electronic", signatureCompleted: false, signatureOtpSent: false, signatureOtpVerified: false })} 
            className="grid grid-cols-2 gap-3"
          >
            {/* Presential Signature */}
            <div>
              <RadioGroupItem value="presential" id="sig-presential" className="peer sr-only" />
              <Label 
                htmlFor="sig-presential" 
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                  "hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  binding.signatureType === "presential" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <PenTool className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Signature sur place</p>
                  <p className="text-xs text-muted-foreground">Sur tablette agent</p>
                </div>
              </Label>
            </div>

            {/* Electronic Signature */}
            <div>
              <RadioGroupItem value="electronic" id="sig-electronic" className="peer sr-only" />
              <Label 
                htmlFor="sig-electronic" 
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                  "hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  binding.signatureType === "electronic" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Signature électronique</p>
                  <p className="text-xs text-muted-foreground">Via OTP</p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Presential Signature Action */}
          {binding.signatureType === "presential" && !binding.signatureCompleted && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Ouvrez la zone de signature sur votre tablette pour que le client puisse signer.
              </p>
              <Button onClick={handlePresentialSignature}>
                <PenTool className="h-4 w-4 mr-2" />
                Ouvrir tablette de signature
              </Button>
            </div>
          )}

          {/* Electronic Signature OTP Flow */}
          {binding.signatureType === "electronic" && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Phone + Send OTP */}
                <div>
                  <Label htmlFor="sig-phone" className="text-sm">Téléphone du client</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="sig-phone"
                      type="tel"
                      placeholder="+225 07 12 34 56 78"
                      value={binding.clientPhone}
                      onChange={(e) => onUpdate({ clientPhone: e.target.value })}
                      disabled={binding.signatureOtpSent}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendOtp} 
                      disabled={binding.signatureOtpSent}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Envoyer OTP
                    </Button>
                  </div>
                </div>

                {/* OTP Input + Verify */}
                <div>
                  <Label htmlFor="otp-input" className="text-sm">Code OTP reçu</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="otp-input"
                      type="text"
                      placeholder="123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      maxLength={6}
                      disabled={!binding.signatureOtpSent || binding.signatureOtpVerified}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleVerifyOtp}
                      disabled={!binding.signatureOtpSent || binding.signatureOtpVerified}
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Vérifier
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Payment Method & Link Sharing Section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Mode de paiement
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map(method => {
              const isSelected = binding.paymentMethod === method.id;
              return (
                <div
                  key={method.id}
                  className={cn(
                    "relative flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => onUpdate({ paymentMethod: method.id })}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white", method.color)}>
                    <method.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{method.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{method.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conditional Payment Link Sharing - appears after payment method selection */}
          {binding.paymentMethod && (
            <div className="mt-6 pt-6 border-t space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Send className="h-4 w-4" />
                Partager le lien de paiement
              </h4>

              {/* Channel Selection (Multi-select) - Horizontal alignment */}
              <div>
                <Label className="text-sm mb-2 block">Canaux d'envoi</Label>
                <div className="flex gap-4">
                  {paymentChannelOptions.map(channel => (
                    <label
                      key={channel.id}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all",
                        binding.paymentChannels?.includes(channel.id) 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={binding.paymentChannels?.includes(channel.id) || false}
                        onCheckedChange={() => handleChannelToggle(channel.id)}
                      />
                      <channel.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{channel.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contact fields based on selected channels */}
              {(needsEmail || needsPhone) && (
                <div className="flex gap-4">
                  {needsEmail && (
                    <div className="flex-1">
                      <Label htmlFor="payment-email" className="text-sm">Email du client</Label>
                      <Input
                        id="payment-email"
                        type="email"
                        placeholder="client@email.com"
                        value={binding.clientEmail}
                        onChange={(e) => onUpdate({ clientEmail: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  )}
                  {needsPhone && (
                    <div className="flex-1">
                      <Label htmlFor="payment-phone" className="text-sm">Téléphone du client</Label>
                      <Input
                        id="payment-phone"
                        type="tel"
                        placeholder="+225 07 12 34 56 78"
                        value={binding.clientPhone}
                        onChange={(e) => onUpdate({ clientPhone: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Payment Link with Send Button */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Lien de paiement</p>
                <div className="flex items-center gap-2">
                  <a 
                    href={paymentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 text-xs bg-background p-2 rounded border truncate text-primary hover:underline"
                  >
                    {paymentLink}
                  </a>
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button 
                    onClick={handleSendPaymentLink}
                    disabled={!binding.signatureCompleted || (binding.paymentChannels?.length || 0) === 0}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer le lien
                  </Button>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-medium mb-2 text-sm">Documents joints</h4>
                <div className="flex flex-wrap gap-2">
                  {["Devis", "IPID", "Conditions Générales"].map(doc => (
                    <div key={doc} className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded">
                      <FileText className="h-3 w-3" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>


              {!binding.signatureCompleted && (
                <p className="text-xs text-muted-foreground text-center">
                  Veuillez d'abord finaliser la signature du contrat
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Status Dialog */}
      <PaymentStatusDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onPaymentReceived={handlePaymentReceived}
        channels={binding.paymentChannels || []}
      />
    </div>
  );
};
