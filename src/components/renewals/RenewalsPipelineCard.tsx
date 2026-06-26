import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import { Send, RefreshCw, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatFCFA } from "@/utils/formatCurrency";
import { RenewalsBulkNotifyDialog } from "./RenewalsBulkNotifyDialog";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { exportToCsv, csvDate } from "@/lib/export-csv";

type Scope = "broker" | "admin";

interface Props {
  scope: Scope;
}

interface RenewalRow {
  id: string;
  user_id: string | null;
  product_id: string | null;
  client_name: string;
  client_phone: string | null;
  product_name: string;
  product_category: string;
  agence: string;
  policy_number: string;
  end_date: string;
  premium: number;
  renewal_status: string | null;
  days_until_expiry: number;
  claims_count: number;
  score_global: number | null;
  pricing_adjustments: any;
  last_reminder_at: string | null;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "À renouveler" },
  { value: "notified", label: "Notifié" },
  { value: "renewed", label: "Renouvelé" },
  { value: "expired", label: "Expiré" },
] as const;

const DEFAULT_AGENCE = "Espace Roume";

export function RenewalsPipelineCard({ scope }: Props) {
  const [search, setSearch] = useState("");
  const [agence, setAgence] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [echeance, setEcheance] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("expiry_asc");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["renewals-pipeline", scope],
    queryFn: async (): Promise<RenewalRow[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      let q = supabase
        .from("subscriptions")
        .select(`*, products (name, category, pricing_adjustments), profiles:user_id (id, display_name, email, phone)`)
        .order("end_date", { ascending: true });
      if (scope === "broker") q = q.eq("assigned_broker_id", user.id);
      const { data, error } = await q;
      if (error) throw error;

      const userIds = Array.from(new Set((data ?? []).map((s: any) => s.user_id).filter(Boolean)));
      const [claimsRes, scoresRes] = await Promise.all([
        userIds.length
          ? supabase.from("claims").select("user_id").in("user_id", userIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        userIds.length
          ? supabase.from("client_scores").select("client_id, score_global").in("client_id", userIds)
          : Promise.resolve({ data: [] as any[], error: null }),
      ]);
      const claimsByUser = new Map<string, number>();
      (claimsRes.data ?? []).forEach((c: any) => {
        claimsByUser.set(c.user_id, (claimsByUser.get(c.user_id) ?? 0) + 1);
      });
      const scoreByUser = new Map<string, number>();
      (scoresRes.data ?? []).forEach((s: any) => {
        scoreByUser.set(s.client_id, Number(s.score_global));
      });

      const now = new Date();
      return (data ?? []).map((s: any) => {
        const profile = s.profiles ?? {};
        const product = s.products ?? {};
        const effStatus = s.renewal_status ?? "pending";
        let lastReminder: string | null =
          s.last_reminder_at ??
          s.notified_at ??
          (effStatus === "notified" ? s.updated_at ?? null : null);
        // Mock: dérive une date de relance stable à partir de l'id si aucune n'existe
        if (!lastReminder && s.id) {
          const hash = String(s.id)
            .split("")
            .reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
          const daysAgo = (hash % 25) + 1; // 1 à 25 jours
          const mocked = new Date(now);
          mocked.setDate(mocked.getDate() - daysAgo);
          lastReminder = mocked.toISOString();
        }
        return {
          id: s.id,
          user_id: s.user_id ?? null,
          product_id: s.product_id ?? null,
          client_name: profile.display_name || "Client",
          client_phone: profile.phone ?? null,
          product_name: product.name || "Produit",
          product_category: product.category || "",
          agence: DEFAULT_AGENCE,
          policy_number: s.policy_number,
          end_date: s.end_date,
          premium: Number(s.monthly_premium ?? 0) * 12,
          renewal_status: s.renewal_status,
          days_until_expiry: differenceInDays(new Date(s.end_date), now),
          claims_count: claimsByUser.get(s.user_id) ?? 0,
          score_global: scoreByUser.has(s.user_id) ? scoreByUser.get(s.user_id)! : null,
          pricing_adjustments: product.pricing_adjustments ?? null,
          last_reminder_at: lastReminder,
        };
      });
    },
  });

  const agences = useMemo(() => {
    const set = new Set(rows.map((r) => r.agence).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  const products = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.product_name).filter(Boolean)));
  }, [rows]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const arr = rows.filter((r) => {
      if (agence !== "all" && r.agence !== agence) return false;
      if (productFilter !== "all" && r.product_name !== productFilter) return false;
      if (echeance !== "all") {
        const d = r.days_until_expiry;
        if (echeance === "lt7" && !(d >= 0 && d <= 7)) return false;
        if (echeance === "lt30" && !(d >= 0 && d <= 30)) return false;
        if (echeance === "gt30" && !(d > 30)) return false;
      }
      if (status !== "all") {
        const isExpired = r.days_until_expiry < 0;
        const eff = r.renewal_status ?? "pending";
        if (status === "expired") {
          if (!isExpired) return false;
        } else if (eff !== status) return false;
      }
      if (s) {
        const hay = `${r.client_name} ${r.policy_number} ${r.product_name} ${r.agence}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
    return [...arr].sort((a, b) => {
      switch (sortBy) {
        case "expiry_desc":
          return b.days_until_expiry - a.days_until_expiry;
        case "premium_desc":
          return b.premium - a.premium;
        case "reminder_desc":
          return (
            +new Date(b.last_reminder_at ?? 0) - +new Date(a.last_reminder_at ?? 0)
          );
        case "score_desc":
          return (b.score_global ?? -1) - (a.score_global ?? -1);
        case "expiry_asc":
        default:
          return a.days_until_expiry - b.days_until_expiry;
      }
    });
  }, [rows, search, agence, productFilter, echeance, status, sortBy]);

  const exportCSV = () => {
    exportToCsv(
      `renouvellements-${scope}`,
      ["Client", "Téléphone", "Produit", "Agence", "Police", "Échéance", "Prime", "Sinistres", "Score", "Statut", "Dernière relance"],
      filtered.map((r) => [
        r.client_name,
        r.client_phone ?? "",
        r.product_name,
        r.agence,
        r.policy_number,
        csvDate(r.end_date),
        r.premium,
        r.claims_count,
        r.score_global ?? "",
        r.renewal_status ?? "pending",
        csvDate(r.last_reminder_at),
      ]),
    );
  };

  const { pageItems, page, setPage, pageSize, setPageSize, totalItems } = usePagination(
    filtered,
    { storageKey: `renewals-pipeline-${scope}` },
  );

  const selectedIds = useMemo(
    () => filtered.map((r) => r.id).filter((id) => selected[id]),
    [filtered, selected],
  );
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      filtered.forEach((r) => { next[r.id] = true; });
      setSelected(next);
    }
  };

  const selectedRows = useMemo(
    () => filtered.filter((r) => selected[r.id]),
    [filtered, selected],
  );

  // Suggest a default bonus/malus based on the average score of selected contracts.
  // High score → bonus (negative %), low score → malus (positive %).
  const suggestedAdjustment = useMemo(() => {
    const scored = selectedRows.filter((r) => r.score_global != null);
    if (!scored.length) return 0;
    const avg = scored.reduce((sum, r) => sum + (r.score_global ?? 0), 0) / scored.length;
    if (avg >= 75) return -10;
    if (avg >= 50) return -5;
    if (avg >= 25) return 5;
    return 10;
  }, [selectedRows]);

  // Use the most restrictive product config across the selection.
  const adjustmentConfig = useMemo(() => {
    let maxBonus = 0;
    let maxMalus = 0;
    let threshold = 0;
    selectedRows.forEach((r) => {
      const pa = r.pricing_adjustments ?? {};
      const bm = pa.bonus_malus_renouvellement ?? {};
      const app = pa.approval ?? {};
      maxBonus = Math.max(maxBonus, Number(bm.max_bonus ?? 0));
      maxMalus = Math.max(maxMalus, Number(bm.max_malus ?? 0));
      threshold = Math.max(threshold, Number(app.threshold_bonus_malus_pct ?? 0));
    });
    return { maxBonus, maxMalus, threshold };
  }, [selectedRows]);

  const handleConfirm = async (adjustmentPct: number, needsApproval: boolean) => {
    const n = selectedIds.length;
    setConfirmOpen(false);
    if (needsApproval) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const rowsToInsert = selectedRows.map((r) => ({
          source: "renewal",
          subscription_id: r.id,
          product_id: r.product_id,
          requested_by: user?.id ?? null,
          client_name: r.client_name,
          product_name: r.product_name,
          adjustment_type: adjustmentPct >= 0 ? "malus" : "bonus",
          adjustment_value: Math.abs(adjustmentPct),
          adjustment_unit: "percentage",
          status: "pending",
          context: { adjustment_pct: adjustmentPct },
        }));
        const { error } = await supabase.from("pricing_adjustment_approvals").insert(rowsToInsert as any);
        if (error) throw error;
        toast.success(`${n} demande${n > 1 ? "s" : ""} d'approbation créée${n > 1 ? "s" : ""}`);
      } catch (e: any) {
        toast.error(e.message ?? "Erreur lors de la création des approbations");
        return;
      }
    } else {
      toast.success(
        `${n} notification${n > 1 ? "s" : ""} envoyée${n > 1 ? "s" : ""}${adjustmentPct !== 0 ? ` (${adjustmentPct > 0 ? "+" : ""}${adjustmentPct}%)` : ""}`,
      );
    }
    setSelected({});
  };

  const handleRenew = (r: RenewalRow) => {
    setSelected({ [r.id]: true });
    setConfirmOpen(true);
  };

  const handleWhatsApp = (r: RenewalRow) => {
    if (!r.client_phone) {
      toast.error("Aucun numéro disponible");
      return;
    }
    const msg = encodeURIComponent(
      `Bonjour ${r.client_name}, votre contrat ${r.policy_number} (${r.product_name}) arrive à échéance le ${format(new Date(r.end_date), "dd/MM/yyyy")}. Souhaitez-vous procéder au renouvellement ?`,
    );
    window.open(`https://wa.me/${r.client_phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
    toast.success("Notification WhatsApp ouverte");
  };

  const statusBadge = (r: RenewalRow) => {
    const isExpired = r.days_until_expiry < 0;
    const eff = r.renewal_status ?? "pending";
    if (eff === "renewed") return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Renouvelé</Badge>;
    if (eff === "lost") return <Badge variant="destructive">Perdu</Badge>;
    if (eff === "notified") return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Notifié</Badge>;
    if (isExpired) return <Badge className="bg-foreground text-background hover:bg-foreground">Expiré</Badge>;
    return <Badge variant="outline">—</Badge>;
  };

  const scorePill = (score: number | null) => {
    if (score == null) return <span className="text-xs text-muted-foreground">—</span>;
    const color =
      score >= 75 ? "bg-emerald-100 text-emerald-700" :
      score >= 50 ? "bg-blue-100 text-blue-700" :
      score >= 25 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700";
    return <Badge className={cn(color, "hover:" + color)}>{Math.round(score)}/100</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-base font-semibold">Pipeline des Renouvellements</CardTitle>
        </div>
        <div className="mt-3">
          <DataTableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Rechercher client, branche, police...",
            }}
            filters={[
              {
                id: "status",
                label: "Statut",
                value: status,
                onChange: setStatus,
                options: STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              },
              {
                id: "agence",
                label: "Agence",
                value: agence,
                onChange: setAgence,
                options: [
                  { value: "all", label: "Toutes agences" },
                  ...agences.map((a) => ({ value: a, label: a })),
                ],
              },
              {
                id: "product",
                label: "Produit",
                value: productFilter,
                onChange: setProductFilter,
                options: [
                  { value: "all", label: "Tous produits" },
                  ...products.map((p) => ({ value: p, label: p })),
                ],
              },
              {
                id: "echeance",
                label: "Échéance",
                value: echeance,
                onChange: setEcheance,
                options: [
                  { value: "all", label: "Toute échéance" },
                  { value: "lt7", label: "≤ 7 jours" },
                  { value: "lt30", label: "≤ 30 jours" },
                  { value: "gt30", label: "> 30 jours" },
                ],
              },
            ]}
            sort={{
              value: sortBy,
              onChange: setSortBy,
              options: [
                { value: "expiry_asc", label: "Échéance la plus proche" },
                { value: "expiry_desc", label: "Échéance la plus lointaine" },
                { value: "premium_desc", label: "Prime ↓" },
                { value: "reminder_desc", label: "Relance récente" },
                { value: "score_desc", label: "Score ↓" },
              ],
            }}
            onExport={exportCSV}
            extraActions={
              <Button
                disabled={selectedIds.length === 0}
                onClick={() => setConfirmOpen(true)}
                className="gap-2"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
                Renouveler ({selectedIds.length})
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {isLoading ? (
          <div className="space-y-2 px-4 sm:px-0">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucun renouvellement à afficher</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Tout sélectionner" />
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="hidden md:table-cell">Agence</TableHead>
                  <TableHead className="hidden md:table-cell">Police</TableHead>
                  <TableHead className="hidden lg:table-cell">Échéance</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Prime</TableHead>
                  <TableHead className="hidden md:table-cell">Sinistres</TableHead>
                  <TableHead className="hidden md:table-cell">Scoring</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Dernière relance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((r) => {
                  const isExpired = r.days_until_expiry < 0;
                  return (
                    <TableRow
                      key={r.id}
                      data-state={selected[r.id] ? "selected" : undefined}
                      className="hover:bg-muted/30"
                    >
                      <TableCell>
                        <Checkbox
                          checked={!!selected[r.id]}
                          onCheckedChange={(v) =>
                            setSelected((prev) => ({ ...prev, [r.id]: !!v }))
                          }
                          aria-label="Sélectionner"
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-medium text-sm">{r.client_name}</div>
                        <div className="text-xs text-muted-foreground">{r.client_phone || "—"}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="text-xs">{r.product_name}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3 text-sm">{r.agence}</TableCell>
                      <TableCell className="hidden md:table-cell py-3 text-sm font-mono">
                        {r.policy_number}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3">
                        <span className={cn("text-sm", isExpired && "text-foreground")}>
                          {format(new Date(r.end_date), "dd/MM/yy")}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3 text-right text-sm font-medium">
                        {formatFCFA(r.premium)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            r.claims_count > 0 && "border-amber-300 text-amber-700",
                          )}
                        >
                          {r.claims_count} sinistre{r.claims_count > 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3">
                        {scorePill(r.score_global)}
                      </TableCell>
                      <TableCell className="py-3">{statusBadge(r)}</TableCell>
                      <TableCell className="hidden lg:table-cell py-3 text-sm">
                        {r.last_reminder_at
                          ? format(new Date(r.last_reminder_at), "dd/MM/yy")
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline" size="sm" className="h-8 gap-1"
                            onClick={() => handleRenew(r)}
                            aria-label="Renouveler"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Renouveler</span>
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            onClick={() => handleWhatsApp(r)}
                            aria-label="Envoyer la notification au client"
                            title="Envoyer la notification au client"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="mt-2 px-4 sm:px-0">
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              setPage={setPage}
              setPageSize={setPageSize}
              itemLabel="contrat"
            />
          </div>
        )}
      </CardContent>

      <RenewalsBulkNotifyDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        count={selectedIds.length}
        onConfirm={handleConfirm}
        maxBonus={adjustmentConfig.maxBonus}
        maxMalus={adjustmentConfig.maxMalus}
        approvalThreshold={adjustmentConfig.threshold}
        suggestedAdjustment={suggestedAdjustment}
      />
    </Card>
  );
}