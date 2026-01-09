import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, CreditCard, FileText, Send, Download, ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SelectedProductType } from "../types";
import { Progress } from "@/components/ui/progress";

type ProcessStep = 'payment-processing' | 'payment-received' | 'generating-documents' | 'documents-ready' | 'sending-documents' | 'documents-sent' | 'sending-tips' | 'tips-sent';

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

interface VisualStepProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'complete';
  isLast?: boolean;
}

const VisualStep = ({ stepNumber, title, subtitle, icon, status, isLast = false }: VisualStepProps) => (
  <div className="flex items-start gap-4">
    {/* Step indicator with connecting line */}
    <div className="flex flex-col items-center">
      <div className={cn(
        "h-14 w-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm",
        status === 'complete' && "bg-green-500 scale-100",
        status === 'active' && "bg-primary animate-pulse scale-110 shadow-lg shadow-primary/30",
        status === 'pending' && "bg-muted scale-95 opacity-50"
      )}>
        {status === 'complete' ? (
          <CheckCircle2 className="h-7 w-7 text-white animate-scale-in" />
        ) : status === 'active' ? (
          <div className="relative">
            {icon}
            <div className="absolute -inset-2 rounded-full border-2 border-primary/30 animate-ping" />
          </div>
        ) : (
          icon
        )}
      </div>
      {/* Connecting line */}
      {!isLast && (
        <div className={cn(
          "w-1 h-12 rounded-full transition-all duration-700",
          status === 'complete' ? "bg-green-500" : "bg-muted"
        )} />
      )}
    </div>
    
    {/* Step content */}
    <div className="pt-2 flex-1">
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded-full transition-colors",
          status === 'complete' && "bg-green-100 text-green-700",
          status === 'active' && "bg-primary/10 text-primary",
          status === 'pending' && "bg-muted text-muted-foreground"
        )}>
          Étape {stepNumber}
        </span>
        {status === 'active' && (
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        )}
      </div>
      <p className={cn(
        "font-semibold text-lg mt-1 transition-colors duration-300",
        status === 'complete' && "text-green-700",
        status === 'active' && "text-foreground",
        status === 'pending' && "text-muted-foreground"
      )}>
        {title}
      </p>
      <p className={cn(
        "text-sm transition-colors",
        status === 'pending' ? "text-muted-foreground/50" : "text-muted-foreground"
      )}>
        {subtitle}
      </p>
    </div>
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
  const [currentStep, setCurrentStep] = useState<ProcessStep>('payment-processing');
  const [progress, setProgress] = useState(0);

  // Progress animation
  useEffect(() => {
    if (!open) return;
    
    const stepProgress: Record<ProcessStep, number> = {
      'payment-processing': 10,
      'payment-received': 25,
      'generating-documents': 45,
      'documents-ready': 60,
      'sending-documents': 75,
      'documents-sent': 85,
      'sending-tips': 92,
      'tips-sent': 100
    };
    
    const targetProgress = stepProgress[currentStep];
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= targetProgress) {
          clearInterval(interval);
          return targetProgress;
        }
        return prev + 1;
      });
    }, 30);
    
    return () => clearInterval(interval);
  }, [currentStep, open]);

  useEffect(() => {
    if (open && currentStep === 'payment-processing') {
      const timer = setTimeout(() => setCurrentStep('payment-received'), 2000);
      return () => clearTimeout(timer);
    }
  }, [open, currentStep]);

  useEffect(() => {
    if (currentStep === 'payment-received') {
      const timer = setTimeout(() => setCurrentStep('generating-documents'), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'generating-documents') {
      const timer = setTimeout(() => setCurrentStep('documents-ready'), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'documents-ready') {
      const timer = setTimeout(() => setCurrentStep('sending-documents'), 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'sending-documents') {
      const timer = setTimeout(() => setCurrentStep('documents-sent'), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'documents-sent') {
      const timer = setTimeout(() => setCurrentStep('sending-tips'), 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'sending-tips') {
      const timer = setTimeout(() => setCurrentStep('tips-sent'), 1200);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!open) {
      setCurrentStep('payment-processing');
      setProgress(0);
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

  // Map current step to visual step status
  const getStepStatus = (stepRange: ProcessStep[]): 'pending' | 'active' | 'complete' => {
    const stepOrder: ProcessStep[] = [
      'payment-processing', 'payment-received', 
      'generating-documents', 'documents-ready',
      'sending-documents', 'documents-sent',
      'sending-tips', 'tips-sent'
    ];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    const lastStepIndex = stepOrder.indexOf(stepRange[stepRange.length - 1]);
    const firstStepIndex = stepOrder.indexOf(stepRange[0]);
    
    if (currentIndex > lastStepIndex) return 'complete';
    if (currentIndex >= firstStepIndex && currentIndex <= lastStepIndex) return 'active';
    return 'pending';
  };

  const tip = productTips[productType] || productTips.auto;
  const crossSell = crossSellOffers[productType] || crossSellOffers.auto;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          {isAllComplete ? (
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-scale-in shadow-xl shadow-green-500/30">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
          )}
          <DialogTitle className="text-xl">
            {isAllComplete ? "Souscription finalisée !" : "Finalisation en cours..."}
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        {!isAllComplete && (
          <div className="px-2 pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progression</span>
              <span className="font-semibold text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Visual steps */}
        <div className="py-4 px-2">
          <VisualStep
            stepNumber={1}
            icon={<CreditCard className="h-6 w-6 text-white" />}
            title="Paiement en cours"
            subtitle={getStepStatus(['payment-processing', 'payment-received']) === 'complete' 
              ? "Transaction confirmée ✓" 
              : "Vérification de la transaction..."}
            status={getStepStatus(['payment-processing', 'payment-received'])}
          />

          <VisualStep
            stepNumber={2}
            icon={<FileText className="h-6 w-6 text-white" />}
            title="Génération de la police"
            subtitle={getStepStatus(['generating-documents', 'documents-ready']) === 'complete'
              ? "Contrat et annexes créés ✓"
              : "Création du contrat et des annexes..."}
            status={getStepStatus(['generating-documents', 'documents-ready'])}
          />

          <VisualStep
            stepNumber={3}
            icon={<Send className="h-6 w-6 text-white" />}
            title="Transmission des documents"
            subtitle={getStepStatus(['sending-documents', 'documents-sent', 'sending-tips', 'tips-sent']) === 'complete'
              ? `Envoyé à ${clientEmail} via ${channelText} ✓`
              : `Envoi vers ${clientEmail} via ${channelText}...`}
            status={getStepStatus(['sending-documents', 'documents-sent', 'sending-tips', 'tips-sent'])}
            isLast
          />
        </div>

        {/* Status message when processing */}
        {!isAllComplete && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground animate-pulse">
              {currentStep === 'payment-processing' && "⏳ Vérification du paiement en cours..."}
              {currentStep === 'payment-received' && "✓ Paiement confirmé ! Préparation des documents..."}
              {currentStep === 'generating-documents' && "📄 Génération du contrat d'assurance..."}
              {currentStep === 'documents-ready' && "✓ Documents prêts ! Préparation de l'envoi..."}
              {currentStep === 'sending-documents' && "📤 Envoi des documents au client..."}
              {currentStep === 'documents-sent' && "✓ Documents envoyés ! Préparation des conseils..."}
              {currentStep === 'sending-tips' && "💬 Envoi du message de conseils personnalisés..."}
            </p>
          </div>
        )}

        {isAllComplete && (
          <div className="space-y-4 pt-2 animate-fade-in">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-700">
                🎉 Félicitations ! La souscription est finalisée
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tous les documents ont été envoyés au client
              </p>
            </div>
            
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
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-900">Offre exclusive client !</span>
                  <span className="ml-auto text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full shadow-sm">
                    {crossSell.discount}
                  </span>
                </div>
                <p className="font-medium text-amber-900">{crossSell.title}</p>
                <p className="text-sm text-amber-700 mb-3">{crossSell.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleContinue} className="flex-1">
                    Non merci
                  </Button>
                  <Button size="sm" onClick={handleCrossSell} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                    Proposer au client
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
      </DialogContent>
    </Dialog>
  );
};
