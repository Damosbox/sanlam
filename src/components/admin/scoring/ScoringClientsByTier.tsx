import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAdminClients } from "@/hooks/useAdminClients";
import { MedalIcon } from "@/components/clients/MedalIcon";
import { VF_NIVEAU_LABEL, type VfNiveau } from "@/lib/scoring/vfV2";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { exportToCsv, csvDate } from "@/lib/export-csv";

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
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("score-desc");

  const scored = useMemo(
    () => rows.map((r) => ({ ...r, ...scoreFor(r.id) })),
    [rows],
  );

  const counts = useMemo(() => {
    const c: Record<VfNiveau, number> = { bronze: 0, argent: 0, or: 0, platine: 0 };
    scored.forEach((r) => { c[r.niveau]++; });
    return c;
  }, [scored]);

  const agentOptions = useMemo(() => {
    const set = new Map<string, string>();
    scored.forEach((r) => {
      if (r.broker_id && r.broker_name) set.set(r.broker_id, r.broker_name);
    });
    return [
      { value: "all", label: "Tous les agents" },
      { value: "none", label: "Sans agent" },
      ...Array.from(set.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [scored]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scored
      .filter((r) => tierFilter === "all" || r.niveau === tierFilter)
      .filter((r) => {
        if (agentFilter === "all") return true;
        if (agentFilter === "none") return !r.broker_id;
        return r.broker_id === agentFilter;
      })
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter((r) => {
        if (!q) return true;
        const name = (r.display_name || [r.first_name, r.last_name].filter(Boolean).join(" ") || "").toLowerCase();
        return name.includes(q) || (r.email || "").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const nameA = (a.display_name || [a.first_name, a.last_name].filter(Boolean).join(" ") || "").toLowerCase();
        const nameB = (b.display_name || [b.first_name, b.last_name].filter(Boolean).join(" ") || "").toLowerCase();
        switch (sort) {
          case "score-asc": return a.score - b.score;
          case "name-asc": return nameA.localeCompare(nameB);
          case "name-desc": return nameB.localeCompare(nameA);
          case "recent": return +new Date(b.created_at) - +new Date(a.created_at);
          case "score-desc":
          default: return b.score - a.score;
        }
      });
  }, [scored, search, tierFilter, agentFilter, statusFilter, sort]);

  const { pageItems, page, setPage, pageSize, setPageSize, totalItems } = usePagination(
    filtered,
    { storageKey: "scoring-clients-by-tier" },
  );

  const tiers: VfNiveau[] = ["platine", "or", "argent", "bronze"];

  const handleExport = () => {
    exportToCsv(`scoring-clients-${tierFilter}.csv`, filtered, [
      { header: "Créé le", value: (r) => csvDate(r.created_at) },
      { header: "Client", value: (r) => r.display_name || [r.first_name, r.last_name].filter(Boolean).join(" ") || "" },
      { header: "Email", value: (r) => r.email || "" },
      { header: "Agent", value: (r) => r.broker_name || "" },
      { header: "Palier", value: (r) => VF_NIVEAU_LABEL[r.niveau] },
      { header: "Score", value: (r) => `${r.score}/100` },
    ]);
  };

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
          <CardTitle className="text-base">
            Clients par palier
            {tierFilter !== "all" && (
              <Badge variant="outline" className="ml-2">{VF_NIVEAU_LABEL[tierFilter]}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DataTableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Rechercher (nom, email)...",
            }}
            filters={[
              {
                id: "tier",
                label: "Palier",
                value: tierFilter,
                onChange: (v) => setTierFilter(v as VfNiveau | "all"),
                options: [
                  { value: "all", label: "Tous les paliers" },
                  { value: "platine", label: "Platine" },
                  { value: "or", label: "Or" },
                  { value: "argent", label: "Argent" },
                  { value: "bronze", label: "Bronze" },
                ],
              },
              {
                id: "agent",
                label: "Agent",
                value: agentFilter,
                onChange: setAgentFilter,
                options: agentOptions,
              },
              {
                id: "status",
                label: "Statut",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: "Tous les statuts" },
                  { value: "active", label: "Client actif" },
                  { value: "user", label: "Utilisateur" },
                  { value: "no_account", label: "Sans compte" },
                ],
              },
            ]}
            sort={{
              value: sort,
              onChange: setSort,
              options: [
                { value: "score-desc", label: "Score (décroissant)" },
                { value: "score-asc", label: "Score (croissant)" },
                { value: "name-asc", label: "Nom (A → Z)" },
                { value: "name-desc", label: "Nom (Z → A)" },
                { value: "recent", label: "Plus récents" },
              ],
            }}
            onExport={handleExport}
          />
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