import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { useAdminClients } from "@/hooks/useAdminClients";
import { MedalIcon } from "@/components/clients/MedalIcon";
import { VF_NIVEAU_LABEL, type VfNiveau } from "@/lib/scoring/vfV2";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

// Same deterministic mock as useClientScore (prototype only)
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const BUCKETS: Array<{ niveau: VfNiveau; min: number; max: number }> = [
  { niveau: "bronze", min: 15, max: 38 },
  { niveau: "argent", min: 45, max: 62 },
  { niveau: "or", min: 68, max: 78 },
  { niveau: "platine", min: 82, max: 95 },
];

function scoreFor(id: string) {
  const h = hashString(id);
  const b = BUCKETS[h % BUCKETS.length];
  const span = b.max - b.min + 1;
  return { score: b.min + (Math.floor(h / 7) % span), niveau: b.niveau };
}

const TIER_BADGE: Record<VfNiveau, string> = {
  bronze: "bg-orange-100 text-orange-800 border-orange-200",
  argent: "bg-zinc-100 text-zinc-800 border-zinc-200",
  or: "bg-amber-100 text-amber-800 border-amber-200",
  platine: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

export const ScoringClientsByTier = () => {
  const { data: rows = [], isLoading } = useAdminClients();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<VfNiveau | "all">("all");

  const scored = useMemo(
    () => rows.map((r) => ({ ...r, ...scoreFor(r.id) })),
    [rows],
  );

  const counts = useMemo(() => {
    const c: Record<VfNiveau, number> = { bronze: 0, argent: 0, or: 0, platine: 0 };
    scored.forEach((r) => { c[r.niveau]++; });
    return c;
  }, [scored]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scored
      .filter((r) => tierFilter === "all" || r.niveau === tierFilter)
      .filter((r) => {
        if (!q) return true;
        const name = (r.display_name || [r.first_name, r.last_name].filter(Boolean).join(" ") || "").toLowerCase();
        return name.includes(q) || (r.email || "").toLowerCase().includes(q);
      })
      .sort((a, b) => b.score - a.score);
  }, [scored, search, tierFilter]);

  const { pageItems, page, setPage, pageSize, setPageSize, totalItems } = usePagination(
    filtered,
    { storageKey: "scoring-clients-by-tier" },
  );

  const tiers: VfNiveau[] = ["platine", "or", "argent", "bronze"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiers.map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(tierFilter === t ? "all" : t)}
            className={`rounded-lg border p-4 text-left transition hover:border-primary ${
              tierFilter === t ? "border-primary ring-2 ring-primary/20" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <MedalIcon niveau={t} size={28} />
              <div>
                <div className="text-sm font-medium">{VF_NIVEAU_LABEL[t]}</div>
                <div className="text-2xl font-bold">{counts[t]}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">
              Clients par palier
              {tierFilter !== "all" && (
                <Badge variant="outline" className="ml-2">{VF_NIVEAU_LABEL[tierFilter]}</Badge>
              )}
            </CardTitle>
            <div className="relative w-72 max-w-full">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un client..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Agent</TableHead>
                  <TableHead>Palier</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Chargement…</TableCell></TableRow>
                ) : pageItems.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Aucun client.</TableCell></TableRow>
                ) : pageItems.map((r) => {
                  const name = r.display_name || [r.first_name, r.last_name].filter(Boolean).join(" ") || "—";
                  return (
                    <TableRow key={`${r.source}-${r.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MedalIcon niveau={r.niveau} size={20} />
                          {name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{r.email || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {r.broker_name || <span className="italic">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TIER_BADGE[r.niveau]}>
                          {VF_NIVEAU_LABEL[r.niveau]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{r.score}/100</TableCell>
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
    </div>
  );
};

export default ScoringClientsByTier;