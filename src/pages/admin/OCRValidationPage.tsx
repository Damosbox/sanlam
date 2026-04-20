import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanSearch, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OCRScansTable } from "@/components/admin/ocr/OCRScansTable";
import { OCRDetailDrawer } from "@/components/admin/ocr/OCRDetailDrawer";
import { toast } from "sonner";

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
    return scans.filter((s) => {
      if (docTypeFilter !== "all" && s.document_type !== docTypeFilter) return false;
      if (authFilter !== "all" && s.authenticity_status !== authFilter) return false;
      if (reviewFilter !== "all" && s.review_status !== reviewFilter) return false;
      if (search && !`${s.entity_name ?? ""} ${s.agent_name ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [scans, search, docTypeFilter, authFilter, reviewFilter]);

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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Rechercher client/agent…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Type document" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous documents</SelectItem>
              <SelectItem value="CNI">CNI</SelectItem>
              <SelectItem value="PASSEPORT">Passeport</SelectItem>
              <SelectItem value="PERMIS">Permis</SelectItem>
              <SelectItem value="CARTE_CONSULAIRE">Carte consulaire</SelectItem>
              <SelectItem value="CARTE_GRISE">Carte grise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={authFilter} onValueChange={setAuthFilter}>
            <SelectTrigger><SelectValue placeholder="Authenticité" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="authentic">Authentique</SelectItem>
              <SelectItem value="suspicious">Suspect</SelectItem>
              <SelectItem value="fake">Falsifié</SelectItem>
              <SelectItem value="unverified">Non vérifié</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reviewFilter} onValueChange={setReviewFilter}>
            <SelectTrigger><SelectValue placeholder="Révision" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="validated">Validé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

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