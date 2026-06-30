import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanSearch, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OCRScansTable } from "@/components/admin/ocr/OCRScansTable";
import { OCRDetailDrawer } from "@/components/admin/ocr/OCRDetailDrawer";
import { toast } from "sonner";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { exportToCsv, csvDate } from "@/lib/export-csv";

interface OCRScan {
  id: string;
  created_at: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  document_type: string;
  document_image_url: string | null;
  extracted_data: Record<string, unknown>;
  confidence_score: number;
  authenticity_status: string;
  authenticity_score: number;
  authenticity_details: Record<string, unknown>;
  agent_name: string | null;
  review_status: string;
  review_notes: string | null;
}

export default function OCRValidationPage() {
  const [scans, setScans] = useState<OCRScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<OCRScan | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [authFilter, setAuthFilter] = useState<string>("all");
  const [reviewFilter, setReviewFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");

  const fetchScans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ocr_scan_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error(error);
      toast.error("Erreur de chargement des scans OCR");
    } else {
      setScans((data as unknown as OCRScan[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchScans(); }, []);

  const filtered = useMemo(() => {
    const arr = scans.filter((s) => {
      if (docTypeFilter !== "all" && s.document_type !== docTypeFilter) return false;
      if (authFilter !== "all" && s.authenticity_status !== authFilter) return false;
      if (reviewFilter !== "all" && s.review_status !== reviewFilter) return false;
      if (search && !`${s.entity_name ?? ""} ${s.agent_name ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    return [...arr].sort((a, b) => {
      switch (sortBy) {
        case "date_asc": return +new Date(a.created_at) - +new Date(b.created_at);
        case "conf_desc": return b.confidence_score - a.confidence_score;
        case "conf_asc": return a.confidence_score - b.confidence_score;
        case "date_desc":
        default: return +new Date(b.created_at) - +new Date(a.created_at);
      }
    });
  }, [scans, search, docTypeFilter, authFilter, reviewFilter, sortBy]);

  const exportCSV = () => {
    exportToCsv(
      "ocr-scans",
      ["Date", "Agent", "Entité", "Type entité", "Document", "Confiance %", "Authenticité", "Révision"],
      filtered.map((s) => [
        csvDate(s.created_at), s.agent_name ?? "", s.entity_name ?? "",
        s.entity_type, s.document_type, Math.round(s.confidence_score),
        s.authenticity_status, s.review_status,
      ]),
    );
  };

  const kpis = useMemo(() => ({
    total: filtered.length,
    authentic: filtered.filter((s) => s.authenticity_status === "authentic").length,
    suspicious: filtered.filter((s) => s.authenticity_status === "suspicious" || s.authenticity_status === "fake").length,
    pending: filtered.filter((s) => s.review_status === "pending").length,
  }), [filtered]);

  const handleRowClick = (scan: OCRScan) => {
    setSelectedScan(scan);
    setDrawerOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ScanSearch className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Validation OCR</h1>
          <p className="text-sm text-muted-foreground">
            Audit conformité des scans d'identité et cartes grises — authenticité & levée de doute
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total scans</CardTitle>
            <ScanSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Authentiques</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.authentic}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Suspects / Falsifiés</CardTitle>
            <ShieldAlert className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.suspicious}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">À réviser</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{kpis.pending}</div>
          </CardContent>
        </Card>
      </div>

      <DataTableToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Rechercher client / agent..." }}
        filters={[
          {
            id: "doc", label: "Type doc", value: docTypeFilter, onChange: setDocTypeFilter,
            options: [
              { value: "all", label: "Tous documents" },
              { value: "CNI", label: "CNI" },
              { value: "PASSEPORT", label: "Passeport" },
              { value: "PERMIS", label: "Permis" },
              { value: "CARTE_CONSULAIRE", label: "Carte consulaire" },
              { value: "CARTE_GRISE", label: "Carte grise" },
            ],
          },
          {
            id: "auth", label: "Authenticité", value: authFilter, onChange: setAuthFilter,
            options: [
              { value: "all", label: "Toute authenticité" },
              { value: "authentic", label: "Authentique" },
              { value: "suspicious", label: "Suspect" },
              { value: "fake", label: "Falsifié" },
              { value: "unverified", label: "Non vérifié" },
            ],
          },
          {
            id: "review", label: "Statut", value: reviewFilter, onChange: setReviewFilter,
            options: [
              { value: "all", label: "Tout statut" },
              { value: "pending", label: "En attente" },
              { value: "validated", label: "Validé" },
              { value: "rejected", label: "Rejeté" },
            ],
          },
        ]}
        sort={{
          value: sortBy, onChange: setSortBy,
          options: [
            { value: "date_desc", label: "Plus récents" },
            { value: "date_asc", label: "Plus anciens" },
            { value: "conf_desc", label: "Confiance ↓" },
            { value: "conf_asc", label: "Confiance ↑" },
          ],
        }}
        onExport={exportCSV}
      />

      <OCRScansTable scans={filtered} loading={loading} onRowClick={handleRowClick} />

      <OCRDetailDrawer
        scan={selectedScan}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReviewed={fetchScans}
      />
    </div>
  );
}