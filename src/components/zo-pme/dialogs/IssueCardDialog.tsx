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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARD_MOTIFS_EMISSION } from "@/data/zoPme";
import { ScopeNote } from "../shared/states";
import type { Pme } from "@/data/zoPme";
import type { IssueCardInput } from "../ZoPmeProvider";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pme: Pme | null;
  onSubmit: (input: IssueCardInput) => void;
}

export function IssueCardDialog({ open, onOpenChange, pme, onSubmit }: Props) {
  const [porteur, setPorteur] = useState("");
  const [motif, setMotif] = useState(CARD_MOTIFS_EMISSION[0]);
  const [version, setVersion] = useState("V1");

  useEffect(() => {
    if (open && pme) {
      setPorteur(pme.contacts.find((c) => c.principal)?.nom ?? "");
      setMotif(pme.cartesRefs.length > 0 ? "Renouvellement" : CARD_MOTIFS_EMISSION[0]);
      setVersion(pme.cartesRefs.length > 0 ? "V2" : "V1");
    }
  }, [open, pme]);

  const invalid = porteur.trim().length < 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Émettre une carte</DialogTitle>
          <DialogDescription>
            {pme
              ? `${pme.raisonSociale} · matricule ${pme.matricule}. La carte entre dans le cycle au statut « Demandée ».`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Porteur *</Label>
            <Select value={porteur} onValueChange={setPorteur}>
              <SelectTrigger aria-label="Porteur de la carte">
                <SelectValue placeholder="Choisir un contact" />
              </SelectTrigger>
              <SelectContent>
                {(pme?.contacts ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.nom}>
                    {c.nom} — {c.fonction}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Motif d'émission *</Label>
            <Select value={motif} onValueChange={setMotif}>
              <SelectTrigger aria-label="Motif d'émission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARD_MOTIFS_EMISSION.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="card-version">Version de la carte *</Label>
            <Input
              id="card-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="V1"
            />
          </div>

          <ScopeNote tone="backend">
            La fabrication physique, l'encodage et la logistique de remise restent des dépendances
            back-end / prestataire : seul le suivi est géré ici.
          </ScopeNote>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={invalid || !pme}
            onClick={() => {
              onSubmit({ porteur: porteur.trim(), motifEmission: motif, version: version.trim() || "V1" });
              onOpenChange(false);
            }}
          >
            Émettre la carte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
