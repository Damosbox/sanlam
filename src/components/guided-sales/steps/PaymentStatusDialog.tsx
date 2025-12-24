import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Settings, Send, Download, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ProcessStep = 'waiting-payment' | 'payment-received' | 'generating-documents' | 'documents-sent';

interface PaymentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentReceived: () => void;
  channels: string[];
  clientEmail?: string;
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

export const PaymentStatusDialog = ({
  open,
  onOpenChange,
  onPaymentReceived,
  channels,
  clientEmail = "client@email.com",
}: PaymentStatusDialogProps) => {
  const [currentStep, setCurrentStep] = useState<ProcessStep>('waiting-payment');

  useEffect(() => {
    if (open && currentStep === 'waiting-payment') {
      // Simulate payment received after 3 seconds
      const timer1 = setTimeout(() => {
        setCurrentStep('payment-received');
      }, 3000);

      return () => clearTimeout(timer1);
    }
  }, [open, currentStep]);

  useEffect(() => {
    if (currentStep === 'payment-received') {
      // Move to document generation after 1.5 seconds
      const timer2 = setTimeout(() => {
        setCurrentStep('generating-documents');
      }, 1500);

      return () => clearTimeout(timer2);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'generating-documents') {
      // Complete document generation after 2.5 seconds
      const timer3 = setTimeout(() => {
        setCurrentStep('documents-sent');
      }, 2500);

      return () => clearTimeout(timer3);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setCurrentStep('waiting-payment');
    }
  }, [open]);

  const handleContinue = () => {
    onPaymentReceived();
    onOpenChange(false);
  };

  const channelLabels: Record<string, string> = {
    email: "Email",
    sms: "SMS",
    whatsapp: "WhatsApp",
  };

  const isAllComplete = currentStep === 'documents-sent';
  const channelText = channels.map(c => channelLabels[c] || c).join(", ");

  const getStepNumber = (step: ProcessStep): number => {
    const steps: ProcessStep[] = ['waiting-payment', 'payment-received', 'generating-documents', 'documents-sent'];
    return steps.indexOf(step);
  };

  const stepNum = getStepNumber(currentStep);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          {/* Big success icon at top when complete */}
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
        </div>

        {isAllComplete && (
          <div className="space-y-4 pt-2 animate-fade-in">
            <p className="text-center text-lg font-semibold text-green-700">
              C'est fait ! Les documents ont été envoyés
            </p>
            
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
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
