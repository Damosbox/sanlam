import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  count: number;
  onConfirm: () => void;
}

export function RenewalsBulkNotifyDialog({ open, onOpenChange, count, onConfirm }: Props) {
  const plural = count > 1;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notification de renouvellement</DialogTitle>
          <DialogDescription>
            {count} contrat{plural ? "s" : ""} {plural ? "seront notifiés" : "sera notifié"} pour renouvellement. Confirmer ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onConfirm}>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}