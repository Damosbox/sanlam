import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, AlertTriangle, CheckCircle2, XCircle, Search, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PeriodFilter, computeDateRange, DateRange } from "@/components/broker/dashboard/PeriodFilter";
import { exportToCSV } from "@/utils/exportCsv";

interface KYCRecord {
  id: string;
  entityId: string;
  entityType: "client" | "prospect";
  name: string;
  identityVerified: boolean;
  identityDocType: string | null;
  isPPE: boolean;
  ppeStatus: string | null;
  amlRiskLevel: string | null;
  amlVerified: boolean;
  screeningBlocked: boolean;
  screeningDate: string | null;
  createdAt: string;
}

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export default function ComplianceDashboardPage() {
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [filterBlocked, setFilterBlocked] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>(computeDateRange("fiscal_year"));

  useEffect(() => { fetchKYCData(); }, [dateRange]);

  const fetchKYCData = async () => {
    setLoading(true);
    try {
      const { data: clientKyc } = await supabase.from("client_kyc_compliance").select("*")
        .gte("created_at", dateRange.from.toISOString()).lte("created_at", dateRange.to.toISOString());

      const { data: leadKyc } = await supabase.from("lead_kyc_compliance").select("*")
        .gte("created_at", dateRange.from.toISOString()).lte("created_at", dateRange.to.toISOString());

      const clientIds = (clientKyc || []).map((k) => k.client_id);
      const { data: clientProfiles } = await supabase.from("profiles").select("id, first_name, last_name")
        .in("id", clientIds.length > 0 ? clientIds : ["00000000-0000-0000-0000-000000000000"]);
      const clientProfileMap = new Map((clientProfiles || []).map((p) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`]));

      const leadIds = (leadKyc || []).map((k) => k.lead_id);
      const { data: leads } = await supabase.from("leads").select("id, first_name, last_name")
        .in("id", leadIds.length > 0 ? leadIds : ["00000000-0000-0000-0000-000000000000"]);
      const leadMap = new Map((leads || []).map((l) => [l.id, `${l.first_name || ""} ${l.last_name || ""}`]));

      const allRecords: KYCRecord[] = [
        ...(clientKyc || []).map((k) => ({
          id: k.id, entityId: k.client_id, entityType: "client" as const,
          name: clientProfileMap.get(k.client_id) || "Inconnu",
          identityVerified: k.identity_verified || false, identityDocType: k.identity_document_type,
          isPPE: k.is_ppe || false, ppeStatus: k.ppe_screening_status,
          amlRiskLevel: k.aml_risk_level, amlVerified: k.aml_verified || false,
          screeningBlocked: k.screening_blocked || false, screeningDate: k.ppe_screening_date,
          createdAt: k.created_at,
        })),
        ...(leadKyc || []).map((k) => ({
          id: k.id, entityId: k.lead_id, entityType: "prospect" as const,
          name: leadMap.get(k.lead_id) || "Inconnu",
          identityVerified: k.identity_verified || false, identityDocType: k.identity_document_type,
          isPPE: k.is_ppe || false, ppeStatus: k.ppe_screening_status,
          amlRiskLevel: k.aml_risk_level, amlVerified: k.aml_verified || false,
          screeningBlocked: k.screening_blocked || false, screeningDate: k.ppe_screening_date,
          createdAt: k.created_at,
        })),
      ];
      setRecords(allRecords);
    } catch (error) { console.error("Error fetching KYC data:", error); } finally { setLoading(false); }
  };

  const filtered = records.filter((r) => {
    if (filterRisk !== "all" && r.amlRiskLevel !== filterRisk) return false;
    if (filterBlocked === "blocked" && !r.screeningBlocked) return false;
    if (filterBlocked === "clear" && r.screeningBlocked) return false;
    if (filterType !== "all" && r.entityType !== filterType) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const blockedCount = records.filter((r) => r.screeningBlocked).length;
  const ppeCount = records.filter((r) => r.isPPE).length;
  const highRiskCount = records.filter((r) => r.amlRiskLevel === "high").length;
  const verifiedCount = records.filter((r) => r.identityVerified).length;

  const handleExport = () => {
    exportToCSV(filtered.map((r) => ({
      Nom: r.name, Type: r.entityType === "client" ? "Client" : "Prospect",
      "Identité vérifiée": r.identityVerified ? "Oui" : "Non", PPE: r.isPPE ? "Oui" : "Non",
      "Risque AML": r.amlRiskLevel || "—", Bloqué: r.screeningBlocked ? "Oui" : "Non",
      "Date screening": r.screeningDate || "—",
    })), "conformite-kyc");
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conformité KYC / AML</h1>
          <p className="text-muted-foreground">Vue consolidée des dossiers de conformité clients et prospects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />CSV</Button>
          <PeriodFilter onPeriodChange={setDateRange} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Dossiers</CardTitle><Shield className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{records.length}</div><p className="text-xs text-muted-foreground">{verifiedCount} identités vérifiées</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">PPE détectés</CardTitle><AlertTriangle className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{ppeCount}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Risque élevé</CardTitle><XCircle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{highRiskCount}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Bloqués</CardTitle><XCircle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{blockedCount}</div></CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher un nom..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-[200px]" /></div>
        <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="client">Clients</SelectItem><SelectItem value="prospect">Prospects</SelectItem></SelectContent></Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Niveau risque" /></SelectTrigger><SelectContent><SelectItem value="all">Tous niveaux</SelectItem><SelectItem value="low">Faible</SelectItem><SelectItem value="medium">Moyen</SelectItem><SelectItem value="high">Élevé</SelectItem></SelectContent></Select>
        <Select value={filterBlocked} onValueChange={setFilterBlocked}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Statut" /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="blocked">Bloqués</SelectItem><SelectItem value="clear">Non bloqués</SelectItem></SelectContent></Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Type</TableHead><TableHead>Identité</TableHead><TableHead>PPE</TableHead><TableHead>Risque AML</TableHead><TableHead>Bloqué</TableHead><TableHead>Date screening</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell><Badge variant={record.entityType === "client" ? "default" : "secondary"}>{record.entityType === "client" ? "Client" : "Prospect"}</Badge></TableCell>
                  <TableCell>{record.identityVerified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell>{record.isPPE ? <Badge variant="destructive" className="text-xs">PPE</Badge> : <span className="text-xs text-muted-foreground">Non</span>}</TableCell>
                  <TableCell>{record.amlRiskLevel ? <Badge className={`text-xs ${RISK_COLORS[record.amlRiskLevel] || ""}`}>{record.amlRiskLevel === "low" ? "Faible" : record.amlRiskLevel === "medium" ? "Moyen" : "Élevé"}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{record.screeningBlocked ? <Badge variant="destructive" className="text-xs">Bloqué</Badge> : <CheckCircle2 className="h-4 w-4 text-green-500" />}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{record.screeningDate ? new Date(record.screeningDate).toLocaleDateString("fr-FR") : "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun dossier trouvé</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
