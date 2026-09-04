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
import { CAMPAIGN_LABELS, TIER_ORDER, type Tier } from "@/data/zoPme";
import { ScopeNote } from "../shared/states";
import type { CampaignInput } from "../ZoPmeProvider";

const empty: CampaignInput = {
  nom: "",
  canal: "WhatsApp",
  objectif: "",
  budget: 0,
  date: "",
  statut: "brouillon",
  ciblePaliers: [],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CampaignInput) => void;
}

export function CampaignFormDialog({ open, onOpenChange, onSubmit }: Props) {
  const [form, setForm] = useState<CampaignInput>(empty);

  useEffect(() => {
    if (open) setForm({ ...empty, ciblePaliers: [] });
  }, [open]);

  const set = <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleTier = (tier: Tier) =>
    setForm((f) => ({
      ...f,
      ciblePaliers: f.ciblePaliers.includes(tier)
        ? f.ciblePaliers.filter((t) => t !== tier)
        : [...f.ciblePaliers, tier],
    }));

  const invalid =
    form.nom.trim().length < 3 ||
    form.objectif.trim().length < 3 ||
    form.date === "" ||
    form.ciblePaliers.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle campagne</DialogTitle>
          <DialogDescription>
            La campagne est ajoutée au plan d'animation. Aucun envoi n'est déclenché depuis ce
            prototype.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cp-nom">Nom de la campagne *</Label>
            <Input
              id="cp-nom"
              value={form.nom}
              onChange={(e) => set("nom", e.target.value)}
              placeholder="Ex. Relance cartes non activées"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type / canal *</Label>
              <Select
                value={form.canal}
                onValueChange={(v) => set("canal", v as CampaignInput["canal"])}
              >
                <SelectTrigger aria-label="Canal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="E-mail">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut initial *</Label>
              <Select
                value={form.statut}
                onValueChange={(v) => set("statut", v as CampaignInput["statut"])}
              >
                <SelectTrigger aria-label="Statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">{CAMPAIGN_LABELS.brouillon}</SelectItem>
                  <SelectItem value="programmee">{CAMPAIGN_LABELS.programmee}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-budget">Budget (FCFA)</Label>
              <Input
                id="cp-budget"
                type="number"
                min={0}
                value={form.budget}
                onChange={(e) => set("budget", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-date">Date de lancement *</Label>
              <Input
                id="cp-date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Paliers ciblés *</Label>
            <div className="flex flex-wrap gap-3">
              {TIER_ORDER.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.ciblePaliers.includes(t)}
                    onCheckedChange={() => toggleTier(t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp-objectif">Objectif *</Label>
            <Textarea
              id="cp-objectif"
              rows={2}
              value={form.objectif}
              onChange={(e) => set("objectif", e.target.value)}
              placeholder="Ex. réactiver les cartes remises non activées sous 15 jours"
            />
          </div>

          <ScopeNote tone="backend">
            Le rattachement production / commissions n'est pas simulé : il dépend du référentiel
            produit à arbitrer (17 produits cités au cadrage contre 7 au référentiel actuel).
          </ScopeNote>
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
            Créer la campagne
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
