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
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import {
  CONVENTION_LABELS,
  CONVENTION_STYLES,
  PARTNERS,
  PUBLICATION_LABELS,
  PUBLICATION_STYLES,
} from "@/data/zoPme";
import { EmptyState, ScopeNote } from "../shared/states";
import { TierBadge } from "../shared/badges";
import { useZoPme } from "../ZoPmeProvider";
import { Handshake, Mail, Phone, Search, Store } from "lucide-react";

export function PartenairesView() {
  const navigate = useNavigate();
  const { benefits } = useZoPme();

  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("all");
  const [convention, setConvention] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(PARTNERS.map((p) => p.categorie))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PARTNERS.filter(
      (p) =>
        (q === "" ||
          p.nom.toLowerCase().includes(q) ||
          p.ville.toLowerCase().includes(q) ||
          p.convention.reference.toLowerCase().includes(q)) &&
        (categorie === "all" || p.categorie === categorie) &&
        (convention === "all" || p.convention.statut === convention)
    );
  }, [search, categorie, convention]);

  const selected = PARTNERS.find((p) => p.id === selectedId) ?? null;
  const selectedBenefits = selected
    ? benefits.filter((b) => b.partnerId === selected.id)
    : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote tone="backend">
        Conventions, taux négociés et facturation restent gérés hors plateforme : les statuts
        affichés sont un reflet de suivi, pas la source contractuelle.
      </ScopeNote>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" />
            Partenaires du programme
          </CardTitle>
          <CardDescription>{filtered.length} partenaire(s) affiché(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, ville, référence de convention…"
                className="pl-9 h-9"
                aria-label="Rechercher un partenaire"
              />
            </div>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger className="h-9 w-full sm:w-[180px]" aria-label="Filtrer par catégorie">
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
            <Select value={convention} onValueChange={setConvention}>
              <SelectTrigger className="h-9 w-full sm:w-[180px]" aria-label="Filtrer par convention">
                <SelectValue placeholder="Convention" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes conventions</SelectItem>
                {Object.entries(CONVENTION_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun partenaire trouvé"
              description="Aucun partenaire ne correspond à cette catégorie ou à cet état de convention."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setCategorie("all");
                    setConvention("all");
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              }
            />
          ) : (
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partenaire</TableHead>
                    <TableHead className="hidden md:table-cell">Convention</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead className="hidden lg:table-cell">Usages</TableHead>
                    <TableHead className="hidden lg:table-cell">Volume</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
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
                        <p className="text-sm font-medium">{p.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.categorie} · {p.ville}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        <p className="font-mono">{p.convention.reference}</p>
                        <p className="text-muted-foreground">
                          {p.convention.debut} → {p.convention.fin}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            CONVENTION_STYLES[p.convention.statut]
                          )}
                        >
                          {CONVENTION_LABELS[p.convention.statut]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {p.usagesPeriode}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm font-medium">
                        {formatFCFA(p.volumePeriode)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  {selected.nom}
                </SheetTitle>
                <SheetDescription>
                  {selected.categorie} · {selected.ville} · SLA de traitement{" "}
                  {selected.slaTraitement}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                <div className="rounded-lg border border-border p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      Convention {selected.convention.reference}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        CONVENTION_STYLES[selected.convention.statut]
                      )}
                    >
                      {CONVENTION_LABELS[selected.convention.statut]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Du {selected.convention.debut} au {selected.convention.fin} · remise négociée{" "}
                    {selected.convention.tauxRemise} %
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-1.5">
                  <p className="text-sm font-medium">Contact partenaire</p>
                  <p className="text-xs text-muted-foreground">{selected.contact.nom}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {selected.contact.email}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {selected.contact.telephone}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Usages sur la période</p>
                    <p className="text-xl font-bold">{selected.usagesPeriode}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="text-xl font-bold">{formatFCFA(selected.volumePeriode)}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      Avantages liés ({selectedBenefits.length})
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => navigate("/b2b/zo-pme?vue=avantages")}
                    >
                      Ouvrir le catalogue
                    </Button>
                  </div>
                  {selectedBenefits.length === 0 ? (
                    <EmptyState title="Aucun avantage rattaché à ce partenaire" />
                  ) : (
                    <ul className="space-y-2">
                      {selectedBenefits.map((b) => (
                        <li key={b.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-sm font-medium">{b.libelle}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                PUBLICATION_STYLES[b.publication]
                              )}
                            >
                              {PUBLICATION_LABELS[b.publication]}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {b.paliersEligibles.map((t) => (
                              <TierBadge key={t} tier={t} />
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
