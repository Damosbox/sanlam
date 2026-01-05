import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, Settings, Send, Download, ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SelectedProductType } from "../types";

type ProcessStep = 'waiting-payment' | 'payment-received' | 'generating-documents' | 'documents-sent' | 'sending-tips' | 'tips-sent';

interface PaymentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentReceived: () => void;
  channels: string[];
  clientEmail?: string;
  productType?: SelectedProductType;
  clientPhone?: string;
  onShowCrossSell?: () => void;
}

interface StepItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isComplete: boolean;
  isActive: boolean;
}

const StepItem = ({ icon, title, subtitle, isComplete, isActive }: StepItemProps) => (
  <div className={cn(
    "flex items-center gap-4 p-4 rounded-xl transition-all duration-500",
    isActive && "bg-muted/50"
  )}>
    <div className={cn(
      "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500",
      isComplete ? "bg-green-100" : "bg-muted"
    )}>
      {isComplete ? (
        <CheckCircle2 className="h-6 w-6 text-green-600" />
      ) : isActive ? (
        <div className="relative">
          {icon}
          <Loader2 className="h-4 w-4 text-primary animate-spin absolute -bottom-1 -right-1" />
        </div>
      ) : (
        icon
      )}
    </div>
    <div className="flex-1">
      <p className={cn(
        "font-semibold transition-colors duration-300",
        isComplete ? "text-green-700" : isActive ? "text-foreground" : "text-muted-foreground"
      )}>
        {title}
      </p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    {isComplete && (
      <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center animate-scale-in">
        <CheckCircle2 className="h-5 w-5 text-white" />
      </div>
    )}
  </div>
);

// Product-specific tips
const productTips: Record<string, { icon: string; message: string }> = {
  auto: {
    icon: "🚗",
    message: "Veillez à vérifier régulièrement la pression de vos pneus pour votre sécurité !"
  },
  mrh: {
    icon: "🏠", 
    message: "Pensez à mettre à jour votre inventaire de biens chaque année."
  },
  molo_molo: {
    icon: "💰",
    message: "Votre épargne fructifie ! Consultez votre solde sur notre app mobile."
  },
  pack_obseques: {
    icon: "👨‍👩‍👧‍👦",
    message: "Gardez vos documents de contrat dans un endroit sûr, accessible à vos proches."
  },
  assistance_voyage: {
    icon: "✈️",
    message: "Bon voyage ! En cas d'urgence, contactez notre assistance 24/7."
  }
};

// Cross-sell offers by product
const crossSellOffers: Record<string, { title: string; discount: string; description: string }> = {
  auto: {
    title: "Protection Corporelle Conducteur",
    discount: "-45%",
    description: "Protégez-vous en cas d'accident corporel"
  },
  mrh: {
    title: "Assurance Objets de Valeur",
    discount: "-30%",
    description: "Couvrez vos bijoux et objets précieux"
  },
  molo_molo: {
    title: "Pack Obsèques Famille",
    discount: "-25%",
    description: "Protégez aussi vos proches"
  },
  pack_obseques: {
    title: "Épargne Molo Molo",
    discount: "-20%",
    description: "Constituez un capital pour votre famille"
  },
  assistance_voyage: {
    title: "Assurance Bagages Premium",
    discount: "-35%",
    description: "Protection complète de vos effets personnels"
  }
};

export const PaymentStatusDialog = ({
  open,
  onOpenChange,
  onPaymentReceived,
  channels,
  clientEmail = "client@email.com",
  productType = "auto",
  clientPhone,
  onShowCrossSell,
}: PaymentStatusDialogProps) => {
  const [currentStep, setCurrentStep] = useState<ProcessStep>('waiting-payment');

  useEffect(() => {
    if (open && currentStep === 'waiting-payment') {
      const timer1 = setTimeout(() => {
        setCurrentStep('payment-received');
      }, 3000);
      return () => clearTimeout(timer1);
    }
  }, [open, currentStep]);

  useEffect(() => {
    if (currentStep === 'payment-received') {
      const timer2 = setTimeout(() => {
        setCurrentStep('generating-documents');
      }, 1500);
      return () => clearTimeout(timer2);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'generating-documents') {
      const timer3 = setTimeout(() => {
        setCurrentStep('documents-sent');
      }, 2500);
      return () => clearTimeout(timer3);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'documents-sent') {
      const timer4 = setTimeout(() => {
        setCurrentStep('sending-tips');
      }, 1000);
      return () => clearTimeout(timer4);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'sending-tips') {
      const timer5 = setTimeout(() => {
        setCurrentStep('tips-sent');
      }, 1500);
      return () => clearTimeout(timer5);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!open) {
      setCurrentStep('waiting-payment');
    }
  }, [open]);

  const handleContinue = () => {
    onPaymentReceived();
    onOpenChange(false);
  };

  const handleCrossSell = () => {
    if (onShowCrossSell) {
      onShowCrossSell();
    }
    onOpenChange(false);
  };

  const channelLabels: Record<string, string> = {
    email: "Email",
    sms: "SMS",
    whatsapp: "WhatsApp",
  };

  const isAllComplete = currentStep === 'tips-sent';
  const channelText = channels.map(c => channelLabels[c] || c).join(", ");

  const getStepNumber = (step: ProcessStep): number => {
    const steps: ProcessStep[] = ['waiting-payment', 'payment-received', 'generating-documents', 'documents-sent', 'sending-tips', 'tips-sent'];
    return steps.indexOf(step);
  };

  const stepNum = getStepNumber(currentStep);
  const tip = productTips[productType] || productTips.auto;
  const crossSell = crossSellOffers[productType] || crossSellOffers.auto;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          {isAllComplete && (
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center animate-scale-in shadow-lg">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            </div>
          )}
          <DialogTitle className="text-xl">
            {isAllComplete ? "Finalisation terminée" : "Finalisation en cours"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {/* Step 1: Payment */}
          <StepItem
            icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
            title="Paiement reçu"
            subtitle="Transaction confirmée"
            isComplete={stepNum >= 1}
            isActive={stepNum === 0}
          />

          {/* Step 2: Document Generation */}
          <StepItem
            icon={<Settings className="h-6 w-6 text-muted-foreground" />}
            title="Génération des documents"
            subtitle="Contrat et annexes créés"
            isComplete={stepNum >= 3}
            isActive={stepNum === 2}
          />

          {/* Step 3: Sending to client */}
          <StepItem
            icon={<Send className="h-6 w-6 text-muted-foreground" />}
            title="Envoi au client"
            subtitle={`Envoyé à ${clientEmail} par ${channelText}`}
            isComplete={stepNum >= 3}
            isActive={stepNum === 2}
          />

          {/* Step 4: Sending tips */}
          <StepItem
            icon={<MessageCircle className="h-6 w-6 text-muted-foreground" />}
            title="Envoi des conseils"
            subtitle={`Message envoyé ${clientPhone ? `au ${clientPhone}` : "au client"}`}
            isComplete={stepNum >= 5}
            isActive={stepNum === 4}
          />
        </div>

        {isAllComplete && (
          <div className="space-y-4 pt-2 animate-fade-in">
            <p className="text-center text-lg font-semibold text-green-700">
              C'est fait ! Les documents ont été envoyés
            </p>
            
            {/* Product tip card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">{tip.icon}</span>
                <div>
                  <p className="font-medium text-blue-900">Conseil envoyé au client</p>
                  <p className="text-sm text-blue-700">{tip.message}</p>
                </div>
              </CardContent>
            </Card>

            {/* Cross-sell offer */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-900">Offre exclusive !</span>
                  <span className="ml-auto text-sm font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded">
                    {crossSell.discount}
                  </span>
                </div>
                <p className="font-medium text-amber-900">{crossSell.title}</p>
                <p className="text-sm text-amber-700 mb-3">{crossSell.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleContinue} className="flex-1">
                    Non merci
                  </Button>
                  <Button size="sm" onClick={handleCrossSell} className="flex-1 bg-amber-600 hover:bg-amber-700">
                    En savoir plus
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleContinue}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger les documents
              </Button>
              
              <Button 
                variant="link" 
                onClick={handleContinue}
                className="text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        )}

        {!isAllComplete && (
          <div className="flex justify-center pt-4">
            <p className="text-sm text-muted-foreground animate-pulse">
              {currentStep === 'waiting-payment' && "En attente de la confirmation du paiement..."}
              {currentStep === 'payment-received' && "Préparation des documents..."}
              {currentStep === 'generating-documents' && "Génération et envoi en cours..."}
              {currentStep === 'documents-sent' && "Préparation du message de conseils..."}
              {currentStep === 'sending-tips' && "Envoi du message de conseils..."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
