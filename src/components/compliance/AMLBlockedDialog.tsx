import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Copy, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AMLBlockedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceNumber?: string;
  detectedAt?: string;
  riskLevel?: "low" | "medium" | "high";
  contextLabel?: string;
  onBackToDashboard?: () => void;
  onNotifyCompliance?: () => void;
}

const riskMap = {
  low: { label: "Faible", className: "text-yellow-700 bg-yellow-100" },
  medium: { label: "Modéré", className: "text-orange-700 bg-orange-100" },
  high: { label: "Élevé", className: "text-red-700 bg-red-100" },
};

export const AMLBlockedDialog = ({
  open,
  onOpenChange,
  referenceNumber = `AML-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 90000 + 10000)}`,
  detectedAt = new Date().toLocaleString("fr-FR"),
  riskLevel = "high",
  contextLabel = "Identification client",
  onBackToDashboard,
  onNotifyCompliance,
}: AMLBlockedDialogProps) => {
  const risk = riskMap[riskLevel];

  const handleCopy = () => {
    navigator.clipboard.writeText(referenceNumber);
    toast.success("Référence copiée");
  };

  const handleNotify = () => {
    onNotifyCompliance?.();
    toast.success("Équipe Conformité notifiée", {
      description: `Dossier ${referenceNumber} transmis pour revue manuelle`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* non fermable par overlay */ }}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-xl shadow-orange-500/30 animate-scale-in">
              <ShieldAlert className="h-10 w-10 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl">
            Vérification de conformité requise
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Souscription temporairement suspendue
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Notre processus de vérification réglementaire <strong>(LCB-FT)</strong> nécessite
            une revue manuelle de ce dossier par notre équipe Conformité avant de pouvoir
            poursuivre.
          </p>

          <Card className="bg-muted/50 border-muted-foreground/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Référence dossier</span>
                <code className="font-mono font-semibold text-foreground">{referenceNumber}</code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date de détection</span>
                <span className="text-foreground">{detectedAt}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Contexte</span>
                <span className="text-foreground">{contextLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Niveau de risque</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${risk.className}`}>
                  ● {risk.label}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Prochaines étapes :</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Le dossier a été transmis à l'équipe Conformité
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Délai de traitement estimé : 24-48h ouvrées
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Le client sera notifié par email à l'issue de la revue
              </li>
            </ul>
          </div>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-3">
              <p className="text-xs text-amber-900">
                <strong>ⓘ Confidentialité :</strong> aucune information relative à cette
                vérification ne doit être communiquée au client à ce stade.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <Button onClick={handleNotify} className="flex-1" variant="default">
                <Mail className="h-4 w-4 mr-2" />
                Notifier la Conformité
              </Button>
              <Button onClick={handleCopy} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                onBackToDashboard?.();
                onOpenChange(false);
              }}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};