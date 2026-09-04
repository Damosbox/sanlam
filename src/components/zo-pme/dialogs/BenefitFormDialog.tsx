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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIER_ORDER, type Benefit, type Partner, type Tier } from "@/data/zoPme";
import type { BenefitInput } from "../ZoPmeProvider";

const CATEGORIES = [
  "Santé",
  "Carburant",
  "Grande distribution",
  "Télécom",
  "Automobile",
  "Restauration",
  "Formation",
  "Voyage",
];

const SECTEURS = [
  "Santé",
  "Énergie",
  "Distribution",
  "Télécom",
  "Mobilité",
  "Services",
  "Éducation",
];

const empty: BenefitInput = {
  libelle: "",
  categorie: "",
  secteur: "",
  partnerIds: [],
  valeur: "",
  description: "",
  conditions: "",
  dateDebut: "",
  dateFin: "",
  paliersEligibles: [],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: Partner[];
  /** Avantage à modifier, ou null pour une création. */
  benefit: Benefit | null;
  onSubmit: (input: BenefitInput) => void;
}

export function BenefitFormDialog({ open, onOpenChange, partners, benefit, onSubmit }: Props) {
  const [form, setForm] = useState<BenefitInput>(empty);

  useEffect(() => {
    if (!open) return;
    if (benefit) {
      setForm({
        libelle: benefit.libelle,
        categorie: benefit.categorie,
        secteur: benefit.secteur ?? "",
        partnerIds: benefit.partnerIds ?? [benefit.partnerId],
        valeur: benefit.valeur,
        description: benefit.description ?? "",
        conditions: benefit.conditions ?? benefit.regles.join(" · "),
        dateDebut: benefit.dateDebut ?? "",
        dateFin: benefit.dateFin ?? "",
        paliersEligibles: benefit.paliersEligibles,
      });
    } else {
      setForm({ ...empty, partnerIds: [], paliersEligibles: [] });
    }
  }, [open, benefit]);

  const set = <K extends keyof BenefitInput>(key: K, value: BenefitInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const togglePartner = (id: string) =>
    setForm((f) => ({
      ...f,
      partnerIds: f.partnerIds.includes(id)
        ? f.partnerIds.filter((p) => p !== id)
        : [...f.partnerIds, id],
    }));

  const toggleTier = (tier: Tier) =>
    setForm((f) => ({
      ...f,
      paliersEligibles: f.paliersEligibles.includes(tier)
        ? f.paliersEligibles.filter((t) => t !== tier)
        : [...f.paliersEligibles, tier],
    }));

  const invalid =
    form.libelle.trim().length < 3 ||
    form.categorie === "" ||
    form.secteur === "" ||
    form.partnerIds.length === 0 ||
    form.valeur.trim() === "" ||
    form.dateDebut === "" ||
    form.dateFin === "" ||
    form.paliersEligibles.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{benefit ? "Modifier l'avantage" : "Nouvel avantage"}</DialogTitle>
          <DialogDescription>
            Un avantage peut être porté par plusieurs partenaires. Toute création entre au
            catalogue à l'état brouillon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="av-libelle">Nom de l'avantage *</Label>
            <Input
              id="av-libelle"
              value={form.libelle}
              onChange={(e) => set("libelle", e.target.value)}
              placeholder="Ex. -15 % consultations générales"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Catégorie *</Label>
              <Select value={form.categorie} onValueChange={(v) => set("categorie", v)}>
                <SelectTrigger aria-label="Catégorie">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Secteur *</Label>
              <Select value={form.secteur} onValueChange={(v) => set("secteur", v)}>
                <SelectTrigger aria-label="Secteur">
                  <SelectValue placeholder="Choisir" />
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
              <Label htmlFor="av-valeur">Taux ou montant *</Label>
              <Input
                id="av-valeur"
                value={form.valeur}
                onChange={(e) => set("valeur", e.target.value)}
                placeholder="-15 % ou 25 000 FCFA"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="av-debut">Début de validité *</Label>
              <Input
                id="av-debut"
                type="date"
                value={form.dateDebut}
                onChange={(e) => set("dateDebut", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="av-fin">Fin de validité *</Label>
              <Input
                id="av-fin"
                type="date"
                value={form.dateFin}
                onChange={(e) => set("dateFin", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Partenaire(s) associé(s) *</Label>
            <div className="grid gap-2 sm:grid-cols-2 max-h-40 overflow-y-auto rounded-lg border border-border p-2">
              {partners.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer px-1 py-1">
                  <Checkbox
                    checked={form.partnerIds.includes(p.id)}
                    onCheckedChange={() => togglePartner(p.id)}
                  />
                  {p.nom}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Paliers éligibles *</Label>
            <div className="flex flex-wrap gap-3">
              {TIER_ORDER.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.paliersEligibles.includes(t)}
                    onCheckedChange={() => toggleTier(t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="av-desc">Description</Label>
            <Textarea
              id="av-desc"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Description affichée aux porteurs de carte"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="av-cond">Conditions</Label>
            <Textarea
              id="av-cond"
              rows={2}
              value={form.conditions}
              onChange={(e) => set("conditions", e.target.value)}
              placeholder="Ex. sur présentation de la carte Zô, hors urgences"
            />
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
            {benefit ? "Enregistrer" : "Créer l'avantage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
