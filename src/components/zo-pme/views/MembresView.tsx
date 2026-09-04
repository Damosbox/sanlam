import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { usePagination } from "@/hooks/usePagination";
import { formatFCFA } from "@/utils/formatCurrency";
import {
  CARD_STATUS_LABELS,
  TIER_ORDER,
  TIER_RANGES,
  type PmeLifecycle,
  type Tier,
} from "@/data/zoPme";
import { LIFECYCLE_LABELS, LIFECYCLE_TRANSITIONS } from "@/data/zoPme/members";
import { KpiCard } from "../shared/KpiCard";
import { CardStatusBadge, LifecycleBadge, TierBadge } from "../shared/badges";
import { EmptyState, ScopeNote } from "../shared/states";
import { ConfirmActionDialog } from "../shared/ConfirmActionDialog";
import { useZoPme } from "../ZoPmeProvider";
import {
  Building2,
  CreditCard,
  FileWarning,
  Mail,
  Phone,
  Search,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export function MembresView() {
  const navigate = useNavigate();
  const { pmes, cards, can, setPmeLifecycle } = useZoPme();

  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [lifecycle, setLifecycle] = useState("all");
  const [cardFilter, setCardFilter] = useState("all");
  const [sort, setSort] = useState("score_desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transition, setTransition] = useState<PmeLifecycle | null>(null);

  const cardsByPme = useMemo(() => {
    const map = new Map<string, typeof cards>();
    cards.forEach((c) => {
      map.set(c.pmeId, [...(map.get(c.pmeId) ?? []), c]);
    });
    return map;
  }, [cards]);

  const hasActiveCard = (pmeId: string) =>
    (cardsByPme.get(pmeId) ?? []).some((c) => c.statut === "activee");
  const hasPendingCard = (pmeId: string) =>
    (cardsByPme.get(pmeId) ?? []).some(
      (c) => c.statut !== "activee" && c.statut !== "bloquee"
    );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = pmes.filter((p) => {
      const matchesSearch =
        q === "" ||
        p.raisonSociale.toLowerCase().includes(q) ||
        p.matricule.toLowerCase().includes(q) ||
        p.ville.toLowerCase().includes(q) ||
        p.contacts.some((c) => c.nom.toLowerCase().includes(q));
      const matchesTier = tier === "all" || p.fidelite.palier === tier;
      const matchesLifecycle = lifecycle === "all" || p.cycleVie === lifecycle;
      const matchesCard =
        cardFilter === "all" ||
        (cardFilter === "active" && hasActiveCard(p.id)) ||
        (cardFilter === "en_cours" && !hasActiveCard(p.id) && hasPendingCard(p.id)) ||
        (cardFilter === "aucune" && (cardsByPme.get(p.id) ?? []).length === 0);
      return matchesSearch && matchesTier && matchesLifecycle && matchesCard;
    });

    return [...list].sort((a, b) => {
      switch (sort) {
        case "score_asc":
          return a.fidelite.score - b.fidelite.score;
        case "nom":
          return a.raisonSociale.localeCompare(b.raisonSociale, "fr");
        case "recents":
          return b.adhesionLe.localeCompare(a.adhesionLe);
        default:
          return b.fidelite.score - a.fidelite.score;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pmes, cardsByPme, search, tier, lifecycle, cardFilter, sort]);

  const pagination = usePagination(filtered, { storageKey: "zo-pme-membres" });

  const kpis = useMemo(() => {
    const actives = pmes.filter((p) => p.cycleVie === "actif").length;
    const aCompleter = pmes.filter(
      (p) => p.cycleVie === "adhesion_en_cours" || !p.conformiteComplete
    ).length;
    const nouveaux = pmes.filter((p) => p.adhesionLe.includes("/08/2026") || p.adhesionLe.includes("/09/2026")).length;
    const sansCarte = pmes.filter((p) => !hasActiveCard(p.id)).length;
    return { actives, aCompleter, nouveaux, sansCarte };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pmes, cardsByPme]);

  const selected = pmes.find((p) => p.id === selectedId) ?? null;
  const selectedCards = selected ? cardsByPme.get(selected.id) ?? [] : [];
  const allowedTransitions = selected ? LIFECYCLE_TRANSITIONS[selected.cycleVie] : [];

  const resetFilters = () => {
    setSearch("");
    setTier("all");
    setLifecycle("all");
    setCardFilter("all");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        Un membre est une PME identifiée par son matricule. Les personnes (dont le directeur) sont
        des contacts rattachés à la PME.
      </ScopeNote>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard label="PME actives" value={String(kpis.actives)} icon={Building2} />
        <KpiCard label="Adhésions à compléter" value={String(kpis.aCompleter)} icon={FileWarning} />
        <KpiCard label="Nouvelles PME (période)" value={String(kpis.nouveaux)} icon={Sparkles} />
        <KpiCard label="PME sans carte active" value={String(kpis.sansCarte)} icon={CreditCard} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Annuaire des PME
          </CardTitle>
          <CardDescription>
            {filtered.length} PME sur {pmes.length} · fidélité affichée en score /100 et palier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Raison sociale, matricule, ville, contact…"
                className="pl-9 h-9"
                aria-label="Rechercher une PME"
              />
            </div>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="h-9 w-full sm:w-[150px]" aria-label="Filtrer par palier">
                <SelectValue placeholder="Palier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les paliers</SelectItem>
                {TIER_ORDER.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t} ({TIER_RANGES[t]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={lifecycle} onValueChange={setLifecycle}>
              <SelectTrigger className="h-9 w-full sm:w-[180px]" aria-label="Filtrer par cycle de vie">
                <SelectValue placeholder="Cycle de vie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(LIFECYCLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cardFilter} onValueChange={setCardFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[160px]" aria-label="Filtrer par carte">
                <SelectValue placeholder="Carte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les cartes</SelectItem>
                <SelectItem value="active">Carte active</SelectItem>
                <SelectItem value="en_cours">Carte en cours</SelectItem>
                <SelectItem value="aucune">Aucune carte</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-full sm:w-[170px]" aria-label="Trier">
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score_desc">Score décroissant</SelectItem>
                <SelectItem value="score_asc">Score croissant</SelectItem>
                <SelectItem value="nom">Raison sociale A–Z</SelectItem>
                <SelectItem value="recents">Adhésions récentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucune PME ne correspond à ces filtres"
              description="Élargissez la recherche ou réinitialisez les filtres pour retrouver l'annuaire complet."
              action={
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              }
            />
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PME</TableHead>
                      <TableHead className="hidden md:table-cell">Matricule</TableHead>
                      <TableHead>Fidélité</TableHead>
                      <TableHead>Cycle de vie</TableHead>
                      <TableHead className="hidden lg:table-cell">Cartes</TableHead>
                      <TableHead className="hidden lg:table-cell">Dernière activité</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.pageItems.map((p) => {
                      const pmeCards = cardsByPme.get(p.id) ?? [];
                      return (
                        <TableRow
                          key={p.id}
                          tabIndex={0}
                          className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setSelectedId(p.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedId(p.id);
                            }
                          }}
                        >
                          <TableCell>
                            <p className="text-sm font-medium">{p.raisonSociale}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.secteur} · {p.ville}
                            </p>
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-xs">
                            {p.matricule}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                {p.fidelite.score}/100
                              </span>
                              <TierBadge tier={p.fidelite.palier} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <LifecycleBadge status={p.cycleVie} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {pmeCards.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Aucune</span>
                            ) : (
                              <Badge variant="secondary">{pmeCards.length}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {p.derniereActivite}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(p.id);
                              }}
                            >
                              Ouvrir la fiche
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                setPage={pagination.setPage}
                setPageSize={pagination.setPageSize}
                itemLabel="PME"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {selected.raisonSociale}
                </SheetTitle>
                <SheetDescription>
                  Matricule {selected.matricule} · {selected.secteur} · {selected.ville} ·{" "}
                  {selected.effectif} salariés
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <LifecycleBadge status={selected.cycleVie} />
                  <TierBadge tier={selected.fidelite.palier} />
                  <Badge variant="secondary">Adhésion {selected.adhesionLe}</Badge>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-sm font-medium">Fidélité</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{selected.fidelite.score}/100</span>
                    <TierBadge tier={selected.fidelite.palier} />
                  </div>
                  <Progress value={Math.max(0, selected.fidelite.score)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {selected.fidelite.pointsPeriode} points sur la période · palier depuis le{" "}
                    {selected.fidelite.depuis}
                  </p>
                </div>

                <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
                  <p className="text-sm font-medium">Segmentation RFM</p>
                  <p className="text-xs text-muted-foreground">
                    Indicateur analytique distinct de la fidélité. Segment indicatif :{" "}
                    <span className="font-medium">{selected.rfm.segment}</span> (R{" "}
                    {selected.rfm.recence} j · F {selected.rfm.frequence} ·{" "}
                    {formatFCFA(selected.rfm.montant)}).
                  </p>
                  <ScopeNote tone="backend">
                    Valeurs non contractuelles : le calcul RFM dépend de la future table
                    d'activations / transactions côté back-end.
                  </ScopeNote>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">
                    Contacts rattachés ({selected.contacts.length})
                  </p>
                  <ul className="space-y-2">
                    {selected.contacts.map((c) => (
                      <li key={c.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{c.nom}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {c.fonction}
                          </Badge>
                          {c.principal && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Contact principal
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                          <p className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3" /> {c.email}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" /> {c.telephone}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Cartes rattachées</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => navigate("/b2b/zo-pme?vue=cartes")}
                    >
                      Ouvrir le cycle des cartes
                    </Button>
                  </div>
                  {selectedCards.length === 0 ? (
                    <EmptyState
                      title="Aucune carte rattachée"
                      description="La demande de carte est initiée depuis le dossier de souscription."
                    />
                  ) : (
                    <ul className="space-y-2">
                      {selectedCards.map((c) => (
                        <li
                          key={c.reference}
                          className="flex items-center justify-between rounded-lg border border-border p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium font-mono">{c.reference}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {c.porteur} · demandée le {c.demandeeLe}
                            </p>
                          </div>
                          <CardStatusBadge status={c.statut} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Cycle de vie</p>
                  {!can("members.update") ? (
                    <ScopeNote>
                      Votre rôle est en lecture seule sur le cycle de vie des PME. Seule la
                      Souscription (ou l'Admin Zô PME) peut le modifier.
                    </ScopeNote>
                  ) : allowedTransitions.length === 0 ? (
                    <ScopeNote>
                      Statut terminal : aucune transition n'est possible depuis «{" "}
                      {LIFECYCLE_LABELS[selected.cycleVie]} ».
                    </ScopeNote>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allowedTransitions.map((t) => (
                        <Button
                          key={t}
                          variant="outline"
                          size="sm"
                          onClick={() => setTransition(t)}
                        >
                          Passer à {LIFECYCLE_LABELS[t]}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        open={!!transition}
        onOpenChange={(o) => !o && setTransition(null)}
        title="Modifier le cycle de vie"
        description={
          selected && transition
            ? `${selected.raisonSociale} passera au statut « ${LIFECYCLE_LABELS[transition]} ». L'action est consignée au journal d'activité.`
            : ""
        }
        confirmLabel="Appliquer"
        reason="required"
        reasonLabel="Motif de la décision"
        onConfirm={(motif) => {
          if (selected && transition) {
            setPmeLifecycle(selected.id, transition, motif);
            toast.success(
              `${selected.raisonSociale} — statut ${LIFECYCLE_LABELS[transition]}`
            );
          }
          setTransition(null);
        }}
      />
    </div>
  );
}
