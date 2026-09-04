import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  PUBLICATION_LABELS,
  PUBLICATION_RULES,
  PUBLICATION_STYLES,
  PUBLICATION_TRANSITIONS,
  TIER_ORDER,
  type Benefit,
  type PublicationStatus,
} from "@/data/zoPme";
import { TierBadge } from "../shared/badges";
import { EmptyState, ScopeNote } from "../shared/states";
import { ConfirmActionDialog } from "../shared/ConfirmActionDialog";
import { BenefitFormDialog } from "../dialogs/BenefitFormDialog";
import { useZoPme } from "../ZoPmeProvider";
import { Gift, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AvantagesView() {
  const {
    benefits,
    partners,
    can,
    setBenefitPublication,
    createBenefit,
    updateBenefit,
    retireBenefit,
  } = useZoPme();

  const [search, setSearch] = useState("");
  const [partner, setPartner] = useState("all");
  const [categorie, setCategorie] = useState("all");
  const [tier, setTier] = useState("all");
  const [publication, setPublication] = useState("all");
  const [pending, setPending] = useState<{ id: string; next: PublicationStatus } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Benefit | null>(null);
  const [retiring, setRetiring] = useState<Benefit | null>(null);
  const canManage = can("benefits.manage");

  const categories = useMemo(
    () => Array.from(new Set(benefits.map((b) => b.categorie))).sort(),
    [benefits]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return benefits.filter(
      (b) =>
        (q === "" || b.libelle.toLowerCase().includes(q)) &&
        (partner === "all" ||
          b.partnerId === partner ||
          (b.partnerIds ?? []).includes(partner)) &&
        (categorie === "all" || b.categorie === categorie) &&
        (tier === "all" || b.paliersEligibles.includes(tier as never)) &&
        (publication === "all" || b.publication === publication)
    );
  }, [benefits, search, partner, categorie, tier, publication]);

  const pendingBenefit = benefits.find((b) => b.id === pending?.id) ?? null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ScopeNote>
          Catalogue des avantages et règles d'éligibilité par palier. La publication suit le
          circuit brouillon → à valider → publié, avec suspension possible.
        </ScopeNote>
        {canManage && (
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvel avantage
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Règles de publication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {PUBLICATION_RULES.map((rule) => (
              <li key={rule} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-primary">•</span>
                {rule}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            Catalogue d'avantages
          </CardTitle>
          <CardDescription>{filtered.length} offre(s) affichée(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un avantage…"
                className="pl-9 h-9"
                aria-label="Rechercher un avantage"
              />
            </div>
            <Select value={partner} onValueChange={setPartner}>
              <SelectTrigger className="h-9 w-full sm:w-[190px]" aria-label="Filtrer par partenaire">
                <SelectValue placeholder="Partenaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les partenaires</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger className="h-9 w-full sm:w-[170px]" aria-label="Filtrer par catégorie">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="h-9 w-full sm:w-[150px]" aria-label="Filtrer par palier">
                <SelectValue placeholder="Palier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les paliers</SelectItem>
                {TIER_ORDER.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={publication} onValueChange={setPublication}>
              <SelectTrigger className="h-9 w-full sm:w-[160px]" aria-label="Filtrer par publication">
                <SelectValue placeholder="Publication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les états</SelectItem>
                {Object.entries(PUBLICATION_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun avantage ne correspond aux filtres"
              description="Modifiez le partenaire, la catégorie, le palier ou l'état de publication."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setPartner("all");
                    setCategorie("all");
                    setTier("all");
                    setPublication("all");
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((b) => {
                const linked = (b.partnerIds ?? [b.partnerId])
                  .map((id) => partners.find((x) => x.id === id))
                  .filter(Boolean);
                const p = linked[0];
                const transitions = can("benefits.publish")
                  ? PUBLICATION_TRANSITIONS[b.publication]
                  : [];
                const conventionBlocked = p?.convention.statut === "expiree";
                return (
                  <div key={b.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{b.libelle}</p>
                        <p className="text-xs text-muted-foreground">
                          {linked.map((x) => x!.nom).join(", ") || "Partenaire à rattacher"} ·{" "}
                          {b.categorie}
                          {b.secteur ? ` · ${b.secteur}` : ""} · {b.valeur}
                        </p>
                        {(b.dateDebut || b.dateFin) && (
                          <p className="text-xs text-muted-foreground">
                            Validité {b.dateDebut || "—"} → {b.dateFin || "—"}
                          </p>
                        )}
                        {b.description && (
                          <p className="text-xs text-muted-foreground mt-1">{b.description}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", PUBLICATION_STYLES[b.publication])}
                      >
                        {PUBLICATION_LABELS[b.publication]}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground mr-1">Éligibilité :</span>
                      {b.paliersEligibles.map((t) => (
                        <TierBadge key={t} tier={t} />
                      ))}
                    </div>

                    <ul className="space-y-1">
                      {b.regles.map((r) => (
                        <li key={r} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary">•</span>
                          {r}
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {b.usagesPeriode} usages sur la période
                        </Badge>
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              aria-label={`Modifier ${b.libelle}`}
                              onClick={() => {
                                setEditing(b);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-destructive hover:text-destructive"
                              aria-label={`Retirer ${b.libelle}`}
                              onClick={() => setRetiring(b)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {transitions.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {can("benefits.publish")
                              ? "Aucune transition disponible"
                              : "Lecture seule"}
                          </span>
                        ) : (
                          transitions.map((t) => (
                            <Button
                              key={t}
                              variant="outline"
                              size="sm"
                              disabled={t === "publie" && conventionBlocked}
                              title={
                                t === "publie" && conventionBlocked
                                  ? "Convention partenaire expirée : publication impossible"
                                  : undefined
                              }
                              onClick={() => setPending({ id: b.id, next: t })}
                            >
                              {PUBLICATION_LABELS[t]}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>

                    {conventionBlocked && (
                      <p className="text-xs text-destructive">
                        Convention {p?.convention.reference} expirée : l'offre reste dépubliée.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <BenefitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        partners={partners}
        benefit={editing}
        onSubmit={(input) => {
          if (editing) {
            updateBenefit(editing.id, input);
            toast.success(`Avantage « ${input.libelle} » mis à jour`);
          } else {
            createBenefit(input);
            toast.success(`Avantage « ${input.libelle} » créé en brouillon`);
          }
        }}
      />

      <ConfirmActionDialog
        open={!!retiring}
        onOpenChange={(o) => !o && setRetiring(null)}
        title="Retirer l'avantage du catalogue"
        description={
          retiring
            ? `« ${retiring.libelle} » sera retiré du catalogue et ne sera plus proposé aux porteurs. L'action est consignée au journal.`
            : ""
        }
        confirmLabel="Retirer l'avantage"
        destructive
        reason="required"
        reasonLabel="Motif du retrait"
        onConfirm={(motif) => {
          if (retiring && motif) {
            retireBenefit(retiring.id, motif);
            toast.success(`« ${retiring.libelle} » retiré du catalogue`);
          }
          setRetiring(null);
        }}
      />

      <ConfirmActionDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title="Modifier l'état de publication"
        description={
          pendingBenefit && pending
            ? `« ${pendingBenefit.libelle} » passera à l'état « ${PUBLICATION_LABELS[pending.next]} ».`
            : ""
        }
        confirmLabel="Appliquer"
        reason={pending?.next === "suspendu" ? "required" : "optional"}
        reasonLabel="Motif"
        destructive={pending?.next === "suspendu"}
        onConfirm={(motif) => {
          if (pending) {
            setBenefitPublication(pending.id, pending.next, motif);
            toast.success(`Avantage ${PUBLICATION_LABELS[pending.next].toLowerCase()}`);
          }
          setPending(null);
        }}
      />
    </div>
  );
}
