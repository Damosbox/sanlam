import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, CheckCircle, Mail, Eye, XCircle, RefreshCw } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { exportToCsv, csvDate } from "@/lib/export-csv";

interface SurveySend {
  id: string;
  recipient_id: string;
  recipient_type: "client" | "broker";
  status: "pending" | "sent" | "opened" | "completed" | "expired";
  send_channel: string | null;
  scheduled_at: string;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  reminder_count: number;
  created_at: string;
  survey_templates?: {
    name: string;
  };
  profiles?: {
    display_name: string;
    email: string;
  };
}

const STATUS_CONFIG = {
  pending: { label: "En attente", icon: Clock, color: "secondary" },
  sent: { label: "Envoyé", icon: Mail, color: "default" },
  opened: { label: "Ouvert", icon: Eye, color: "outline" },
  completed: { label: "Complété", icon: CheckCircle, color: "default" },
  expired: { label: "Expiré", icon: XCircle, color: "destructive" },
} as const;

export const AdminSurveySends = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sent_desc");

  const { data: sends, isLoading } = useQuery({
    queryKey: ["survey-sends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_sends")
        .select(`
          *,
          survey_templates(name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as SurveySend[];
    },
  });

  const getStatusBadge = (status: SurveySend["status"]) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.color as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    // hook placement handled below
  }

  const list = sends ?? [];

  const channels = useMemo(
    () => Array.from(new Set(list.map((s) => s.send_channel).filter(Boolean))) as string[],
    [list],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = list.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (channelFilter !== "all" && (s.send_channel ?? "") !== channelFilter) return false;
      if (!q) return true;
      return (
        (s.profiles?.display_name ?? "").toLowerCase().includes(q) ||
        (s.profiles?.email ?? "").toLowerCase().includes(q) ||
        (s.survey_templates?.name ?? "").toLowerCase().includes(q)
      );
    });
    return [...arr].sort((a, b) => {
      const aSent = a.sent_at ? +new Date(a.sent_at) : 0;
      const bSent = b.sent_at ? +new Date(b.sent_at) : 0;
      switch (sortBy) {
        case "sent_asc": return aSent - bSent;
        case "scheduled_desc": return +new Date(b.scheduled_at) - +new Date(a.scheduled_at);
        case "scheduled_asc": return +new Date(a.scheduled_at) - +new Date(b.scheduled_at);
        case "sent_desc":
        default: return bSent - aSent;
      }
    });
  }, [list, search, statusFilter, channelFilter, sortBy]);

  const handleExport = () => {
    exportToCsv(
      "envois-enquetes",
      ["Enquête", "Destinataire", "Email", "Type", "Canal", "Statut", "Planifié", "Envoyé", "Relances"],
      filtered.map((s) => [
        s.survey_templates?.name ?? "",
        s.profiles?.display_name ?? "",
        s.profiles?.email ?? "",
        s.recipient_type,
        s.send_channel ?? "",
        s.status,
        csvDate(s.scheduled_at),
        csvDate(s.sent_at),
        s.reminder_count,
      ]),
    );
  };

  const { pageItems, page, setPage, pageSize, setPageSize, totalItems } = usePagination(
    filtered,
    { storageKey: "admin-survey-sends" },
  );

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Historique des envois</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filtered.length} envois</span>
        </div>
      </div>

      <DataTableToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Rechercher destinataire, enquête..." }}
        filters={[
          {
            id: "status", label: "Statut envoi", value: statusFilter, onChange: setStatusFilter,
            options: [
              { value: "all", label: "Tous statuts" },
              { value: "pending", label: "En attente" },
              { value: "sent", label: "Envoyé" },
              { value: "opened", label: "Ouvert" },
              { value: "completed", label: "Complété" },
              { value: "expired", label: "Expiré" },
            ],
          },
          {
            id: "channel", label: "Canal", value: channelFilter, onChange: setChannelFilter,
            options: [
              { value: "all", label: "Tous canaux" },
              ...channels.map((c) => ({ value: c, label: c })),
            ],
          },
        ]}
        sort={{
          value: sortBy, onChange: setSortBy,
          options: [
            { value: "sent_desc", label: "Envoi récent" },
            { value: "sent_asc", label: "Envoi ancien" },
            { value: "scheduled_desc", label: "Planifié récent" },
            { value: "scheduled_asc", label: "Planifié ancien" },
          ],
        }}
        onExport={handleExport}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enquête</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Planifié</TableHead>
                <TableHead>Envoyé</TableHead>
                <TableHead>Relances</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((send) => (
                <TableRow key={send.id}>
                  <TableCell className="font-medium">
                    {send.survey_templates?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{send.profiles?.display_name || "Utilisateur"}</div>
                      <div className="text-muted-foreground">{send.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {send.recipient_type === "client" ? "Client" : "Intermédiaire"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(send.status)}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(send.scheduled_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {send.sent_at
                      ? format(new Date(send.sent_at), "dd/MM/yyyy HH:mm", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      <span>{send.reminder_count}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun envoi d'enquête pour le moment
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {list.length > 0 && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          setPage={setPage}
          setPageSize={setPageSize}
          itemLabel="envoi"
        />
      )}
    </div>
  );
};
