import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useAdminClients, type AdminClientRow, type AdminClientStatus } from "@/hooks/useAdminClients";
import { ClientDetailSheet } from "@/components/clients/ClientDetailSheet";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { exportToCsv, csvDate } from "@/lib/export-csv";

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
  const [sortBy, setSortBy] = useState<string>("created_desc");

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
    const arr = rows.filter((r) => {
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
    const name = (r: AdminClientRow) =>
      (r.display_name || [r.first_name, r.last_name].filter(Boolean).join(" ") || "").toLowerCase();
    return [...arr].sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return name(a).localeCompare(name(b));
        case "name_desc":
          return name(b).localeCompare(name(a));
        case "created_asc":
          return +new Date(a.created_at) - +new Date(b.created_at);
        case "created_desc":
        default:
          return +new Date(b.created_at) - +new Date(a.created_at);
      }
    });
  }, [rows, search, statusFilter, brokerFilter, sortBy]);

  const { pageItems: paged, page, setPage, pageSize, setPageSize, totalItems } = usePagination(
    filtered,
    { storageKey: "admin-clients" },
  );

  const handleRowClick = (row: AdminClientRow) => {
    setSelectedClient(row);
    if (row.source === "lead") setLeadOpen(true);
    else setClientOpen(true);
  };

  const handleExport = () => {
    exportToCsv(
      "clients-sanlam",
      ["Créé le", "Prénom", "Nom", "Email", "Téléphone", "Statut", "Agent", "Canal", "Dernière connexion", "Polices", "Sinistres"],
      filtered.map((r) => [
        r.first_name ?? "",
        r.last_name ?? "",
        r.email ?? "",
        r.phone ?? "",
        STATUS_LABEL[r.status].label,
        r.broker_name ?? "",
        r.channel,
        csvDate(r.last_sign_in_at),
        r.policies_count,
        r.claims_count,
        csvDate(r.created_at),
      ]),
    );
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
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <DataTableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Rechercher (nom, email, téléphone)...",
            }}
            filters={[
              {
                id: "status",
                label: "Statut",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: "Tous statuts" },
                  { value: "with", label: "Avec compte" },
                  { value: "without", label: "Sans compte" },
                  { value: "no_broker", label: "Sans agent" },
                ],
              },
              {
                id: "broker",
                label: "Agent",
                value: brokerFilter,
                onChange: setBrokerFilter,
                options: [
                  { value: "all", label: "Tous les agents" },
                  ...brokers.map((b) => ({ value: b.id, label: b.name })),
                ],
                width: "w-[220px]",
              },
            ]}
            sort={{
              value: sortBy,
              onChange: setSortBy,
              options: [
                { value: "created_desc", label: "Création récente" },
                { value: "created_asc", label: "Création ancienne" },
                { value: "name_asc", label: "Nom A→Z" },
                { value: "name_desc", label: "Nom Z→A" },
              ],
            }}
            onExport={handleExport}
          />

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden lg:table-cell">Créé le</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Agent rattaché</TableHead>
                  <TableHead className="hidden lg:table-cell">Canal</TableHead>
                  <TableHead className="hidden lg:table-cell">Dernière connexion</TableHead>
                  <TableHead className="text-center">Polices</TableHead>
                  <TableHead className="text-center">Sinistres</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">Chargement...</TableCell></TableRow>
                ) : paged.length === 0 ? (
                  <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">Aucun client trouvé.</TableCell></TableRow>
                ) : paged.map((r) => {
                  const conf = STATUS_LABEL[r.status];
                  const name = r.display_name || [r.first_name, r.last_name].filter(Boolean).join(" ") || "—";
                  return (
                    <TableRow key={`${r.source}-${r.id}`} className="cursor-pointer" onClick={() => handleRowClick(r)}>
                      <TableCell className="hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.created_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{r.phone || "—"}</TableCell>
                      <TableCell><Badge className={conf.className} variant="secondary">{conf.label}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{r.broker_name || <span className="italic">Non rattaché</span>}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs font-normal">{r.channel}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {r.last_sign_in_at ? (
                          <span title={format(new Date(r.last_sign_in_at), "dd MMM yyyy HH:mm", { locale: fr })}>
                            {formatDistanceToNow(new Date(r.last_sign_in_at), { locale: fr, addSuffix: true })}
                          </span>
                        ) : (
                          <span className="italic">Jamais</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{r.policies_count}</TableCell>
                      <TableCell className="text-center">{r.claims_count}</TableCell>
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
