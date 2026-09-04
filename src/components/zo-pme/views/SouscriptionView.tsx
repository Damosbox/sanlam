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
import { Separator } from "@/components/ui/separator";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { usePagination } from "@/hooks/usePagination";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import {
  CHECKLIST_LABELS,
  CHECKLIST_STYLES,
  MONTHLY_CONTRACTS,
  STAGE_LABELS,
  STAGE_ORDER,
  STAGE_STYLES,
} from "@/data/zoPme/subscriptions";
import { KpiCard } from "../shared/KpiCard";
import { TierBadge } from "../shared/badges";
import { EmptyState, ScopeNote } from "../shared/states";
import { ConfirmActionDialog } from "../shared/ConfirmActionDialog";
import { useZoPme } from "../ZoPmeProvider";
import {
  CheckCircle2,
  ClipboardList,
  FileWarning,
  History,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export function SouscriptionView() {
  const { files, pmes, can, decideFile } = useZoPme();

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [selectedRef, setSelectedRef] = useState<string | null>(
    files.find((f) => f.etape === "a_controler")?.reference ?? files[0]?.reference ?? null
  );
  const [pending, setPending] = useState<"valider" | "complement" | null>(null);

  const pmeById = useMemo(() => new Map(pmes.map((p) => [p.id, p])), [pmes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      const pme = pmeById.get(f.pmeId);
      return (
        (q === "" ||
          f.reference.toLowerCase().includes(q) ||
          (pme?.raisonSociale.toLowerCase().includes(q) ?? false) ||
          (pme?.matricule.toLowerCase().includes(q) ?? false)) &&
        (stage === "all" || f.etape === stage)
      );
    });
  }, [files, pmeById, search, stage]);

  const pagination = usePagination(filtered, { storageKey: "zo-pme-souscription" });

  const selected = files.find((f) => f.reference === selectedRef) ?? null;
  const selectedPme = selected ? pmeById.get(selected.pmeId) : undefined;

  const blockers = selected
    ? selected.checklist.filter((k) => k.obligatoire && k.statut !== "valide")
    : [];

  const counts = useMemo(
    () =>
      STAGE_ORDER.reduce(
        (acc, s) => ({ ...acc, [s]: files.filter((f) => f.etape === s).length }),
        {} as Record<string, number>
      ),
    [files]
  );

  const maxContracts = Math.max(...MONTHLY_CONTRACTS.map((m) => m.count));

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        Cockpit Souscription : contrôle de conformité en trois étapes. Chaque décision est
        consignée avec son motif au journal du dossier.
      </ScopeNote>

      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        {STAGE_ORDER.map((s) => (
          <KpiCard
            key={s}
            label={STAGE_LABELS[s]}
            value={String(counts[s] ?? 0)}
            icon={s === "a_controler" ? FileWarning : s === "conforme" ? ClipboardList : CheckCircle2}
          />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dossiers de souscription</CardTitle>
          <CardDescription>{filtered.length} dossier(s) affiché(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Référence, PME, matricule…"
                className="pl-9 h-9"
                aria-label="Rechercher un dossier"
              />
            </div>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="h-9 w-full sm:w-[180px]" aria-label="Filtrer par étape">
                <SelectValue placeholder="Étape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les étapes</SelectItem>
                {STAGE_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun dossier pour ces critères"
              description="Modifiez la recherche ou l'étape sélectionnée."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStage("all");
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
                      <TableHead>PME</TableHead>
                      <TableHead>Étape</TableHead>
                      <TableHead className="hidden md:table-cell">Cotisation annuelle</TableHead>
                      <TableHead className="hidden lg:table-cell">Déposé le</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.pageItems.map((f) => {
                      const pme = pmeById.get(f.pmeId);
                      return (
                        <TableRow
                          key={f.reference}
                          tabIndex={0}
                          className={cn(
                            "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selectedRef === f.reference && "bg-muted/50"
                          )}
                          onClick={() => setSelectedRef(f.reference)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedRef(f.reference);
                            }
                          }}
                        >
                          <TableCell className="font-mono text-xs">{f.reference}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{pme?.raisonSociale}</span>
                              {pme && <TierBadge tier={pme.fidelite.palier} />}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                              {pme?.matricule}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] px-1.5 py-0", STAGE_STYLES[f.etape])}
                            >
                              {STAGE_LABELS[f.etape]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {formatFCFA(f.montantAnnuel)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {f.deposeLe}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRef(f.reference);
                              }}
                            >
                              Instruire
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
                itemLabel="dossier"
              />
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Checklist de conformité</CardTitle>
            <CardDescription>
              {selected
                ? `${selected.reference} · ${selectedPme?.raisonSociale}`
                : "Sélectionnez un dossier"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <EmptyState title="Aucun dossier sélectionné" />
            ) : (
              <>
                <ul className="space-y-2">
                  {selected.checklist.map((k) => (
                    <li
                      key={k.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{k.libelle}</p>
                        <p className="text-xs text-muted-foreground">
                          {k.obligatoire ? "Pièce obligatoire" : "Pièce facultative"}
                        </p>
                      </div>
                      <span
                        className={cn("text-xs font-medium shrink-0", CHECKLIST_STYLES[k.statut])}
                      >
                        {CHECKLIST_LABELS[k.statut]}
                      </span>
                    </li>
                  ))}
                </ul>

                {blockers.length > 0 && (
                  <p className="text-xs text-destructive">
                    {blockers.length} pièce(s) obligatoire(s) non validée(s) : la validation est
                    bloquée.
                  </p>
                )}

                <Separator />

                {!can("files.decide") ? (
                  <ScopeNote>
                    Lecture seule : seule la Souscription (ou l'Admin Zô PME) peut valider un
                    dossier ou demander un complément.
                  </ScopeNote>
                ) : selected.etape === "active" ? (
                  <ScopeNote>Dossier déjà activé : aucune décision supplémentaire.</ScopeNote>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={blockers.length > 0}
                      onClick={() => setPending("valider")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {selected.etape === "a_controler"
                        ? "Déclarer conforme"
                        : "Activer l'adhésion"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPending("complement")}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Demander un complément
                    </Button>
                  </div>
                )}

                <ScopeNote tone="backend">
                  Le contrôle automatisé des pièces et la signature électronique restent des
                  dépendances back-end : les états ci-dessus sont saisis manuellement.
                </ScopeNote>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                Journal de décision
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selected || selected.journal.length === 0 ? (
                <EmptyState title="Aucune décision enregistrée" />
              ) : (
                <ol className="space-y-2">
                  {[...selected.journal].reverse().map((j, i) => (
                    <li key={i} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium">{j.action}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {j.acteur}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{j.date}</p>
                      {j.motif && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Motif : {j.motif}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historique mensuel des contrats validés</CardTitle>
              <CardDescription>6 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-32">
                {MONTHLY_CONTRACTS.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{m.count}</span>
                    <div
                      className="w-full rounded-t bg-primary/80 transition-all"
                      style={{ height: `${(m.count / maxContracts) * 100}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{m.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmActionDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title={pending === "valider" ? "Valider le dossier" : "Demander un complément"}
        description={
          selected
            ? pending === "valider"
              ? `Le dossier ${selected.reference} passera à l'étape suivante du circuit de conformité.`
              : `Le dossier ${selected.reference} retourne à l'étape « À contrôler » avec la demande de complément.`
            : ""
        }
        confirmLabel={pending === "valider" ? "Valider" : "Demander"}
        reason="required"
        reasonLabel={pending === "valider" ? "Commentaire de validation" : "Pièces à fournir"}
        onConfirm={(motif) => {
          if (selected && pending) {
            decideFile(selected.reference, pending, motif ?? "");
            toast.success(
              pending === "valider"
                ? `${selected.reference} validé`
                : `Complément demandé pour ${selected.reference}`
            );
          }
          setPending(null);
        }}
      />
    </div>
  );
}
