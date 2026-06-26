import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useCreateManualOverride } from "@/hooks/useManualOverrideRequests";
import { VF_SCORE_MIN, VF_SCORE_MAX, getNiveau, VF_NIVEAU_LABEL } from "@/lib/scoring/vfV2";

const Schema = z.object({
  requestedScore: z
    .number({ invalid_type_error: "Score requis" })
    .int()
    .min(VF_SCORE_MIN)
    .max(VF_SCORE_MAX),
  justification: z
    .string()
    .trim()
    .min(20, "Justification d'au moins 20 caractères")
    .max(1000),
});

interface Props {
  clientId: string;
  currentScore: number | null;
  currentNiveau: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualOverrideRequestDialog({
  clientId,
  currentScore,
  currentNiveau,
  open,
  onOpenChange,
}: Props) {
  const [scoreStr, setScoreStr] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [errors, setErrors] = useState<{ score?: string; justification?: string }>({});
  const mutation = useCreateManualOverride();

  useEffect(() => {
    if (open) {
      setScoreStr(currentScore != null ? String(currentScore) : "");
      setJustification("");
      setErrors({});
    }
  }, [open, currentScore]);

  const parsedScore = scoreStr === "" ? NaN : Number(scoreStr);
  const newNiveau = Number.isFinite(parsedScore) ? getNiveau(parsedScore) : null;

  const submit = async () => {
    const parsed = Schema.safeParse({
      requestedScore: parsedScore,
      justification,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        score: flat.requestedScore?.[0],
        justification: flat.justification?.[0],
      });
      return;
    }
    try {
      await mutation.mutateAsync({
        clientId,
        requestedScore: parsed.data.requestedScore,
        justification: parsed.data.justification,
        currentScore,
        currentNiveau,
      });
      onOpenChange(false);
    } catch {
      /* toast déjà émis */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demander une modification manuelle du score</DialogTitle>
          <DialogDescription>
            La demande sera soumise à validation d'un administrateur. Le score
            ne sera mis à jour qu'après approbation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Score actuel : </span>
            <span className="font-mono font-semibold">
              {currentScore ?? "—"}/100
            </span>
            {currentNiveau && (
              <span className="text-muted-foreground">
                {" "}
                · {VF_NIVEAU_LABEL[currentNiveau as keyof typeof VF_NIVEAU_LABEL] ?? currentNiveau}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-score">
              Nouveau score ({VF_SCORE_MIN} à {VF_SCORE_MAX})
            </Label>
            <Input
              id="new-score"
              type="number"
              min={VF_SCORE_MIN}
              max={VF_SCORE_MAX}
              step={1}
              value={scoreStr}
              onChange={(e) => setScoreStr(e.target.value)}
            />
            {newNiveau && (
              <p className="text-xs text-muted-foreground">
                Niveau cible : <strong>{VF_NIVEAU_LABEL[newNiveau]}</strong>
              </p>
            )}
            {errors.score && (
              <p className="text-xs text-destructive">{errors.score}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">
              Justification <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Décrivez l'anomalie ou la raison de la modification (min 20 caractères)"
            />
            <p className="text-xs text-muted-foreground">
              {justification.trim().length}/1000 caractères
            </p>
            {errors.justification && (
              <p className="text-xs text-destructive">{errors.justification}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Envoi…" : "Soumettre la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}