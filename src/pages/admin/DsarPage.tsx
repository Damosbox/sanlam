import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, FileJson, FileSpreadsheet, UserX, Pencil, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { exportToCSV } from "@/utils/exportCsv";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type DsarRequestType = "access" | "rectification" | "erasure" | "portability";

interface MockRequest {
  id: string;
  client_name: string;
  client_email: string;
  type: DsarRequestType;
  status: "pending" | "in_progress" | "completed" | "rejected";
  created_at: string;
  deadline: string;
}

const MOCK_REQUESTS: MockRequest[] = [
  { id: "DSAR-2025-001", client_name: "Konan Aya", client_email: "aya.konan@example.ci", type: "access", status: "pending", created_at: "2025-04-15", deadline: "2025-05-15" },
  { id: "DSAR-2025-002", client_name: "Diabaté Moussa", client_email: "m.diabate@example.ci", type: "erasure", status: "in_progress", created_at: "2025-04-12", deadline: "2025-05-12" },
  { id: "DSAR-2025-003", client_name: "Bamba Fatou", client_email: "fatou.b@example.ci", type: "rectification", status: "completed", created_at: "2025-04-08", deadline: "2025-05-08" },
  { id: "DSAR-2025-004", client_name: "Yao Kouadio", client_email: "kouadio.y@example.ci", type: "portability", status: "pending", created_at: "2025-04-18", deadline: "2025-05-18" },
];

const TYPE_LABELS: Record<DsarRequestType, string> = {
  access: "Accès",
  rectification: "Rectification",
  erasure: "Effacement",
  portability: "Portabilité",
};

const STATUS_VARIANTS: Record<MockRequest["status"], { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-500/10 text-amber-700 border-amber-200" },
  in_progress: { label: "En cours", className: "bg-blue-500/10 text-blue-700 border-blue-200" },
  completed: { label: "Traitée", className: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejetée", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function DsarPage() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; email: string } | null>(null);
  const [actionDialog, setActionDialog] = useState<"export" | "anonymize" | "rectify" | null>(null);
  const [anonymizeReason, setAnonymizeReason] = useState("");

  const { data: clients } = useQuery({
    queryKey: ["dsar-clients-search", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, phone")
        .or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: search.length >= 2,
  });

  const handleExport = async (format: "json" | "csv") => {
    if (!selectedClient) return;

    const [profile, additional, kyc, subscriptions, claims, notes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", selectedClient.id).maybeSingle(),
      supabase.from("client_additional_data").select("*").eq("client_id", selectedClient.id).maybeSingle(),
      supabase.from("client_kyc_compliance").select("*").eq("client_id", selectedClient.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", selectedClient.id),
      supabase.from("claims").select("*").eq("user_id", selectedClient.id),
      supabase.from("client_notes").select("*").eq("client_id", selectedClient.id),
    ]);

    const dossier = {
      meta: {
        export_date: new Date().toISOString(),
        export_type: "DSAR_ACCESS_RIGHT",
        regulation: "Loi CI n° 2013-450 — Protection des données personnelles",
        client_id: selectedClient.id,
      },
      profile: profile.data,
      additional_data: additional.data,
      kyc_compliance: kyc.data,
      subscriptions: subscriptions.data ?? [],
      claims: claims.data ?? [],
      notes: notes.data ?? [],
    };

    if (format === "json") {
      const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dsar_${selectedClient.id}_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const flat = [
        { section: "Profil", ...profile.data },
        ...(subscriptions.data ?? []).map((s) => ({ section: "Souscription", ...s })),
        ...(claims.data ?? []).map((c) => ({ section: "Sinistre", ...c })),
      ];
      exportToCSV(flat as any, `dsar_${selectedClient.id}`);
    }

    await supabase.from("audit_logs").insert({
      action: "DSAR_EXPORT",
      resource_type: "client_data",
      resource_id: selectedClient.id,
      new_values: { format, sections: Object.keys(dossier) },
    });

    toast.success(`Dossier exporté en ${format.toUpperCase()}`);
    setActionDialog(null);
  };

  const handleAnonymize = async () => {
    if (!selectedClient || !anonymizeReason.trim()) {
      toast.error("Motif d'anonymisation requis");
      return;
    }
    await supabase.from("audit_logs").insert({
      action: "DSAR_ANONYMIZE_REQUESTED",
      resource_type: "client_data",
      resource_id: selectedClient.id,
      new_values: { reason: anonymizeReason, status: "queued_for_review" },
    });
    toast.success("Demande d'anonymisation enregistrée — validation conformité requise");
    setActionDialog(null);
    setAnonymizeReason("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          DSAR — Droits des personnes
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestion des demandes d'accès, rectification, effacement et portabilité — Loi CI n° 2013-450
        </p>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests">Demandes en cours</TabsTrigger>
          <TabsTrigger value="manual">Action manuelle</TabsTrigger>
          <TabsTrigger value="info">Informations légales</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total demandes</CardDescription>
                <CardTitle className="text-3xl">{MOCK_REQUESTS.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>En attente</CardDescription>
                <CardTitle className="text-3xl text-amber-600">
                  {MOCK_REQUESTS.filter((r) => r.status === "pending").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>En cours</CardDescription>
                <CardTitle className="text-3xl text-blue-600">
                  {MOCK_REQUESTS.filter((r) => r.status === "in_progress").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Délai légal</CardDescription>
                <CardTitle className="text-3xl">30j</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° demande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Reçue le</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_REQUESTS.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.client_name}</div>
                        <div className="text-xs text-muted-foreground">{r.client_email}</div>
                      </TableCell>
                      <TableCell>{TYPE_LABELS[r.type]}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_VARIANTS[r.status].className}>
                          {STATUS_VARIANTS[r.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.created_at}</TableCell>
                      <TableCell>
                        <span className={new Date(r.deadline) < new Date(Date.now() + 7 * 86400000) ? "text-destructive font-medium" : ""}>
                          {r.deadline}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">Traiter</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rechercher un client</CardTitle>
              <CardDescription>
                Saisissez au moins 2 caractères (nom, prénom ou email)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Email, nom ou prénom..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {clients && clients.length > 0 && (
                <div className="border rounded-lg divide-y">
                  {clients.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClient({ id: c.id, name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email, email: c.email })}
                      className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${selectedClient?.id === c.id ? "bg-primary/5" : ""}`}
                    >
                      <div className="font-medium">{c.first_name} {c.last_name}</div>
                      <div className="text-xs text-muted-foreground">{c.email} {c.phone && `• ${c.phone}`}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedClient && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {selectedClient.name}
                    </CardTitle>
                    <CardDescription>{selectedClient.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button variant="outline" onClick={() => setActionDialog("export")}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter données
                    </Button>
                    <Button variant="outline" onClick={() => setActionDialog("rectify")}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rectifier
                    </Button>
                    <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setActionDialog("anonymize")}>
                      <UserX className="h-4 w-4 mr-2" />
                      Anonymiser
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Cadre réglementaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Loi CI n° 2013-450</strong> du 19 juin 2013 relative à la protection des données à caractère personnel.</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Droit d'accès</strong> — Le client peut obtenir l'ensemble de ses données traitées (Art. 35)</li>
                <li><strong>Droit de rectification</strong> — Correction des données inexactes ou incomplètes (Art. 36)</li>
                <li><strong>Droit à l'effacement</strong> — Sous réserve des obligations légales de conservation (Art. 37)</li>
                <li><strong>Droit à la portabilité</strong> — Export structuré et lisible par machine (Art. 38)</li>
                <li><strong>Délai légal</strong> — Réponse sous 30 jours maximum, prorogeable une fois</li>
                <li><strong>Conservation</strong> — Données contractuelles 10 ans après fin du contrat (CIMA)</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={actionDialog === "export"} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter le dossier client</DialogTitle>
            <DialogDescription>
              Toutes les données personnelles de {selectedClient?.name} seront extraites. L'opération sera tracée dans le journal d'audit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleExport("json")}>
              <FileJson className="h-8 w-8" />
              <span>JSON</span>
              <span className="text-xs text-muted-foreground">Portabilité</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleExport("csv")}>
              <FileSpreadsheet className="h-8 w-8" />
              <span>CSV</span>
              <span className="text-xs text-muted-foreground">Lisible humain</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Anonymize Dialog */}
      <Dialog open={actionDialog === "anonymize"} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Anonymisation irréversible
            </DialogTitle>
            <DialogDescription>
              Les données identifiantes de {selectedClient?.name} seront remplacées par des valeurs neutres. Les données contractuelles sont conservées pour les obligations CIMA (10 ans).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Motif de la demande</label>
            <Textarea
              placeholder="Ex: Demande explicite du client suite à clôture de tous ses contrats..."
              value={anonymizeReason}
              onChange={(e) => setAnonymizeReason(e.target.value)}
              rows={4}
            />
            <div className="text-xs bg-amber-500/10 text-amber-800 dark:text-amber-300 p-3 rounded-lg border border-amber-200">
              ⚠️ La demande sera soumise pour validation à l'équipe Conformité avant exécution.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleAnonymize}>
              Soumettre pour validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rectify Dialog */}
      <Dialog open={actionDialog === "rectify"} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rectification des données</DialogTitle>
            <DialogDescription>
              Pour modifier les données de {selectedClient?.name}, accédez à sa fiche depuis la liste des clients. Les modifications sont automatiquement tracées dans le journal d'audit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setActionDialog(null)}>Compris</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}