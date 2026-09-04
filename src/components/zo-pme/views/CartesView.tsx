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
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { usePagination } from "@/hooks/usePagination";
import {
  CARD_STATUS_LABELS,
  CARD_STATUS_ORDER,
  CARD_TRANSITIONS,
  PRIORITY_ORDER,
  isSlaBreached,
  type CardStatus,
  type Priority,
} from "@/data/zoPme";
import { SEVERITY_LABELS } from "@/data/zoPme/direction";
import { KpiCard } from "../shared/KpiCard";
import { CardStatusBadge, SeverityBadge, SlaBadge } from "../shared/badges";
import { EmptyState, ScopeNote } from "../shared/states";
import { ConfirmActionDialog } from "../shared/ConfirmActionDialog";
import { useZoPme } from "../ZoPmeProvider";
import { AlertTriangle, CreditCard, History, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function CartesView() {
  const { cards, pmes, can, moveCard, setCardPriority } = useZoPme();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [slaOnly, setSlaOnly] = useState(false);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<CardStatus | null>(null);

  const pmeById = useMemo(() => new Map(pmes.map((p) => [p.id, p])), [pmes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards
      .filter((c) => {
        const pme = pmeById.get(c.pmeId);
        const matchesSearch =
          q === "" ||
          c.reference.toLowerCase().includes(q) ||
          c.porteur.toLowerCase().includes(q) ||
          (pme?.raisonSociale.toLowerCase().includes(q) ?? false);
        return (
          matchesSearch &&
          (status === "all" || c.statut === status) &&
          (priority === "all" || c.priorite === priority) &&
          (!slaOnly || isSlaBreached(c))
        );
      })
      .sort((a, b) => {
        const breach = Number(isSlaBreached(b)) - Number(isSlaBreached(a));
        if (breach !== 0) return breach;
        return PRIORITY_ORDER.indexOf(a.priorite) - PRIORITY_ORDER.indexOf(b.priorite);
      });
  }, [cards, pmeById, search, status, priority, slaOnly]);

  const pagination = usePagination(filtered, { storageKey: "zo-pme-cartes" });

  const counts = useMemo(() => {
    const map = {} as Record<CardStatus, number>;
    CARD_STATUS_ORDER.forEach((s) => {
      map[s] = cards.filter((c) => c.statut === s).length;
    });
    return map;
  }, [cards]);

  const breaches = cards.filter(isSlaBreached).length;
  const selected = cards.find((c) => c.reference === selectedRef) ?? null;
  const transitions = selected ? CARD_TRANSITIONS[selected.statut] : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        Cycle complet des cartes sur 10 statuts. Le passage d'un statut au suivant respecte les
        transitions autorisées ; la production physique reste une dépendance externe.
      </ScopeNote>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Cartes suivies" value={String(cards.length)} icon={CreditCard} />
        <KpiCard label="Cartes activées" value={String(counts.activee)} icon={ShieldCheck} />
        <KpiCard
          label="SLA dépassés"
          value={String(breaches)}
          trend={breaches > 0 ? "à traiter en priorité" : "aucun dépassement"}
          trendDirection={breaches > 0 ? "down" : "up"}
          icon={AlertTriangle}
        />
        <KpiCard label="Cartes bloquées" value={String(counts.bloquee)} icon={CreditCard} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Répartition sur les 10 statuts</CardTitle>
          <CardDescription>Volume de cartes par étape du cycle</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {CARD_STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(status === s ? "all" : s)}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-pressed={status === s}
            >
              <p className="text-xs text-muted-foreground">{CARD_STATUS_LABELS[s]}</p>
              <p className="text-lg font-bold">{counts[s]}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Suivi des cartes</CardTitle>
          <CardDescription>{filtered.length} carte(s) affichée(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Référence, porteur, PME…"
                className="pl-9 h-9"
                aria-label="Rechercher une carte"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-full sm:w-[180px]" aria-label="Filtrer par statut">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {CARD_STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CARD_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-9 w-full sm:w-[160px]" aria-label="Filtrer par priorité">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                {PRIORITY_ORDER.map((p) => (
                  <SelectItem key={p} value={p}>
                    {SEVERITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={slaOnly ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setSlaOnly((v) => !v)}
              aria-pressed={slaOnly}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              SLA dépassés
            </Button>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucune carte pour ces critères"
              description="Aucune carte ne correspond à la combinaison statut / priorité / SLA sélectionnée."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                    setPriority("all");
                    setSlaOnly(false);
                  }}
                >
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
                      <TableHead>Référence</TableHead>
                      <TableHead>PME / porteur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden md:table-cell">Priorité</TableHead>
                      <TableHead className="hidden md:table-cell">SLA</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.pageItems.map((c) => (
                      <TableRow
                        key={c.reference}
                        tabIndex={0}
                        className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setSelectedRef(c.reference)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedRef(c.reference);
                          }
                        }}
                      >
                        <TableCell className="font-mono text-xs">{c.reference}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">
                            {pmeById.get(c.pmeId)?.raisonSociale ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{c.porteur}</p>
                        </TableCell>
                        <TableCell>
                          <CardStatusBadge status={c.statut} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <SeverityBadge severity={c.priorite} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <SlaBadge card={c} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRef(c.reference);
                            }}
                          >
                            Suivre
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                setPage={pagination.setPage}
                setPageSize={pagination.setPageSize}
                itemLabel="carte"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedRef(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{selected.reference}</SheetTitle>
                <SheetDescription>
                  {pmeById.get(selected.pmeId)?.raisonSociale} · porteur {selected.porteur}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <CardStatusBadge status={selected.statut} />
                  <SeverityBadge severity={selected.priorite} />
                  <SlaBadge card={selected} />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Faire avancer la carte</p>
                  {!can("cards.move") ? (
                    <ScopeNote>
                      Lecture seule : seul le pôle Marketing / Animation (ou l'Admin Zô PME) peut
                      faire évoluer une carte.
                    </ScopeNote>
                  ) : transitions.length === 0 ? (
                    <ScopeNote>Aucune transition disponible depuis ce statut.</ScopeNote>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {transitions.map((t) => (
                        <Button
                          key={t}
                          variant={t === "bloquee" ? "destructive" : "outline"}
                          size="sm"
                          disabled={t === "bloquee" && !can("cards.block")}
                          onClick={() => setPendingMove(t)}
                        >
                          {CARD_STATUS_LABELS[t]}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {can("cards.priority") && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Priorité de traitement</p>
                    <Select
                      value={selected.priorite}
                      onValueChange={(v) => {
                        setCardPriority(selected.reference, v as Priority);
                        toast.success(`Priorité mise à jour : ${SEVERITY_LABELS[v as Priority]}`);
                      }}
                    >
                      <SelectTrigger className="h-9" aria-label="Modifier la priorité">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_ORDER.map((p) => (
                          <SelectItem key={p} value={p}>
                            {SEVERITY_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Historique de la carte
                  </p>
                  <ol className="space-y-2">
                    {[...selected.historique].reverse().map((h, i) => (
                      <li key={i} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-medium">{h.action}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            {h.acteur}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{h.date}</p>
                        {h.motif && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Motif : {h.motif}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>

                <ScopeNote tone="backend">
                  Impression, transporteur et dates réelles de remise dépendent du prestataire de
                  production : les jalons ci-dessus reflètent le suivi interne uniquement.
                </ScopeNote>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        open={!!pendingMove}
        onOpenChange={(o) => !o && setPendingMove(null)}
        title={
          pendingMove === "bloquee" ? "Bloquer la carte" : "Confirmer le changement de statut"
        }
        description={
          selected && pendingMove
            ? `La carte ${selected.reference} passera au statut « ${CARD_STATUS_LABELS[pendingMove]} ». Le SLA repart à zéro.`
            : ""
        }
        destructive={pendingMove === "bloquee"}
        confirmLabel={pendingMove === "bloquee" ? "Bloquer" : "Confirmer"}
        reason={pendingMove === "bloquee" ? "required" : "optional"}
        reasonLabel="Motif"
        onConfirm={(motif) => {
          if (selected && pendingMove) {
            moveCard(selected.reference, pendingMove, motif);
            toast.success(
              `${selected.reference} → ${CARD_STATUS_LABELS[pendingMove]}`
            );
          }
          setPendingMove(null);
        }}
      />
    </div>
  );
}
