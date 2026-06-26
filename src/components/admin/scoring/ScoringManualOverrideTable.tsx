import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useManualOverrideRequests,
  useDecideManualOverride,
  useProfilesBrief,
  type ManualOverrideRequest,
} from "@/hooks/useManualOverrideRequests";
import { exportToCSV } from "@/utils/exportCsv";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

const STATUS_LABEL: Record<ManualOverrideRequest["status"], string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
};

const STATUS_BADGE: Record<ManualOverrideRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ScoringManualOverrideTable() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);
  const { role } = useUserRole(user);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");

  const isAdmin = role === "admin";
  const isBackoffice =
    role === "admin" ||
    role === "backoffice_crc" ||
    role === "backoffice_conformite";

  const { data: all, isLoading } = useManualOverrideRequests("all");
  const decide = useDecideManualOverride();

  const rawPending = useMemo(
    () => (all ?? []).filter((r) => r.status === "pending"),
    [all],
  );
  const rawHistory = useMemo(
    () => (all ?? []).filter((r) => r.status !== "pending"),
    [all],
  );

  const userIds = useMemo(() => {
    const ids = new Set<string>();
    (all ?? []).forEach((r) => {
      ids.add(r.requested_by);
      ids.add(r.client_id);
      if (r.approver_id) ids.add(r.approver_id);
    });
    return Array.from(ids);
  }, [all]);
  const { data: profiles } = useProfilesBrief(userIds);

  const matchSearch = (r: ManualOverrideRequest) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const client = (profiles?.get(r.client_id)?.display_name || profiles?.get(r.client_id)?.email || "").toLowerCase();
    const requester = (profiles?.get(r.requested_by)?.display_name || profiles?.get(r.requested_by)?.email || "").toLowerCase();
    return client.includes(q) || requester.includes(q) || (r.justification ?? "").toLowerCase().includes(q);
  };
  const sortFn = (a: ManualOverrideRequest, b: ManualOverrideRequest) => {
    switch (sortBy) {
      case "date_asc": return +new Date(a.created_at) - +new Date(b.created_at);
      case "delta_desc": return Math.abs((b.requested_score ?? 0) - (b.current_score ?? 0)) - Math.abs((a.requested_score ?? 0) - (a.current_score ?? 0));
      case "delta_asc": return Math.abs((a.requested_score ?? 0) - (a.current_score ?? 0)) - Math.abs((b.requested_score ?? 0) - (b.current_score ?? 0));
      case "date_desc":
      default: return +new Date(b.created_at) - +new Date(a.created_at);
    }
  };

  const pending = useMemo(
    () => rawPending.filter(matchSearch).sort(sortFn),
    [rawPending, search, sortBy, profiles],
  );
  const history = useMemo(
    () => rawHistory
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter(matchSearch)
      .sort(sortFn),
    [rawHistory, statusFilter, search, sortBy, profiles],
  );

  const pendingPg = usePagination(pending, { storageKey: "score-overrides-pending" });
  const historyPg = usePagination(history, { storageKey: "score-overrides-history" });

  const nameOf = (id: string | null | undefined) => {
    if (!id) return "—";
    const p = profiles?.get(id);
    return p?.display_name || p?.email || id.slice(0, 8);
  };

  const [decisionDialog, setDecisionDialog] = useState<{
    request: ManualOverrideRequest;
    decision: "approved" | "rejected";
  } | null>(null);
  const [comment, setComment] = useState("");

  const openDecision = (
    request: ManualOverrideRequest,
    decision: "approved" | "rejected",
  ) => {
    setComment("");
    setDecisionDialog({ request, decision });
  };

  const submitDecision = async () => {
    if (!decisionDialog) return;
    if (decisionDialog.decision === "rejected" && comment.trim().length < 5) {
      return;
    }
    try {
      await decide.mutateAsync({
        requestId: decisionDialog.request.id,
        decision: decisionDialog.decision,
        comment: comment.trim() || undefined,
      });
      setDecisionDialog(null);
    } catch {
      /* toast déjà émis */
    }
  };

  const exportHistory = () => {
    const rows = history.map((r) => ({
      Date_demande: fmtDate(r.created_at),
      Date_decision: fmtDate(r.decided_at),
      Client: nameOf(r.client_id),
      Client_id: r.client_id,
      Demandeur: nameOf(r.requested_by),
      Score_avant: r.current_score ?? "",
      Niveau_avant: r.current_niveau ?? "",
      Score_demande: r.requested_score,
      Statut: STATUS_LABEL[r.status],
      Approbateur: nameOf(r.approver_id),
      Justification: r.justification,
      Commentaire_approbateur: r.approver_comment ?? "",
    }));
    if (rows.length === 0) return;
    exportToCSV(rows, `scoring_overrides_${new Date().toISOString().slice(0, 10)}`);
  };

  if (!isBackoffice) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Réservé au back-office et aux administrateurs.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <DataTableToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Rechercher un client ou demandeur..." }}
        filters={[
          {
            id: "status", label: "Statut", value: statusFilter, onChange: setStatusFilter,
            options: [
              { value: "all", label: "Tous statuts" },
              { value: "approved", label: "Approuvée" },
              { value: "rejected", label: "Refusée" },
            ],
          },
        ]}
        sort={{
          value: sortBy, onChange: setSortBy,
          options: [
            { value: "date_desc", label: "Date récente" },
            { value: "date_asc", label: "Date ancienne" },
            { value: "delta_desc", label: "Delta score décroissant" },
            { value: "delta_asc", label: "Delta score croissant" },
          ],
        }}
        onExport={exportHistory}
        className="mb-3"
      />
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            En attente
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Chargement…
                </div>
              ) : pending.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aucune demande en attente.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Demandeur</TableHead>
                      <TableHead className="text-right">Avant → Après</TableHead>
                      <TableHead>Justification</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPg.pageItems.map((r) => {
                      const isOwn = user?.id === r.requested_by;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {fmtDate(r.created_at)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {nameOf(r.client_id)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {nameOf(r.requested_by)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {r.current_score ?? "—"} → {r.requested_score}
                          </TableCell>
                          <TableCell className="max-w-[280px] text-xs text-muted-foreground truncate">
                            {r.justification}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!isAdmin || isOwn}
                                title={
                                  !isAdmin
                                    ? "Réservé aux administrateurs"
                                    : isOwn
                                      ? "Vous ne pouvez pas approuver votre propre demande"
                                      : undefined
                                }
                                onClick={() => openDecision(r, "approved")}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                disabled={!isAdmin || isOwn}
                                onClick={() => openDecision(r, "rejected")}
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Refuser
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          {pending.length > 0 && (
            <div className="mt-2">
              <DataTablePagination
                page={pendingPg.page}
                pageSize={pendingPg.pageSize}
                totalItems={pendingPg.totalItems}
                setPage={pendingPg.setPage}
                setPageSize={pendingPg.setPageSize}
                itemLabel="demande"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          <Card>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aucune décision enregistrée.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Décidée le</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Demandeur</TableHead>
                      <TableHead className="text-right">Avant → Après</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Approbateur</TableHead>
                      <TableHead>Commentaire</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyPg.pageItems.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {fmtDate(r.decided_at)}
                        </TableCell>
                        <TableCell className="text-sm">{nameOf(r.client_id)}</TableCell>
                        <TableCell className="text-sm">{nameOf(r.requested_by)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {r.current_score ?? "—"} → {r.requested_score}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_BADGE[r.status]}>
                            {STATUS_LABEL[r.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{nameOf(r.approver_id)}</TableCell>
                        <TableCell className="max-w-[260px] text-xs text-muted-foreground truncate">
                          {r.approver_comment ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          {history.length > 0 && (
            <DataTablePagination
              page={historyPg.page}
              pageSize={historyPg.pageSize}
              totalItems={historyPg.totalItems}
              setPage={historyPg.setPage}
              setPageSize={historyPg.setPageSize}
              itemLabel="décision"
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!decisionDialog}
        onOpenChange={(o) => !o && setDecisionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionDialog?.decision === "approved"
                ? "Approuver la modification"
                : "Refuser la modification"}
            </DialogTitle>
            <DialogDescription>
              {decisionDialog &&
                `Client ${nameOf(decisionDialog.request.client_id)} — ${decisionDialog.request.current_score ?? "—"} → ${decisionDialog.request.requested_score}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-md border bg-muted/30 p-3 text-xs">
              <p className="font-medium mb-1">Justification du demandeur</p>
              <p className="text-muted-foreground">
                {decisionDialog?.request.justification}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approver-comment">
                Commentaire
                {decisionDialog?.decision === "rejected" && (
                  <span className="text-destructive"> *</span>
                )}
              </Label>
              <Textarea
                id="approver-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={
                  decisionDialog?.decision === "rejected"
                    ? "Motif du refus (obligatoire)"
                    : "Commentaire optionnel"
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionDialog(null)}>
              Annuler
            </Button>
            <Button
              variant={
                decisionDialog?.decision === "approved" ? "default" : "destructive"
              }
              onClick={submitDecision}
              disabled={
                decide.isPending ||
                (decisionDialog?.decision === "rejected" &&
                  comment.trim().length < 5)
              }
            >
              {decide.isPending
                ? "Traitement…"
                : decisionDialog?.decision === "approved"
                  ? "Confirmer l'approbation"
                  : "Confirmer le refus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}