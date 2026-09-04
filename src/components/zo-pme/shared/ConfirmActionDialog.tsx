import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  /** Motif obligatoire (journal de décision) ou optionnel. */
  reason?: "required" | "optional" | "none";
  reasonLabel?: string;
  onConfirm: (motif?: string) => void;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  destructive = false,
  reason = "none",
  reasonLabel = "Motif",
  onConfirm,
}: ConfirmActionDialogProps) {
  const [motif, setMotif] = useState("");

  useEffect(() => {
    if (open) setMotif("");
  }, [open]);

  const invalid = reason === "required" && motif.trim().length < 3;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {reason !== "none" && (
          <div className="space-y-2">
            <Label htmlFor="zo-pme-motif" className="text-sm">
              {reasonLabel}
              {reason === "required" && <span className="text-destructive"> *</span>}
            </Label>
            <Textarea
              id="zo-pme-motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Renseignez le motif consigné au journal de décision"
              rows={3}
            />
            {invalid && (
              <p className="text-xs text-destructive">
                Le motif est obligatoire (3 caractères minimum).
              </p>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={invalid}
            className={destructive ? "bg-destructive hover:bg-destructive/90" : undefined}
            onClick={(e) => {
              if (invalid) {
                e.preventDefault();
                return;
              }
              onConfirm(motif.trim() || undefined);
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
