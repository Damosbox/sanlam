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
import { X } from "lucide-react";
import { ScopeNote } from "../shared/states";
import { INTERMEDIAIRES } from "@/data/zoPme/members";
import type { NewPmeInput } from "../ZoPmeProvider";

const SECTEURS = [
  "Transport & logistique",
  "Services numériques",
  "BTP",
  "Agro-industrie",
  "Santé",
  "Grande distribution",
  "Commerce de gros",
  "Import-export",
  "Tourisme",
  "Éducation",
];

const emptyForm: NewPmeInput = {
  raisonSociale: "",
  secteur: "",
  ville: "",
  intermediaire: INTERMEDIAIRES[0],
  produitsSouscrits: [],
  responsable: { prenom: "", nom: "", fonction: "", email: "", telephone: "" },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Intermédiaire imposé (périmètre du Commercial). */
  lockedIntermediaire?: string | null;
  onSubmit: (input: NewPmeInput) => void;
}

export function NewPmeDialog({ open, onOpenChange, lockedIntermediaire, onSubmit }: Props) {
  const [form, setForm] = useState<NewPmeInput>(emptyForm);
  const [produitDraft, setProduitDraft] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        ...emptyForm,
        intermediaire: lockedIntermediaire ?? INTERMEDIAIRES[0],
        responsable: { ...emptyForm.responsable },
        produitsSouscrits: [],
      });
      setProduitDraft("");
    }
  }, [open, lockedIntermediaire]);

  const set = <K extends keyof NewPmeInput>(key: K, value: NewPmeInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setResp = (key: keyof NewPmeInput["responsable"], value: string) =>
    setForm((f) => ({ ...f, responsable: { ...f.responsable, [key]: value } }));

  const invalid =
    form.raisonSociale.trim().length < 2 ||
    form.secteur === "" ||
    form.ville.trim().length < 2 ||
    form.responsable.nom.trim().length < 2 ||
    form.responsable.prenom.trim().length < 2 ||
    form.responsable.fonction.trim().length < 2 ||
    !form.responsable.email.includes("@") ||
    form.responsable.telephone.trim().length < 8;

  const addProduit = () => {
    const value = produitDraft.trim();
    if (value.length < 2) return;
    setForm((f) =>
      f.produitsSouscrits.includes(value)
        ? f
        : { ...f, produitsSouscrits: [...f.produitsSouscrits, value] }
    );
    setProduitDraft("");
  };

  const removeProduit = (produit: string) =>
    setForm((f) => ({
      ...f,
      produitsSouscrits: f.produitsSouscrits.filter((p) => p !== produit),
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle PME membre</DialogTitle>
          <DialogDescription>
            Le matricule Zô PME est généré automatiquement au format ZoPME-AAMM-###### et le
            responsable principal est créé comme contact rattaché.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pme-raison">Raison sociale *</Label>
              <Input
                id="pme-raison"
                value={form.raisonSociale}
                onChange={(e) => set("raisonSociale", e.target.value)}
                placeholder="Ex. Ivoire Services SARL"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Secteur *</Label>
              <Select value={form.secteur} onValueChange={(v) => set("secteur", v)}>
                <SelectTrigger aria-label="Secteur d'activité">
                  <SelectValue placeholder="Choisir un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {SECTEURS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pme-ville">Ville *</Label>
              <Input
                id="pme-ville"
                value={form.ville}
                onChange={(e) => set("ville", e.target.value)}
                placeholder="Abidjan"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Intermédiaire / apporteur *</Label>
              <Select
                value={form.intermediaire}
                onValueChange={(v) => set("intermediaire", v)}
                disabled={!!lockedIntermediaire}
              >
                <SelectTrigger aria-label="Intermédiaire">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERMEDIAIRES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lockedIntermediaire && (
                <p className="text-xs text-muted-foreground">
                  Votre périmètre commercial est appliqué automatiquement.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Responsable principal *</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={form.responsable.prenom}
                onChange={(e) => setResp("prenom", e.target.value)}
                placeholder="Prénom"
                aria-label="Prénom du responsable"
              />
              <Input
                value={form.responsable.nom}
                onChange={(e) => setResp("nom", e.target.value)}
                placeholder="Nom"
                aria-label="Nom du responsable"
              />
              <Input
                value={form.responsable.fonction}
                onChange={(e) => setResp("fonction", e.target.value)}
                placeholder="Fonction (ex. Directeur général)"
                aria-label="Fonction du responsable"
              />
              <Input
                value={form.responsable.telephone}
                onChange={(e) => setResp("telephone", e.target.value)}
                placeholder="+225 07 00 00 00 00"
                aria-label="Téléphone du responsable"
              />
              <Input
                className="sm:col-span-2"
                value={form.responsable.email}
                onChange={(e) => setResp("email", e.target.value)}
                placeholder="responsable@entreprise.ci"
                aria-label="E-mail du responsable"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pme-produit">Produits souscrits (déclaratif)</Label>
            <div className="flex gap-2">
              <Input
                id="pme-produit"
                value={produitDraft}
                onChange={(e) => setProduitDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addProduit();
                  }
                }}
                placeholder="Saisir un produit puis Entrée"
              />
              <Button type="button" variant="outline" onClick={addProduit}>
                Ajouter
              </Button>
            </div>
            {form.produitsSouscrits.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.produitsSouscrits.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => removeProduit(p)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"
                    aria-label={`Retirer ${p}`}
                  >
                    {p}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
            <ScopeNote tone="backend">
              Référentiel produit à valider — données déclaratives de démonstration. Aucune liste de
              produits n'est proposée tant que la décision métier n'est pas rendue.
            </ScopeNote>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={invalid}
            onClick={() => {
              onSubmit(form);
              onOpenChange(false);
            }}
          >
            Créer la PME
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
