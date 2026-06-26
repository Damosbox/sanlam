import { useMemo, useState } from "react";
import { Users, Search, Download, UserCheck, UserX, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAdminClients, type AdminClientRow, type AdminClientStatus } from "@/hooks/useAdminClients";
import { ClientDetailSheet } from "@/components/clients/ClientDetailSheet";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

const STATUS_LABEL: Record<AdminClientStatus, { label: string; className: string }> = {
  active: { label: "Client Sanlam", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  user: { label: "Utilisateur", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  no_account: { label: "Client sans compte", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
};

export default function ClientsPage() {
  const { data: rows = [], isLoading } = useAdminClients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brokerFilter, setBrokerFilter] = useState<string>("all");

  const [selectedClient, setSelectedClient] = useState<AdminClientRow | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);

  const brokers = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.broker_id) map.set(r.broker_id, r.broker_name || r.broker_id);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all") {
        if (statusFilter === "with" && r.status === "no_account") return false;
        if (statusFilter === "without" && r.status !== "no_account") return false;
        if (statusFilter === "no_broker" && r.broker_id) return false;
      }
      if (brokerFilter !== "all" && r.broker_id !== brokerFilter) return false;
      if (!q) return true;
      return (
        (r.display_name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q) ||
        (r.first_name || "").toLowerCase().includes(q) ||
        (r.last_name || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter, brokerFilter]);

  const { pageItems: paged, page, setPage, pageSize, setPageSize, totalItems } = usePagination(
    filtered,
    { storageKey: "admin-clients" },
  );

  const counts = useMemo(() => ({
    total: rows.length,
    withAccount: rows.filter((r) => r.status !== "no_account").length,
    withoutAccount: rows.filter((r) => r.status === "no_account").length,
    noBroker: rows.filter((r) => !r.broker_id).length,
  }), [rows]);

  const handleRowClick = (row: AdminClientRow) => {
    setSelectedClient(row);
    if (row.source === "lead") setLeadOpen(true);
    else setClientOpen(true);
  };

  const handleExport = () => {
    const headers = ["Prénom", "Nom", "Email", "Téléphone", "Statut", "Agent", "Polices", "Sinistres", "Créé le"];
    const lines = filtered.map((r) => [
      r.first_name ?? "",
      r.last_name ?? "",
      r.email ?? "",
      r.phone ?? "",
      STATUS_LABEL[r.status].label,
      r.broker_name ?? "",
      r.policies_count,
      r.claims_count,
      format(new Date(r.created_at), "yyyy-MM-dd"),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-sanlam-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fetch lead row for detail sheet on demand
  const { data: selectedLead } = useQuery({
    queryKey: ["admin-clients-lead", selectedClient?.source === "lead" ? selectedClient.id : null],
    queryFn: async () => {
      if (!selectedClient || selectedClient.source !== "lead") return null;
      const { data } = await supabase.from("leads").select("*").eq("id", selectedClient.id).maybeSingle();
      return data;
    },
    enabled: !!selectedClient && selectedClient.source === "lead" && leadOpen,
  });

  const sheetClient = selectedClient && selectedClient.source === "profile" ? {
    id: selectedClient.id,
    display_name: selectedClient.display_name,
    email: selectedClient.email,
    phone: selectedClient.phone,
    claimsCount: selectedClient.claims_count,
    subscriptionsCount: selectedClient.policies_count,
    lastClaimDate: null,
    type: (selectedClient.status === "active" ? "active" : "pending") as "active" | "pending",
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> Clients Sanlam
          </h1>
          <p className="text-muted-foreground">
            Vue unifiée de l'ensemble des clients, qu'ils disposent d'un compte ou non.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" /> Exporter CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Total clients" value={counts.total} />
        <KpiCard icon={UserCheck} label="Avec compte" value={counts.withAccount} accent="text-emerald-600" />
        <KpiCard icon={UserPlus} label="Sans compte" value={counts.withoutAccount} accent="text-amber-600" />
        <KpiCard icon={UserX} label="Sans agent" value={counts.noBroker} accent="text-red-600" />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (nom, email, téléphone)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="with">Avec compte</SelectItem>
                <SelectItem value="without">Sans compte</SelectItem>
                <SelectItem value="no_broker">Sans agent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={brokerFilter} onValueChange={setBrokerFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Agent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les agents</SelectItem>
                {brokers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Agent rattaché</TableHead>
                  <TableHead className="text-center">Polices</TableHead>
                  <TableHead className="text-center">Sinistres</TableHead>
                  <TableHead className="hidden lg:table-cell">Créé le</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Chargement...</TableCell></TableRow>
                ) : paged.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Aucun client trouvé.</TableCell></TableRow>
                ) : paged.map((r) => {
                  const conf = STATUS_LABEL[r.status];
                  const name = r.display_name || [r.first_name, r.last_name].filter(Boolean).join(" ") || "—";
                  return (
                    <TableRow key={`${r.source}-${r.id}`} className="cursor-pointer" onClick={() => handleRowClick(r)}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{r.phone || "—"}</TableCell>
                      <TableCell><Badge className={conf.className} variant="secondary">{conf.label}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{r.broker_name || <span className="italic">Non rattaché</span>}</TableCell>
                      <TableCell className="text-center">{r.policies_count}</TableCell>
                      <TableCell className="text-center">{r.claims_count}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {format(new Date(r.created_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleRowClick(r); }}>
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            setPage={setPage}
            setPageSize={setPageSize}
            itemLabel="client"
          />
        </CardContent>
      </Card>

      <ClientDetailSheet
        client={sheetClient}
        open={clientOpen}
        onOpenChange={setClientOpen}
      />
      <LeadDetailSheet
        lead={selectedLead ?? null}
        open={leadOpen}
        onOpenChange={setLeadOpen}
        onStatusChange={() => {}}
      />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${accent || "text-foreground"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}