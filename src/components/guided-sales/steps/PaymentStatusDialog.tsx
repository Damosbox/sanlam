import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface PaymentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentReceived: () => void;
  channels: string[];
}

export const PaymentStatusDialog = ({
  open,
  onOpenChange,
  onPaymentReceived,
  channels,
}: PaymentStatusDialogProps) => {
  const [paymentReceived, setPaymentReceived] = useState(false);

  useEffect(() => {
    if (open && !paymentReceived) {
      // Mock webhook: simulate payment confirmation after 4 seconds
      const timer = setTimeout(() => {
        setPaymentReceived(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [open, paymentReceived]);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setPaymentReceived(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {paymentReceived ? "Paiement confirmé" : "En attente du paiement"}
          </DialogTitle>
          <DialogDescription>
            Lien envoyé via : {channels.map(c => channelLabels[c] || c).join(", ")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {paymentReceived ? (
            <>
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-green-600">Paiement reçu ✓</p>
              <p className="text-sm text-muted-foreground text-center">
                Le client a effectué le paiement avec succès.
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Lien envoyé !</p>
              <p className="text-sm text-muted-foreground text-center">
                En attente de la confirmation de paiement du client...
              </p>
              <p className="text-xs text-muted-foreground">
                (Simulation du webhook en cours)
              </p>
            </>
          )}
        </div>

        {paymentReceived && (
          <div className="flex justify-end">
            <Button onClick={handleContinue}>
              Continuer vers l'émission
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
