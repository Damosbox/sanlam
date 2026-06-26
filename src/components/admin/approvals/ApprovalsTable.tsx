import { useMemo, useState } from "react";
import { Check, X, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { formatFCFA } from "@/utils/formatCurrency";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  MOCK_APPROVALS,
  type ApprovalRequest,
  type ApprovalSource,
  type ApprovalStatus,
  type ApprovalType,
} from "./mockApprovals";

interface Props {
  source: ApprovalSource;
}

const TYPE_LABEL: Record<ApprovalType, string> = {
  reduction: "Réduction",
  bonus: "Bonus",
  malus: "Malus",
};

const TYPE_VARIANT: Record<ApprovalType, "default" | "secondary" | "destructive"> = {
  reduction: "secondary",
  bonus: "default",
  malus: "destructive",
};

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApprovalsTable({ source }: Props) {
  const [items, setItems] = useState<ApprovalRequest[]>(MOCK_APPROVALS);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">("pending");
  const [search, setSearch] = useState("");

  const [approveTarget, setApproveTarget] = useState<ApprovalRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = useMemo(() => {
    return items
      .filter((i) => i.source === source)
      .filter((i) => (statusFilter === "all" ? true : i.status === statusFilter))
      .filter((i) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          i.clientName.toLowerCase().includes(q) ||
          i.requesterName.toLowerCase().includes(q) ||
          i.productName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => +new Date(b.requestedAt) - +new Date(a.requestedAt));
  }, [items, source, statusFilter, search]);

  const { pageItems, page, setPage, pageSize, setPageSize, totalItems } = usePagination(
    filtered,
    { storageKey: `approvals-${source}` },
  );

  const confirmApprove = () => {
    if (!approveTarget) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === approveTarget.id
          ? {
              ...i,
              status: "approved",
              decidedBy: "Vous (Admin)",
              decidedAt: new Date().toISOString(),
              decisionReason: "Approuvée",
            }
          : i,
      ),
    );
    toast.success(`Demande ${approveTarget.id} approuvée`);
    setApproveTarget(null);
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 10) {
      toast.error("Motif obligatoire (min. 10 caractères)");
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === rejectTarget.id
          ? {
              ...i,
              status: "rejected",
              decidedBy: "Vous (Admin)",
              decidedAt: new Date().toISOString(),
              decisionReason: rejectReason.trim(),
            }
          : i,
      ),
    );
    toast.success(`Demande ${rejectTarget.id} refusée`);
    setRejectTarget(null);
    setRejectReason("");
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher client, demandeur, produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvée</SelectItem>
              <SelectItem value="rejected">Refusée</SelectItem>
              <SelectItem value="all">Toutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Demandeur</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant impacté</TableHead>
                <TableHead className="text-right">Valeur véhicule</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                    Aucune demande
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.requesterName}</TableCell>
                    <TableCell>{r.clientName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.productName}</TableCell>
                    <TableCell>
                      <Badge variant={TYPE_VARIANT[r.type]}>{TYPE_LABEL[r.type]}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatFCFA(r.impactFcfa)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatFCFA(r.vehicleValueFcfa)}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(r.requestedAt)}</TableCell>
                    <TableCell>
                      {r.status === "pending" && <Badge variant="outline">En attente</Badge>}
                      {r.status === "approved" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="bg-emerald-600 hover:bg-emerald-600">Approuvée</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <div className="font-medium">{r.decidedBy}</div>
                                {r.decisionReason && <div className="opacity-80">{r.decisionReason}</div>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {r.status === "rejected" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="destructive">Refusée</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs max-w-[260px]">
                                <div className="font-medium">{r.decidedBy}</div>
                                {r.decisionReason && <div className="opacity-80">{r.decisionReason}</div>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                            onClick={() => setApproveTarget(r)}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/40 hover:bg-destructive/10"
                            onClick={() => setRejectTarget(r)}
                          >
                            <X className="h-4 w-4 mr-1" /> Refuser
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          setPage={setPage}
          setPageSize={setPageSize}
          itemLabel="demande"
        />
      </CardContent>

      <AlertDialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approuver la demande {approveTarget?.id} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {approveTarget && (
                <>
                  {TYPE_LABEL[approveTarget.type]} de{" "}
                  <strong>{formatFCFA(approveTarget.impactFcfa)}</strong> pour{" "}
                  <strong>{approveTarget.clientName}</strong>. Cette action est définitive.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove} className="bg-emerald-600 hover:bg-emerald-700">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande {rejectTarget?.id}</DialogTitle>
            <DialogDescription>
              Motif obligatoire (min. 10 caractères). Il sera communiqué au demandeur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motif du refus</Label>
            <Textarea
              id="reject-reason"
              rows={4}
              placeholder="Ex. : réduction excessive par rapport au profil de risque…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function usePendingApprovalsCount(source: ApprovalSource) {
  return MOCK_APPROVALS.filter((i) => i.source === source && i.status === "pending").length;
}