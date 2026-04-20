import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OCRAuthenticityBadge } from "./OCRAuthenticityBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface OCRScan {
  id: string;
  created_at: string;
  entity_type: string;
  entity_name: string | null;
  document_type: string;
  confidence_score: number;
  authenticity_status: string;
  authenticity_score: number;
  agent_name: string | null;
  review_status: string;
}

interface Props {
  scans: OCRScan[];
  loading: boolean;
  onRowClick: (scan: OCRScan) => void;
}

const docTypeLabel: Record<string, string> = {
  CNI: "CNI",
  PASSEPORT: "Passeport",
  PERMIS: "Permis",
  CARTE_CONSULAIRE: "Carte consulaire",
  CARTE_GRISE: "Carte grise",
  AUTRE: "Autre",
};

const reviewStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  validated: { label: "Validé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

export function OCRScansTable({ scans, loading, onRowClick }: Props) {
  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Chargement…</div>;
  }
  if (scans.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">Aucun scan OCR pour les filtres sélectionnés.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Client / Prospect</TableHead>
            <TableHead>Document</TableHead>
            <TableHead className="text-right">Confiance</TableHead>
            <TableHead>Authenticité</TableHead>
            <TableHead>Révision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scans.map((scan) => {
            const review = reviewStatusConfig[scan.review_status] || reviewStatusConfig.pending;
            return (
              <TableRow key={scan.id} className="cursor-pointer" onClick={() => onRowClick(scan)}>
                <TableCell className="text-sm whitespace-nowrap">
                  {format(new Date(scan.created_at), "dd/MM/yy HH:mm", { locale: fr })}
                </TableCell>
                <TableCell className="text-sm">{scan.agent_name || "—"}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{scan.entity_name || "—"}</div>
                  <div className="text-xs text-muted-foreground capitalize">{scan.entity_type}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{docTypeLabel[scan.document_type] || scan.document_type}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  <span className={
                    scan.confidence_score >= 90 ? "text-green-600" :
                    scan.confidence_score >= 70 ? "text-orange-600" : "text-red-600"
                  }>
                    {Math.round(scan.confidence_score)}%
                  </span>
                </TableCell>
                <TableCell>
                  <OCRAuthenticityBadge status={scan.authenticity_status} score={scan.authenticity_score} />
                </TableCell>
                <TableCell>
                  <Badge variant={review.variant}>{review.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}