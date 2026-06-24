import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VF_ACTION_TYPES,
  VF_ACTION_CAP_PER_YEAR,
} from "@/lib/scoring/vfV2";
import { useRecalcClientScore } from "@/hooks/useClientScore";
import { toast } from "sonner";

interface Props {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScoringActionDialog({ clientId, open, onOpenChange }: Props) {
  const [type, setType] = useState<string>("");
  const [note, setNote] = useState("");
  const mutation = useRecalcClientScore();

  const selected = VF_ACTION_TYPES.find((t) => t.value === type);

  const submit = async () => {
    if (!type) return;
    try {
      await mutation.mutateAsync({
        clientId,
        trigger: "action",
        action: { type, note: note || undefined },
      });
      toast.success(`Action enregistrée (+${selected?.points} pts)`);
      setType("");
      setNote("");
      onOpenChange(false);
    } catch {
      /* toast déjà émis */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer une action ponctuelle</DialogTitle>
          <DialogDescription>
            Plafond annuel : {VF_ACTION_CAP_PER_YEAR} pts sur 12 mois glissants.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="action-type">Type d'action</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="action-type">
                <SelectValue placeholder="Choisir une action" />
              </SelectTrigger>
              <SelectContent>
                {VF_ACTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label} (+{t.points} pts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="action-note">Note (optionnel)</Label>
            <Textarea
              id="action-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!type || mutation.isPending}>
            {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}