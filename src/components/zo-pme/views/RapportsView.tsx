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
import { REPORTS } from "@/data/zoPme";
import { EmptyState, ScopeNote } from "../shared/states";
import { useZoPme } from "../ZoPmeProvider";
import { exportToCSV } from "@/utils/exportCsv";
import { FileBarChart, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";

export function RapportsView({ period }: { period: string }) {
  const { can, pmes, cards, activity } = useZoPme();
  const [frequence, setFrequence] = useState("all");

  const filtered = useMemo(
    () => REPORTS.filter((r) => frequence === "all" || r.frequence === frequence),
    [frequence]
  );

  const frequences = Array.from(new Set(REPORTS.map((r) => r.frequence)));

  const exportPmes = () => {
    exportToCSV(
      pmes.map((p) => ({
        Matricule: p.matricule,
        "Raison sociale": p.raisonSociale,
        Secteur: p.secteur,
        Ville: p.ville,
        "Cycle de vie": p.cycleVie,
        "Score fidélité": p.fidelite.score,
        Palier: p.fidelite.palier,
        Contacts: p.contacts.length,
        "Dernière activité": p.derniereActivite,
      })),
      `zo-pme-membres-${period}`
    );
    toast.success("Export CSV des PME généré");
  };

  const exportCards = () => {
    exportToCSV(
      cards.map((c) => ({
        Référence: c.reference,
        PME: pmes.find((p) => p.id === c.pmeId)?.raisonSociale ?? "",
        Porteur: c.porteur,
        Statut: c.statut,
        Priorité: c.priorite,
        "SLA cible (h)": c.slaCibleHeures,
        "SLA écoulé (h)": c.slaEcouleHeures,
      })),
      `zo-pme-cartes-${period}`
    );
    toast.success("Export CSV des cartes généré");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote tone="backend">
        Les restitutions PDF / Excel officielles sont produites par le moteur de reporting
        back-end. Les exports disponibles ici sont des extractions CSV des données affichées.
      </ScopeNote>

      <Card>
        <CardHeader className="pb-3 flex-row items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-primary" />
              Catalogue de rapports
            </CardTitle>
            <CardDescription>{filtered.length} rapport(s) sur le périmètre</CardDescription>
          </div>
          <Select value={frequence} onValueChange={setFrequence}>
            <SelectTrigger className="h-9 w-[180px]" aria-label="Filtrer par fréquence">
              <SelectValue placeholder="Fréquence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes fréquences</SelectItem>
              {frequences.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState title="Aucun rapport pour cette fréquence" />
          ) : (
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rapport</TableHead>
                    <TableHead className="hidden md:table-cell">Périmètre</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead className="hidden lg:table-cell">Dernière édition</TableHead>
                    <TableHead className="text-right">Formats</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">{r.nom}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {r.perimetre}
                      </TableCell>
                      <TableCell className="text-xs">{r.frequence}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {r.dernierGenere}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {r.formats.map((f) => (
                            <Badge key={f} variant="secondary" className="text-[10px]">
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Extractions disponibles</CardTitle>
          <CardDescription>
            Export CSV immédiat des données actuellement chargées dans le module
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={!can("reports.export")} onClick={exportPmes}>
            <Download className="h-4 w-4 mr-2" />
            Annuaire PME (CSV)
          </Button>
          <Button variant="outline" size="sm" disabled={!can("reports.export")} onClick={exportCards}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Cycle des cartes (CSV)
          </Button>
          {!can("reports.export") && (
            <p className="text-xs text-muted-foreground self-center">
              Votre rôle n'autorise pas la génération d'exports.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Journal d'activité de la session</CardTitle>
          <CardDescription>
            Traçabilité des actions réalisées depuis l'ouverture du module
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <EmptyState
              title="Aucune action enregistrée"
              description="Les changements de statut, décisions et publications apparaîtront ici."
            />
          ) : (
            <ol className="space-y-2 max-h-72 overflow-y-auto">
              {activity.map((a) => (
                <li key={a.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-medium">
                      <span className="font-mono text-xs mr-2">{a.cible}</span>
                      {a.action}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">
                      {a.acteur}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{a.date}</p>
                  {a.motif && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Motif : {a.motif}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
