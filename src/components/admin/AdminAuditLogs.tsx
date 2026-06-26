import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, RefreshCw, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { exportToCsv } from "@/lib/export-csv";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-500",
  UPDATE: "bg-blue-500",
  DELETE: "bg-red-500",
  LOGIN: "bg-purple-500",
  EXPORT: "bg-orange-500",
  VIEW: "bg-gray-500",
};

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);

      // Fetch user emails for display
      const userIds = [...new Set(data?.map((l) => l.user_id).filter(Boolean) as string[])];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", userIds);

        const emailMap: Record<string, string> = {};
        profiles?.forEach((p) => {
          emailMap[p.id] = p.email || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Inconnu";
        });
        setUserEmails(emailMap);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    exportToCsv(
      "audit_logs",
      ["Date", "Utilisateur", "Action", "Resource", "ID Resource", "IP"],
      filteredLogs.map((log) => [
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        userEmails[log.user_id || ""] || log.user_id || "Système",
        log.action,
        log.resource_type,
        log.resource_id || "",
        log.ip_address || "",
      ]),
    );
  };

  // Get unique values for filters
  const actions = [...new Set(logs.map((l) => l.action))];
  const resources = [...new Set(logs.map((l) => l.resource_type))];

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userEmails[log.user_id || ""] || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesResource = resourceFilter === "all" || log.resource_type === resourceFilter;

    return matchesSearch && matchesAction && matchesResource;
  }).sort((a, b) => {
    const da = +new Date(a.created_at);
    const db = +new Date(b.created_at);
    return sortBy === "date_asc" ? da - db : db - da;
  });

  const { pageItems, page, setPage, pageSize, setPageSize, totalItems } = usePagination(
    filteredLogs,
    { storageKey: "admin-audit-logs" },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Journal d'Audit</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </div>
          <CardDescription>
            Historique des actions effectuées dans l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableToolbar
            search={{
              value: searchTerm,
              onChange: setSearchTerm,
              placeholder: "Rechercher action, utilisateur, resource...",
            }}
            filters={[
              {
                id: "action",
                label: "Action",
                value: actionFilter,
                onChange: setActionFilter,
                options: [
                  { value: "all", label: "Toutes actions" },
                  ...actions.map((a) => ({ value: a, label: a })),
                ],
              },
              {
                id: "resource",
                label: "Resource",
                value: resourceFilter,
                onChange: setResourceFilter,
                options: [
                  { value: "all", label: "Toutes resources" },
                  ...resources.map((r) => ({ value: r, label: r })),
                ],
              },
            ]}
            sort={{
              value: sortBy,
              onChange: setSortBy,
              options: [
                { value: "date_desc", label: "Plus récents" },
                { value: "date_asc", label: "Plus anciens" },
              ],
            }}
            onExport={exportLogs}
          />

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Date
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Utilisateur
                    </div>
                  </TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucun log trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  pageItems.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), "dd MMM yyyy HH:mm", {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user_id
                          ? userEmails[log.user_id] || log.user_id.slice(0, 8) + "..."
                          : "Système"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${ACTION_COLORS[log.action] || "bg-gray-500"} text-white`}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {log.resource_type}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {log.resource_id ? log.resource_id.slice(0, 8) + "..." : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ip_address || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              setPage={setPage}
              setPageSize={setPageSize}
              itemLabel="événement"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
