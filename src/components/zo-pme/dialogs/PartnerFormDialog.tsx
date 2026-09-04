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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEVERITY_LABELS } from "@/data/zoPme/direction";
import type { Partner } from "@/data/zoPme";
import { ScopeNote } from "../shared/states";
import type { PartnerInput } from "../ZoPmeProvider";

const TYPES = ["Enseigne", "Prestataire de service", "Institutionnel", "Distributeur"];
const CATEGORIES = [
  "Santé",
  "Carburant",
  "Grande distribution",
  "Télécom",
  "Automobile",
  "Restauration",
  "Formation",
];
const RISQUES: PartnerInput["risque"][] = ["faible", "moyen", "eleve", "critique"];

const empty: PartnerInput = {
  nom: "",
  type: TYPES[0],
  categorie: "",
  categories: [],
  ville: "",
  responsableInterne: "",
  contact: { nom: "", email: "", telephone: "" },
  contactSupport: { nom: "", email: "", telephone: "" },
  accord: { type: "Convention cadre", debut: "", fin: "", contreparties: "", clauses: "" },
  tauxRemise: 10,
  ciblage: { produits: "", segment: "", zone: "" },
  kpiCible: 0,
  kpiRealise: 0,
  risque: "faible",
  planB: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner | null;
  onSubmit: (input: PartnerInput) => void;
}

export function PartnerFormDialog({ open, onOpenChange, partner, onSubmit }: Props) {
  const [form, setForm] = useState<PartnerInput>(empty);

  useEffect(() => {
    if (!open) return;
    if (partner) {
      setForm({
        nom: partner.nom,
        type: partner.type ?? TYPES[0],
        categorie: partner.categorie,
        categories: partner.categories ?? [partner.categorie],
        ville: partner.ville,
        responsableInterne: partner.responsableInterne ?? "",
        contact: { ...partner.contact },
        contactSupport: partner.contactSupport
          ? { ...partner.contactSupport }
          : { nom: "", email: "", telephone: "" },
        accord: {
          type: partner.accord?.type ?? "Convention cadre",
          debut: partner.convention.debut,
          fin: partner.convention.fin,
          contreparties: partner.accord?.contreparties ?? "",
          clauses: partner.accord?.clauses ?? "",
        },
        tauxRemise: partner.convention.tauxRemise,
        ciblage: partner.ciblage ?? { produits: "", segment: "", zone: "" },
        kpiCible: partner.kpiCible ?? 0,
        kpiRealise: partner.kpiRealise ?? 0,
        risque: partner.risque ?? "faible",
        planB: partner.planB ?? "",
      });
    } else {
      setForm({ ...empty, categories: [] });
    }
  }, [open, partner]);

  const set = <K extends keyof PartnerInput>(key: K, value: PartnerInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const invalid =
    form.nom.trim().length < 2 ||
    form.categorie === "" ||
    form.ville.trim().length < 2 ||
    form.responsableInterne.trim().length < 2 ||
    !form.contact.email.includes("@") ||
    form.accord.debut === "" ||
    form.accord.fin === "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{partner ? "Modifier le partenaire" : "Nouveau partenaire"}</DialogTitle>
          <DialogDescription>
            Informations, accord, ciblage et suivi du risque. Les clauses saisies servent au suivi
            interne ; elles ne remplacent pas le contrat signé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pt-nom">Nom *</Label>
              <Input
                id="pt-nom"
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                placeholder="Ex. Clinique Farah"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger aria-label="Type de partenaire">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie principale *</Label>
              <Select
                value={form.categorie}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    categorie: v,
                    categories: f.categories.includes(v) ? f.categories : [...f.categories, v],
                  }))
                }
              >
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
              <Label htmlFor="pt-ville">Ville *</Label>
              <Input
                id="pt-ville"
                value={form.ville}
                onChange={(e) => set("ville", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pt-resp">Responsable interne Sanlam *</Label>
              <Input
                id="pt-resp"
                value={form.responsableInterne}
                onChange={(e) => set("responsableInterne", e.target.value)}
                placeholder="Ex. R. Aké — Animation réseau"
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Contact principal *</Label>
              <Input
                value={form.contact.nom}
                onChange={(e) => set("contact", { ...form.contact, nom: e.target.value })}
                placeholder="Nom"
                aria-label="Nom du contact principal"
              />
              <Input
                value={form.contact.email}
                onChange={(e) => set("contact", { ...form.contact, email: e.target.value })}
                placeholder="E-mail"
                aria-label="E-mail du contact principal"
              />
              <Input
                value={form.contact.telephone}
                onChange={(e) => set("contact", { ...form.contact, telephone: e.target.value })}
                placeholder="Téléphone"
                aria-label="Téléphone du contact principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Contact support</Label>
              <Input
                value={form.contactSupport.nom}
                onChange={(e) =>
                  set("contactSupport", { ...form.contactSupport, nom: e.target.value })
                }
                placeholder="Nom"
                aria-label="Nom du contact support"
              />
              <Input
                value={form.contactSupport.email}
                onChange={(e) =>
                  set("contactSupport", { ...form.contactSupport, email: e.target.value })
                }
                placeholder="E-mail"
                aria-label="E-mail du contact support"
              />
              <Input
                value={form.contactSupport.telephone}
                onChange={(e) =>
                  set("contactSupport", { ...form.contactSupport, telephone: e.target.value })
                }
                placeholder="Téléphone"
                aria-label="Téléphone du contact support"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Accord</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={form.accord.type}
                onChange={(e) => set("accord", { ...form.accord, type: e.target.value })}
                placeholder="Type d'accord"
                aria-label="Type d'accord"
              />
              <Input
                type="number"
                min={0}
                max={100}
                value={form.tauxRemise}
                onChange={(e) => set("tauxRemise", Number(e.target.value))}
                placeholder="Taux de remise (%)"
                aria-label="Taux de remise"
              />
              <div className="space-y-1.5">
                <Label htmlFor="pt-debut" className="text-xs">
                  Début *
                </Label>
                <Input
                  id="pt-debut"
                  value={form.accord.debut}
                  onChange={(e) => set("accord", { ...form.accord, debut: e.target.value })}
                  placeholder="JJ/MM/AAAA"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pt-fin" className="text-xs">
                  Fin *
                </Label>
                <Input
                  id="pt-fin"
                  value={form.accord.fin}
                  onChange={(e) => set("accord", { ...form.accord, fin: e.target.value })}
                  placeholder="JJ/MM/AAAA"
                />
              </div>
            </div>
            <Textarea
              rows={2}
              value={form.accord.contreparties}
              onChange={(e) => set("accord", { ...form.accord, contreparties: e.target.value })}
              placeholder="Contreparties accordées au partenaire"
              aria-label="Contreparties"
            />
            <Textarea
              rows={2}
              value={form.accord.clauses}
              onChange={(e) => set("accord", { ...form.accord, clauses: e.target.value })}
              placeholder="Clauses de suivi (exclusivité, préavis, reporting…)"
              aria-label="Clauses"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Ciblage</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                value={form.ciblage.produits}
                onChange={(e) => set("ciblage", { ...form.ciblage, produits: e.target.value })}
                placeholder="Produits visés"
                aria-label="Produits visés"
              />
              <Input
                value={form.ciblage.segment}
                onChange={(e) => set("ciblage", { ...form.ciblage, segment: e.target.value })}
                placeholder="Segment"
                aria-label="Segment"
              />
              <Input
                value={form.ciblage.zone}
                onChange={(e) => set("ciblage", { ...form.ciblage, zone: e.target.value })}
                placeholder="Zone géographique"
                aria-label="Zone"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pt-kpi-cible">KPI cible (usages)</Label>
              <Input
                id="pt-kpi-cible"
                type="number"
                min={0}
                value={form.kpiCible}
                onChange={(e) => set("kpiCible", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt-kpi-reel">KPI réalisé (usages)</Label>
              <Input
                id="pt-kpi-reel"
                type="number"
                min={0}
                value={form.kpiRealise}
                onChange={(e) => set("kpiRealise", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Niveau de risque</Label>
              <Select
                value={form.risque}
                onValueChange={(v) => set("risque", v as PartnerInput["risque"])}
              >
                <SelectTrigger aria-label="Niveau de risque">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISQUES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {SEVERITY_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pt-planb">Plan B</Label>
            <Textarea
              id="pt-planb"
              rows={2}
              value={form.planB}
              onChange={(e) => set("planB", e.target.value)}
              placeholder="Solution de repli si le partenaire est indisponible"
            />
          </div>

          <ScopeNote tone="backend">
            Section à valider par le métier : import en masse de partenaires, notifications
            partenaires et facturation des contreparties restent des dépendances back-end. Aucune
            règle contractuelle n'est inventée ici.
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
            {partner ? "Enregistrer" : "Créer le partenaire"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
