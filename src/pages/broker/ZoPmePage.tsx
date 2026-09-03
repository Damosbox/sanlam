import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Circle,
  CreditCard,
  Download,
  FileSpreadsheet,
  Gift,
  Handshake,
  MessageCircle,
  Smile,
  Store,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Données de démonstration                                            */
/* ------------------------------------------------------------------ */

const KPIS = [
  { label: "Membres actifs", value: "1 284", trend: "+8,4 % vs période préc.", icon: Users },
  { label: "Cartes actives", value: "1 097", trend: "85 % du parc émis", icon: CreditCard },
  { label: "Partenaires actifs", value: "42", trend: "+3 nouvelles conventions", icon: Handshake },
  { label: "Satisfaction", value: "4,6 / 5", trend: "312 avis collectés", icon: Smile },
];

const TIERS = [
  { name: "Bronze", members: 612, color: "hsl(28 100% 49%)" },
  { name: "Argent", members: 392, color: "hsl(210 8% 62%)" },
  { name: "Or", members: 214, color: "hsl(42 100% 49%)" },
  { name: "Platine", members: 66, color: "hsl(var(--primary))" },
];

const TOP_PARTNERS = [
  { name: "Pharmacie Cocody Danga", category: "Santé", usages: 412, volume: 8_450_000 },
  { name: "Total Energies – Plateau", category: "Carburant", usages: 366, volume: 7_120_000 },
  { name: "Prosuma / Cash Center", category: "Grande distribution", usages: 298, volume: 5_640_000 },
  { name: "Clinique Farah", category: "Santé", usages: 187, volume: 4_310_000 },
  { name: "Orange CI Business", category: "Télécom", usages: 154, volume: 2_980_000 },
];

const TOP_BENEFITS = [
  { name: "-15 % consultations générales", partner: "Clinique Farah", used: 246 },
  { name: "-10 % carburant professionnel", partner: "Total Energies", used: 221 },
  { name: "Check-up PME offert", partner: "Pharmacie Danga", used: 168 },
  { name: "-20 % forfait data pro", partner: "Orange CI Business", used: 134 },
  { name: "Livraison offerte B2B", partner: "Prosuma", used: 97 },
];

type Severity = "critique" | "eleve" | "moyen" | "faible";

const ALERTS: { title: string; detail: string; severity: Severity; icon: typeof AlertTriangle }[] = [
  {
    title: "SLA d'activation dépassé",
    detail: "14 cartes en attente d'activation depuis plus de 72 h.",
    severity: "critique",
    icon: AlertTriangle,
  },
  {
    title: "Conventions à renouveler",
    detail: "5 conventions partenaires expirent sous 30 jours.",
    severity: "eleve",
    icon: CalendarClock,
  },
  {
    title: "Inactivité membres",
    detail: "128 membres sans usage d'avantage depuis 90 jours.",
    severity: "moyen",
    icon: Users,
  },
  {
    title: "Anomalies de facturation",
    detail: "3 relevés partenaires présentent un écart de remise.",
    severity: "faible",
    icon: FileSpreadsheet,
  },
];

const SEVERITY_STYLES: Record<Severity, string> = {
  critique: "bg-destructive/10 text-destructive border-destructive/30",
  eleve: "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))] border-[hsl(var(--orange))]/30",
  moyen: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning-foreground))] border-[hsl(var(--warning))]/40",
  faible: "bg-muted text-muted-foreground border-border",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critique: "Critique",
  eleve: "Élevé",
  moyen: "Moyen",
  faible: "Faible",
};

const CARD_STATUSES = [
  { key: "a_creer", label: "À créer", count: 23, tone: "border-l-[hsl(var(--orange))]" },
  { key: "a_envoyer", label: "À envoyer", count: 17, tone: "border-l-[hsl(var(--warning))]" },
  { key: "activee", label: "Activée", count: 1097, tone: "border-l-[hsl(var(--success))]" },
  { key: "bloquee", label: "Bloquée", count: 9, tone: "border-l-destructive" },
];

const BENEFITS_CATALOG = [
  { name: "-15 % consultations générales", partner: "Clinique Farah", category: "Santé", tier: "Bronze" },
  { name: "Bilan sanguin -25 %", partner: "Clinique Farah", category: "Santé", tier: "Argent" },
  { name: "-10 % carburant professionnel", partner: "Total Energies", category: "Carburant", tier: "Bronze" },
  { name: "Lavage véhicule offert", partner: "Total Energies", category: "Carburant", tier: "Or" },
  { name: "-20 % forfait data pro", partner: "Orange CI Business", category: "Télécom", tier: "Argent" },
  { name: "Livraison B2B offerte", partner: "Prosuma", category: "Grande distribution", tier: "Or" },
  { name: "Conciergerie dédiée", partner: "Sanlam Allianz", category: "Services", tier: "Platine" },
  { name: "Check-up PME offert", partner: "Pharmacie Danga", category: "Santé", tier: "Platine" },
];

const CAMPAIGNS = [
  { name: "Relance cartes non activées", audience: "231 membres", status: "Programmée", date: "08/09" },
  { name: "Nouveaux avantages santé", audience: "1 097 membres", status: "Envoyée", date: "28/08" },
  { name: "Enquête satisfaction T3", audience: "612 membres Bronze", status: "Brouillon", date: "—" },
];

const EVENTS = [
  { name: "Petit-déjeuner PME – Plateau", date: "12 sept. 2026", registered: 48, capacity: 60 },
  { name: "Atelier gestion des risques", date: "26 sept. 2026", registered: 31, capacity: 40 },
  { name: "Networking partenaires Zô", date: "10 oct. 2026", registered: 12, capacity: 80 },
];

type FileStage = "a_controler" | "conforme" | "active";

const FILES: {
  ref: string;
  company: string;
  contact: string;
  members: number;
  premium: number;
  stage: FileStage;
}[] = [
  { ref: "ZO-2026-0141", company: "Ivoire Logistics SARL", contact: "K. Aristide", members: 24, premium: 3_450_000, stage: "a_controler" },
  { ref: "ZO-2026-0140", company: "Abidjan Tech Hub", contact: "M. Konan", members: 12, premium: 1_820_000, stage: "a_controler" },
  { ref: "ZO-2026-0138", company: "Groupe Bâtir CI", contact: "S. Traoré", members: 41, premium: 6_120_000, stage: "conforme" },
  { ref: "ZO-2026-0135", company: "Cacao Export Plus", contact: "A. Yao", members: 33, premium: 4_780_000, stage: "conforme" },
  { ref: "ZO-2026-0129", company: "Clinique Farah", contact: "D. Farah", members: 58, premium: 8_940_000, stage: "active" },
  { ref: "ZO-2026-0124", company: "Prosuma Services", contact: "L. Bamba", members: 76, premium: 11_300_000, stage: "active" },
];

const STAGE_LABELS: Record<FileStage, string> = {
  a_controler: "À contrôler",
  conforme: "Conforme",
  active: "Activé",
};

const CHECKLIST = [
  { label: "Registre de commerce (RCCM) fourni", done: true },
  { label: "Attestation fiscale à jour", done: true },
  { label: "Liste nominative des salariés", done: true },
  { label: "Mandat de prélèvement signé", done: false },
  { label: "Screening LCB-FT validé", done: false },
];

const MONTHLY_CONTRACTS = [
  { month: "Avr", count: 18 },
  { month: "Mai", count: 24 },
  { month: "Juin", count: 21 },
  { month: "Juil", count: 32 },
  { month: "Août", count: 29 },
  { month: "Sept", count: 37 },
];

/* ------------------------------------------------------------------ */
/* Sous-composants locaux                                             */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend: string;
  icon: typeof Users;
}) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{trend}</p>
          </div>
          <Icon className="h-5 w-5 text-primary shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

function DirectionView() {
  const totalMembers = TIERS.reduce((sum, t) => sum + t.members, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Répartition fidélité</CardTitle>
          <CardDescription>
            {totalMembers.toLocaleString("fr-FR")} membres répartis sur les 4 paliers Zô PME
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {TIERS.map((tier) => {
            const pct = Math.round((tier.members / totalMembers) * 100);
            return (
              <div key={tier.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    {tier.name}
                  </span>
                  <span className="text-muted-foreground">
                    {tier.members.toLocaleString("fr-FR")} · {pct} %
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: tier.color }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Top 5 partenaires
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {TOP_PARTNERS.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                  <span className="text-xs font-semibold text-muted-foreground w-4">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.category} · {p.usages} usages
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold shrink-0">
                    {formatFCFA(p.volume)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Top 5 avantages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {TOP_BENEFITS.map((b, i) => (
                <li key={b.name} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                  <span className="text-xs font-semibold text-muted-foreground w-4">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.partner}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {b.used}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alertes opérationnelles</CardTitle>
          <CardDescription>Points de vigilance à traiter par ordre de sévérité</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {ALERTS.map((alert) => (
            <div
              key={alert.title}
              className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
            >
              <alert.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] px-1.5 py-0", SEVERITY_STYLES[alert.severity])}
                  >
                    {SEVERITY_LABELS[alert.severity]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MarketingView() {
  const [partner, setPartner] = useState("all");
  const [category, setCategory] = useState("all");

  const partners = Array.from(new Set(BENEFITS_CATALOG.map((b) => b.partner)));
  const categories = Array.from(new Set(BENEFITS_CATALOG.map((b) => b.category)));

  const filtered = BENEFITS_CATALOG.filter(
    (b) =>
      (partner === "all" || b.partner === partner) &&
      (category === "all" || b.category === category)
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cartes à traiter</CardTitle>
          <CardDescription>Répartition du parc de cartes Zô PME par statut</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {CARD_STATUSES.map((s) => (
            <div
              key={s.key}
              className={cn(
                "rounded-lg border border-l-4 border-border bg-muted/30 p-3 sm:p-4",
                s.tone
              )}
            >
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.count.toLocaleString("fr-FR")}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-xs"
                onClick={() => toast.info(`Démonstration — file « ${s.label} »`)}
              >
                Traiter
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Catalogue d'avantages</CardTitle>
              <CardDescription>
                {filtered.length} avantage(s) affiché(s) sur {BENEFITS_CATALOG.length}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={partner} onValueChange={setPartner}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Partenaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les partenaires</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <div key={b.name} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{b.name}</p>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {b.tier}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {b.partner} · {b.category}
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full py-4 text-center">
              Aucun avantage pour cette combinaison de filtres.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Campagnes WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {CAMPAIGNS.map((c) => (
                <li key={c.name} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.audience} · {c.date}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {c.status}
                  </Badge>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Démonstration — création de campagne")}
              >
                Nouvelle campagne
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Événements à venir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {EVENTS.map((e) => (
              <div key={e.name}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium truncate">{e.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{e.date}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <Progress
                    value={Math.round((e.registered / e.capacity) * 100)}
                    className="h-2"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {e.registered}/{e.capacity}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SouscriptionView() {
  const [selectedRef, setSelectedRef] = useState(FILES[0].ref);
  const selected = FILES.find((f) => f.ref === selectedRef) ?? FILES[0];
  const maxCount = Math.max(...MONTHLY_CONTRACTS.map((m) => m.count));

  const stageBadge = (stage: FileStage) => {
    const styles: Record<FileStage, string> = {
      a_controler: "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))] border-[hsl(var(--orange))]/30",
      conforme: "bg-primary/10 text-primary border-primary/30",
      active: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40",
    };
    return (
      <Badge variant="outline" className={cn("text-[11px]", styles[stage])}>
        {STAGE_LABELS[stage]}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 grid-cols-3">
        {(Object.keys(STAGE_LABELS) as FileStage[]).map((stage) => (
          <Card key={stage}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{STAGE_LABELS[stage]}</p>
              <p className="text-2xl font-bold mt-1">
                {FILES.filter((f) => f.stage === stage).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dossiers Zô PME</CardTitle>
          <CardDescription>Sélectionnez un dossier pour voir sa checklist de conformité</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Salariés</TableHead>
                  <TableHead className="text-right">Prime annuelle</TableHead>
                  <TableHead>Étape</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FILES.map((f) => (
                  <TableRow
                    key={f.ref}
                    onClick={() => setSelectedRef(f.ref)}
                    className={cn(
                      "cursor-pointer",
                      f.ref === selectedRef && "bg-primary/5"
                    )}
                  >
                    <TableCell className="font-mono text-xs">{f.ref}</TableCell>
                    <TableCell className="font-medium">{f.company}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {f.contact}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right">{f.members}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatFCFA(f.premium)}
                    </TableCell>
                    <TableCell>{stageBadge(f.stage)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Checklist de conformité</CardTitle>
            <CardDescription>
              {selected.company} · {selected.ref}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {CHECKLIST.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      item.done ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => toast.info("Démonstration — validation de conformité")}
            >
              Valider la conformité
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contrats validés par mois</CardTitle>
            <CardDescription>Historique des 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-40">
              {MONTHLY_CONTRACTS.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold">{m.count}</span>
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all"
                    style={{ height: `${(m.count / maxCount) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

const VUE_LABELS: Record<string, { title: string; subtitle: string }> = {
  direction: {
    title: "Pilotage",
    subtitle: "Pilotage du programme PME : adhésions, cartes, partenaires et conformité",
  },
  marketing: {
    title: "Marketing & animation",
    subtitle: "Cartes à traiter, catalogue d'avantages, campagnes et événements",
  },
  souscription: {
    title: "Souscription",
    subtitle: "Dossiers d'adhésion, contrôle de conformité et activation",
  },
};

export default function ZoPmePage() {
  const [period, setPeriod] = useState("30d");
  const [searchParams] = useSearchParams();
  const vueParam = searchParams.get("vue") ?? "direction";
  const vue = VUE_LABELS[vueParam] ? vueParam : "direction";
  const labels = VUE_LABELS[vue];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Espace Zô PME
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">{labels.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{labels.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[170px] h-9">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="ytd">Année en cours</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => toast.info("Démonstration — export PDF")}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => toast.info("Démonstration — export Excel")}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {vue === "direction" && <DirectionView />}
      {vue === "marketing" && <MarketingView />}
      {vue === "souscription" && <SouscriptionView />}
    </div>
  );
}

