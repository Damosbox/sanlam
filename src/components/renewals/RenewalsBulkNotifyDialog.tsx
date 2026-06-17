import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  count: number;
  onConfirm: (adjustmentPct: number, needsApproval: boolean) => void;
  maxBonus?: number;
  maxMalus?: number;
  approvalThreshold?: number;
  suggestedAdjustment?: number;
}

export function RenewalsBulkNotifyDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
  maxBonus = 0,
  maxMalus = 0,
  approvalThreshold = 0,
  suggestedAdjustment = 0,
}: Props) {
  const plural = count > 1;
  const [adjustment, setAdjustment] = useState<number>(suggestedAdjustment);

  useEffect(() => {
    if (open) setAdjustment(suggestedAdjustment);
  }, [open, suggestedAdjustment]);

  // Fallback bounds when product has no bonus/malus configuration,
  // so the operator can still apply an adjustment from the dialog.
  const effMaxBonus = maxBonus > 0 ? maxBonus : 50;
  const effMaxMalus = maxMalus > 0 ? maxMalus : 50;
  const min = -Math.abs(effMaxBonus);
  const max = Math.abs(effMaxMalus);
  const clamped = Math.max(min, Math.min(max, adjustment));
  const needsApproval = approvalThreshold > 0 && Math.abs(clamped) > approvalThreshold;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notification de renouvellement</DialogTitle>
          <DialogDescription>
            {count} contrat{plural ? "s" : ""} {plural ? "seront notifiés" : "sera notifié"} pour renouvellement. Confirmer ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
            <Label htmlFor="bm-adjustment">Bonus / Malus appliqué (%)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="bm-adjustment"
                type="number"
                min={min}
                max={max}
                step={1}
                value={clamped}
                onChange={(e) => setAdjustment(+e.target.value || 0)}
                className="w-28"
              />
              <span className="text-xs text-muted-foreground">
                Bonus jusqu'à {effMaxBonus}% · Malus jusqu'à {effMaxMalus}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Valeur négative = bonus (remise), valeur positive = malus (surprime).
            </p>
            {needsApproval && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Cette opération dépasse le seuil de {approvalThreshold}% et sera soumise à approbation.
                </span>
              </div>
            )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => onConfirm(clamped, needsApproval)}>
            {needsApproval ? "Demander approbation" : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}