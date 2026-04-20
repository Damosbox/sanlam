import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, TrendingUp, Clock, CheckCircle2, Download, Search, Calendar } from "lucide-react";
import { exportToCSV } from "@/utils/exportCsv";
import { formatFCFA as formatCurrency } from "@/utils/formatCurrency";

interface Commission {
  id: string;
  policy_number: string;
  client_name: string;
  product: string;
  premium: number;
  rate: number;
  amount: number;
  status: "pending" | "validated" | "paid";
  earned_date: string;
  payment_date?: string;
}

const MOCK_COMMISSIONS: Commission[] = [
  { id: "C-2025-0142", policy_number: "POL-AUTO-2025-1042", client_name: "Konan Aya", product: "Auto Tous Risques", premium: 480000, rate: 0.12, amount: 57600, status: "paid", earned_date: "2025-03-15", payment_date: "2025-04-05" },
  { id: "C-2025-0143", policy_number: "POL-VIE-2025-0218", client_name: "Diabaté Moussa", product: "Pack Obsèques", premium: 120000, rate: 0.15, amount: 18000, status: "paid", earned_date: "2025-03-20", payment_date: "2025-04-05" },
  { id: "C-2025-0144", policy_number: "POL-AUTO-2025-1056", client_name: "Bamba Fatou", product: "Auto Tiers Simple", premium: 180000, rate: 0.10, amount: 18000, status: "validated", earned_date: "2025-04-02" },
  { id: "C-2025-0145", policy_number: "POL-AUTO-2025-1067", client_name: "Yao Kouadio", product: "Auto Tiers Complet", premium: 320000, rate: 0.11, amount: 35200, status: "validated", earned_date: "2025-04-08" },
  { id: "C-2025-0146", policy_number: "POL-VIE-2025-0224", client_name: "N'Guessan Marie", product: "Pack Obsèques Premium", premium: 240000, rate: 0.15, amount: 36000, status: "pending", earned_date: "2025-04-15" },
  { id: "C-2025-0147", policy_number: "POL-AUTO-2025-1089", client_name: "Touré Issouf", product: "Auto Tous Risques", premium: 540000, rate: 0.12, amount: 64800, status: "pending", earned_date: "2025-04-18" },
];

const STATUS_CONFIG = {
  pending: { label: "En attente", className: "bg-amber-500/10 text-amber-700 border-amber-200" },
  validated: { label: "Validée", className: "bg-blue-500/10 text-blue-700 border-blue-200" },
  paid: { label: "Payée", className: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
};

export default function CommissionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return MOCK_COMMISSIONS.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (productFilter !== "all" && !c.product.toLowerCase().includes(productFilter.toLowerCase())) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.client_name.toLowerCase().includes(q) || c.policy_number.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, statusFilter, productFilter]);

  const totals = useMemo(() => {
    const paid = MOCK_COMMISSIONS.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
    const pending = MOCK_COMMISSIONS.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0);
    const validated = MOCK_COMMISSIONS.filter((c) => c.status === "validated").reduce((s, c) => s + c.amount, 0);
    const total = paid + pending + validated;
    return { paid, pending, validated, total, balance: validated + pending };
  }, []);

  const handleExport = () => {
    const rows = filtered.map((c) => ({
      "N° Commission": c.id,
      "N° Police": c.policy_number,
      "Client": c.client_name,
      "Produit": c.product,
      "Prime (FCFA)": c.premium,
      "Taux": `${(c.rate * 100).toFixed(1)}%`,
      "Montant (FCFA)": c.amount,
      "Statut": STATUS_CONFIG[c.status].label,
      "Date acquisition": c.earned_date,
      "Date paiement": c.payment_date ?? "—",
    }));
    exportToCSV(rows, `commissions_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wallet className="h-7 w-7 text-primary" />
            Mes Commissions
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivi détaillé de vos commissions par police, produit et période
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Payées
            </CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{formatCurrency(totals.paid)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Validées (à payer)
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">{formatCurrency(totals.validated)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600">{formatCurrency(totals.pending)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Solde courant
            </CardDescription>
            <CardTitle className="text-2xl text-primary">{formatCurrency(totals.balance)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des commissions</CardTitle>
          <CardDescription>
            {filtered.length} ligne(s) — Total filtré : {formatCurrency(filtered.reduce((s, c) => s + c.amount, 0))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Client ou n° police..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="validated">Validées</SelectItem>
                <SelectItem value="paid">Payées</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Produit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous produits</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="obsèques">Pack Obsèques</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commission</TableHead>
                  <TableHead>Police / Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Prime</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Acquise le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{c.client_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{c.policy_number}</div>
                    </TableCell>
                    <TableCell className="text-sm">{c.product}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(c.premium)}</TableCell>
                    <TableCell className="text-right text-sm">{(c.rate * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(c.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_CONFIG[c.status].className}>
                        {STATUS_CONFIG[c.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {c.earned_date}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      Aucune commission ne correspond aux filtres
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}