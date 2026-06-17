import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import { Phone, MessageCircle, RefreshCw, Search, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatFCFA } from "@/utils/formatCurrency";
import { RenewalsBulkNotifyDialog } from "./RenewalsBulkNotifyDialog";

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
        };
      });
    },
  });

  const agences = useMemo(() => {
    const set = new Set(rows.map((r) => r.agence).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (agence !== "all" && r.agence !== agence) return false;
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
  }, [rows, search, agence, status]);

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

  const handleCall = (phone: string | null) => {
    if (phone) window.open(`tel:${phone}`);
    else toast.error("Aucun numéro disponible");
  };

  const handleWhatsApp = (phone: string | null) => {
    if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
    else toast.error("Aucun numéro disponible");
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par client, branche, police"
                className="pl-8 h-9 rounded-full"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Agence</span>
              <Select value={agence} onValueChange={setAgence}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {agences.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Statut</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              disabled={selectedIds.length === 0}
              onClick={() => setConfirmOpen(true)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Renouveler ({selectedIds.length})
            </Button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {filtered.length} affichés · page 1
            </span>
          </div>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
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
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm", isExpired && "text-foreground")}>
                            {format(new Date(r.end_date), "dd/MM/yy")}
                          </span>
                          {isExpired && (
                            <Badge className="bg-foreground text-background hover:bg-foreground text-[10px] px-1.5">
                              Expiré
                            </Badge>
                          )}
                        </div>
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
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => handleCall(r.client_phone)}
                            aria-label="Appeler"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleWhatsApp(r.client_phone)}
                            aria-label="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
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