import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  FileSpreadsheet,
  Gift,
  Handshake,
  Info,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Store,
  UserRound,
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

/* --- Membres & cartes --- */

type CardStage = "a_produire" | "en_production" | "a_envoyer" | "a_remettre";

const CARD_STAGES: { key: CardStage; label: string; tone: string; sla: string }[] = [
  { key: "a_produire", label: "À produire", tone: "border-l-[hsl(var(--orange))]", sla: "SLA 24 h" },
  { key: "en_production", label: "En production", tone: "border-l-primary", sla: "SLA 48 h" },
  { key: "a_envoyer", label: "À envoyer", tone: "border-l-[hsl(var(--warning))]", sla: "SLA 72 h" },
  { key: "a_remettre", label: "À remettre", tone: "border-l-[hsl(var(--success))]", sla: "SLA 5 j" },
];

type Priority = "critique" | "eleve" | "moyen" | "faible";

const MEMBER_CARDS: {
  member: string;
  company: string;
  cardRef: string;
  stage: CardStage;
  age: string;
  priority: Priority;
}[] = [
  { member: "Aristide Kouassi", company: "Ivoire Logistics", cardRef: "ZC-4412", stage: "a_produire", age: "3 j", priority: "critique" },
  { member: "Mariam Konan", company: "Abidjan Tech Hub", cardRef: "ZC-4413", stage: "a_produire", age: "1 j", priority: "moyen" },
  { member: "Salif Traoré", company: "Groupe Bâtir CI", cardRef: "ZC-4398", stage: "en_production", age: "2 j", priority: "eleve" },
  { member: "Adèle Yao", company: "Cacao Export Plus", cardRef: "ZC-4390", stage: "en_production", age: "1 j", priority: "faible" },
  { member: "Daniel Farah", company: "Clinique Farah", cardRef: "ZC-4377", stage: "a_envoyer", age: "4 j", priority: "critique" },
  { member: "Léa Bamba", company: "Prosuma Services", cardRef: "ZC-4371", stage: "a_envoyer", age: "2 j", priority: "moyen" },
  { member: "Yves N'Guessan", company: "Zô Distribution", cardRef: "ZC-4352", stage: "a_remettre", age: "6 j", priority: "eleve" },
  { member: "Fatou Diallo", company: "Diallo & Fils", cardRef: "ZC-4348", stage: "a_remettre", age: "1 j", priority: "faible" },
];

const CARD_STAGE_COUNTS: Record<CardStage, number> = {
  a_produire: 23,
  en_production: 31,
  a_envoyer: 17,
  a_remettre: 9,
};

/* --- Membres (annuaire) --- */

type MembershipStatus = "actif" | "a_completer" | "suspendu";
type CardStatus = "active" | "en_cours" | "aucune";
type Tier = "Bronze" | "Argent" | "Or" | "Platine";

const MEMBERSHIP_LABELS: Record<MembershipStatus, string> = {
  actif: "Actif",
  a_completer: "À compléter",
  suspendu: "Suspendu",
};

const MEMBERSHIP_STYLES: Record<MembershipStatus, string> = {
  actif: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40",
  a_completer: "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))] border-[hsl(var(--orange))]/30",
  suspendu: "bg-destructive/10 text-destructive border-destructive/30",
};

const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  active: "Carte active",
  en_cours: "En cours",
  aucune: "Aucune carte",
};

const CARD_STATUS_STYLES: Record<CardStatus, string> = {
  active: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40",
  en_cours: "bg-primary/10 text-primary border-primary/30",
  aucune: "bg-muted text-muted-foreground border-border",
};

const MEMBERS: {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  city: string;
  tier: Tier;
  membership: MembershipStatus;
  cardStatus: CardStatus;
  joinedAt: string;
  lastActivity: string;
  cards: { ref: string; issuedAt: string; status: string }[];
}[] = [
  {
    id: "ZM-1041",
    name: "Aristide Kouassi",
    company: "Ivoire Logistics",
    role: "Directeur général",
    email: "a.kouassi@ivoire-logistics.ci",
    phone: "+225 07 45 21 88 12",
    city: "Abidjan",
    tier: "Or",
    membership: "actif",
    joinedAt: "12/02/2026",
    lastActivity: "02/09/2026",
    cardStatus: "en_cours",
    cards: [
      { ref: "ZC-4412", issuedAt: "01/09/2026", status: "À produire" },
      { ref: "ZC-3980", issuedAt: "14/02/2026", status: "Remplacée" },
    ],
  },
  {
    id: "ZM-1042",
    name: "Mariam Konan",
    company: "Abidjan Tech Hub",
    role: "Responsable administrative",
    email: "m.konan@abjtechhub.ci",
    phone: "+225 05 11 74 09 33",
    city: "Abidjan",
    tier: "Argent",
    membership: "a_completer",
    joinedAt: "28/08/2026",
    lastActivity: "01/09/2026",
    cardStatus: "en_cours",
    cards: [{ ref: "ZC-4413", issuedAt: "02/09/2026", status: "À produire" }],
  },
  {
    id: "ZM-1043",
    name: "Salif Traoré",
    company: "Groupe Bâtir CI",
    role: "Gérant",
    email: "s.traore@batir-ci.com",
    phone: "+225 01 88 42 17 05",
    city: "Bouaké",
    tier: "Bronze",
    membership: "actif",
    joinedAt: "05/04/2026",
    lastActivity: "29/08/2026",
    cardStatus: "en_cours",
    cards: [{ ref: "ZC-4398", issuedAt: "30/08/2026", status: "En production" }],
  },
  {
    id: "ZM-1044",
    name: "Adèle Yao",
    company: "Cacao Export Plus",
    role: "Directrice financière",
    email: "a.yao@cacaoexport.ci",
    phone: "+225 07 63 90 24 71",
    city: "San-Pédro",
    tier: "Platine",
    membership: "actif",
    joinedAt: "19/01/2026",
    lastActivity: "03/09/2026",
    cardStatus: "active",
    cards: [{ ref: "ZC-4390", issuedAt: "22/01/2026", status: "Activée" }],
  },
  {
    id: "ZM-1045",
    name: "Daniel Farah",
    company: "Clinique Farah",
    role: "Directeur médical",
    email: "d.farah@cliniquefarah.ci",
    phone: "+225 27 22 41 60 18",
    city: "Abidjan",
    tier: "Or",
    membership: "actif",
    joinedAt: "02/03/2026",
    lastActivity: "31/08/2026",
    cardStatus: "active",
    cards: [{ ref: "ZC-4377", issuedAt: "06/03/2026", status: "Activée" }],
  },
  {
    id: "ZM-1046",
    name: "Léa Bamba",
    company: "Prosuma Services",
    role: "Responsable achats",
    email: "l.bamba@prosuma-services.ci",
    phone: "+225 05 44 12 87 60",
    city: "Abidjan",
    tier: "Argent",
    membership: "a_completer",
    joinedAt: "21/08/2026",
    lastActivity: "30/08/2026",
    cardStatus: "aucune",
    cards: [],
  },
  {
    id: "ZM-1047",
    name: "Yves N'Guessan",
    company: "Zô Distribution",
    role: "Fondateur",
    email: "y.nguessan@zo-distribution.ci",
    phone: "+225 01 27 55 34 92",
    city: "Korhogo",
    tier: "Bronze",
    membership: "suspendu",
    joinedAt: "11/12/2025",
    lastActivity: "12/06/2026",
    cardStatus: "aucune",
    cards: [{ ref: "ZC-4352", issuedAt: "15/12/2025", status: "Bloquée" }],
  },
  {
    id: "ZM-1048",
    name: "Fatou Diallo",
    company: "Diallo & Fils",
    role: "Directrice générale",
    email: "f.diallo@diallo-fils.ci",
    phone: "+225 07 90 61 22 44",
    city: "Abidjan",
    tier: "Platine",
    membership: "actif",
    joinedAt: "30/08/2026",
    lastActivity: "03/09/2026",
    cardStatus: "active",
    cards: [{ ref: "ZC-4348", issuedAt: "31/08/2026", status: "Activée" }],
  },
];


/* --- Partenaires & avantages --- */

const BENEFITS_CATALOG: {
  name: string;
  partner: string;
  category: string;
  tier: string;
  published: "publie" | "brouillon" | "a_valider";
}[] = [
  { name: "-15 % consultations générales", partner: "Clinique Farah", category: "Santé", tier: "Bronze", published: "publie" },
  { name: "Bilan sanguin -25 %", partner: "Clinique Farah", category: "Santé", tier: "Argent", published: "a_valider" },
  { name: "-10 % carburant professionnel", partner: "Total Energies", category: "Carburant", tier: "Bronze", published: "publie" },
  { name: "Lavage véhicule offert", partner: "Total Energies", category: "Carburant", tier: "Or", published: "brouillon" },
  { name: "-20 % forfait data pro", partner: "Orange CI Business", category: "Télécom", tier: "Argent", published: "publie" },
  { name: "Livraison B2B offerte", partner: "Prosuma", category: "Grande distribution", tier: "Or", published: "a_valider" },
  { name: "Conciergerie dédiée", partner: "Sanlam Allianz", category: "Services", tier: "Platine", published: "publie" },
  { name: "Check-up PME offert", partner: "Pharmacie Danga", category: "Santé", tier: "Platine", published: "brouillon" },
];

const PUBLICATION_LABELS: Record<string, string> = {
  publie: "Publié",
  brouillon: "Brouillon",
  a_valider: "À valider",
};

const PUBLICATION_STYLES: Record<string, string> = {
  publie: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40",
  brouillon: "bg-muted text-muted-foreground border-border",
  a_valider: "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))] border-[hsl(var(--orange))]/30",
};

const CONVENTIONS = [
  { partner: "Clinique Farah", start: "01/02/2026", end: "31/01/2027", status: "Active", benefits: 2 },
  { partner: "Total Energies", start: "15/03/2026", end: "30/09/2026", status: "À renouveler", benefits: 2 },
  { partner: "Orange CI Business", start: "01/01/2026", end: "31/12/2026", status: "Active", benefits: 1 },
  { partner: "Prosuma", start: "10/04/2026", end: "09/10/2026", status: "À renouveler", benefits: 1 },
  { partner: "Pharmacie Danga", start: "01/06/2026", end: "31/05/2027", status: "Active", benefits: 1 },
];

const PUBLICATION_RULES = [
  "Toute nouvelle offre est créée en brouillon par le pôle Marketing.",
  "Une convention partenaire signée et en cours de validité est obligatoire avant publication.",
  "La validation finale relève du rôle Admin ; le palier d'éligibilité doit être renseigné.",
  "Une offre liée à une convention expirée est automatiquement dépubliée.",
];

/* --- Animation --- */

const CAMPAIGNS = [
  { name: "Relance cartes non activées", channel: "WhatsApp", audience: "231 membres", status: "Programmée", date: "08/09", rate: "—" },
  { name: "Nouveaux avantages santé", channel: "WhatsApp", audience: "1 097 membres", status: "Envoyée", date: "28/08", rate: "62 % lus" },
  { name: "Enquête satisfaction T3", channel: "E-mail", audience: "612 membres Bronze", status: "Brouillon", date: "—", rate: "—" },
  { name: "Invitation networking Zô", channel: "SMS", audience: "420 membres Or/Platine", status: "Envoyée", date: "21/08", rate: "48 % clics" },
];

const EVENTS = [
  { name: "Petit-déjeuner PME – Plateau", date: "12 sept. 2026", registered: 48, capacity: 60, city: "Abidjan" },
  { name: "Atelier gestion des risques", date: "26 sept. 2026", registered: 31, capacity: 40, city: "Bouaké" },
  { name: "Networking partenaires Zô", date: "10 oct. 2026", registered: 12, capacity: 80, city: "Abidjan" },
];

/* --- Rapports --- */

const REPORTS = [
  { name: "Activité membres & adhésions", scope: "Direction, Admin", freq: "Mensuel" },
  { name: "Production et logistique des cartes", scope: "Marketing, Admin", freq: "Hebdomadaire" },
  { name: "Usage des avantages par partenaire", scope: "Marketing, Direction", freq: "Mensuel" },
  { name: "Conventions et facturation partenaires", scope: "Admin", freq: "Mensuel" },
  { name: "Satisfaction et animation", scope: "Direction, Marketing", freq: "Trimestriel" },
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

function ScopeNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", SEVERITY_STYLES[priority])}>
      {SEVERITY_LABELS[priority]}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Pilotage                                                        */
/* ------------------------------------------------------------------ */

function PilotageView() {
  const totalMembers = TIERS.reduce((sum, t) => sum + t.members, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        Vue consolidée du programme. Les indicateurs financiers détaillés et la configuration
        restent réservés aux rôles Direction et Admin.
      </ScopeNote>

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

/* ------------------------------------------------------------------ */
/* 2. Membres (annuaire)                                              */
/* ------------------------------------------------------------------ */

function MembresView() {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [membership, setMembership] = useState("all");
  const [cardStatus, setCardStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = MEMBERS.filter((m) => {
    const q = search.trim().toLowerCase();
    return (
      (q === "" ||
        m.name.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)) &&
      (tier === "all" || m.tier === tier) &&
      (membership === "all" || m.membership === membership) &&
      (cardStatus === "all" || m.cardStatus === cardStatus)
    );
  });

  const selected = MEMBERS.find((m) => m.id === selectedId) ?? null;

  const kpis = [
    {
      label: "Membres actifs",
      value: MEMBERS.filter((m) => m.membership === "actif").length.toLocaleString("fr-FR"),
      trend: "Adhésions en cours de validité",
      icon: Users,
    },
    {
      label: "Adhésions à compléter",
      value: MEMBERS.filter((m) => m.membership === "a_completer").length.toLocaleString("fr-FR"),
      trend: "Pièces ou informations manquantes",
      icon: AlertTriangle,
    },
    {
      label: "Nouveaux membres",
      value: "2",
      trend: "Sur la période sélectionnée",
      icon: UserRound,
    },
    {
      label: "Sans carte active",
      value: MEMBERS.filter((m) => m.cardStatus !== "active").length.toLocaleString("fr-FR"),
      trend: "À orienter vers la file Cartes",
      icon: CreditCard,
    },
  ];

  const resetFilters = () => {
    setSearch("");
    setTier("all");
    setMembership("all");
    setCardStatus("all");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        Annuaire des membres du programme. La Souscription complète les adhésions, le Marketing
        anime, la Direction et l'Admin consultent l'ensemble du périmètre.
      </ScopeNote>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-base">Annuaire des membres</CardTitle>
              <CardDescription>
                {filtered.length} membre(s) affiché(s) sur {MEMBERS.length}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, entreprise, n° membre…"
                  className="pl-9 h-9"
                />
              </div>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Palier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les paliers</SelectItem>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Argent">Argent</SelectItem>
                  <SelectItem value="Or">Or</SelectItem>
                  <SelectItem value="Platine">Platine</SelectItem>
                </SelectContent>
              </Select>
              <Select value={membership} onValueChange={setMembership}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Adhésion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les adhésions</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="a_completer">À compléter</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cardStatus} onValueChange={setCardStatus}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Carte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les cartes</SelectItem>
                  <SelectItem value="active">Carte active</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="aucune">Aucune carte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead className="hidden md:table-cell">Entreprise</TableHead>
                  <TableHead>Palier</TableHead>
                  <TableHead className="hidden sm:table-cell">Adhésion</TableHead>
                  <TableHead className="hidden lg:table-cell">Carte</TableHead>
                  <TableHead className="hidden lg:table-cell">Dernière activité</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{m.id}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {m.company}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {m.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", MEMBERSHIP_STYLES[m.membership])}
                      >
                        {MEMBERSHIP_LABELS[m.membership]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", CARD_STATUS_STYLES[m.cardStatus])}
                      >
                        {CARD_STATUS_LABELS[m.cardStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                      {m.lastActivity}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setSelectedId(m.id)}
                      >
                        Ouvrir fiche
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm font-medium">Aucun membre ne correspond</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Aucun membre Zô PME ne correspond à cette combinaison de recherche et de
                          filtres. Élargissez le palier ou le statut d'adhésion.
                        </p>
                        <Button variant="outline" size="sm" className="mt-1" onClick={resetFilters}>
                          Réinitialiser les filtres
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.role} · {selected.company}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {selected.tier}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", MEMBERSHIP_STYLES[selected.membership])}
                  >
                    {MEMBERSHIP_LABELS[selected.membership]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", CARD_STATUS_STYLES[selected.cardStatus])}
                  >
                    {CARD_STATUS_LABELS[selected.cardStatus]}
                  </Badge>
                </div>

                <div className="rounded-lg border border-border divide-y divide-border text-sm">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">N° membre</span>
                    <span className="ml-auto font-mono text-xs">{selected.id}</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Entreprise</span>
                    <span className="ml-auto text-right">
                      {selected.company} · {selected.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">E-mail</span>
                    <span className="ml-auto text-right truncate">{selected.email}</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="ml-auto whitespace-nowrap">{selected.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Adhésion depuis</span>
                    <span className="ml-auto">{selected.joinedAt}</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Dernière activité</span>
                    <span className="ml-auto">{selected.lastActivity}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Résumé des cartes</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setSelectedId(null);
                        window.location.assign("/b2b/zo-pme?vue=cartes");
                      }}
                    >
                      Voir dans Cartes
                    </Button>
                  </div>
                  {selected.cards.length === 0 ? (
                    <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-3">
                      Aucune carte émise pour ce membre à ce jour.
                    </p>
                  ) : (
                    <ul className="rounded-lg border border-border divide-y divide-border">
                      {selected.cards.map((c) => (
                        <li key={c.ref} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs">{c.ref}</span>
                          <span className="text-xs text-muted-foreground">{c.issuedAt}</span>
                          <Badge variant="secondary" className="ml-auto text-[10px]">
                            {c.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 bis. Cartes                                                      */
/* ------------------------------------------------------------------ */

function CartesView() {

  const [stage, setStage] = useState<CardStage>("a_produire");
  const queue = MEMBER_CARDS.filter((c) => c.stage === stage);
  const stageMeta = CARD_STAGES.find((s) => s.key === stage)!;

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        Files de traitement individuelles. Les actions de production et d'expédition sont ouvertes
        aux rôles Marketing et Admin ; la Direction consulte les volumes et le respect des SLA.
      </ScopeNote>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {CARD_STAGES.map((s) => {
          const active = s.key === stage;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setStage(s.key)}
              className={cn(
                "text-left rounded-lg border border-l-4 border-border bg-muted/30 p-3 sm:p-4 transition-colors",
                s.tone,
                active ? "bg-primary/5 border-primary/40" : "hover:bg-muted/60"
              )}
            >
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">
                {CARD_STAGE_COUNTS[s.key].toLocaleString("fr-FR")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">{s.sla}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">File « {stageMeta.label} »</CardTitle>
          <CardDescription>
            {queue.length} carte(s) individuelle(s) · {stageMeta.sla}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carte</TableHead>
                  <TableHead>Membre</TableHead>
                  <TableHead className="hidden md:table-cell">Entreprise</TableHead>
                  <TableHead className="hidden sm:table-cell">Ancienneté</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((c) => (
                  <TableRow key={c.cardRef}>
                    <TableCell className="font-mono text-xs">{c.cardRef}</TableCell>
                    <TableCell className="font-medium">{c.member}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {c.company}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {c.age}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={c.priority} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          toast.info(`Démonstration — suivi de la carte ${c.cardRef}`)
                        }
                      >
                        Suivre
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {queue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                      Aucune carte dans cette file.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Priorités SLA</CardTitle>
          <CardDescription>Respect des délais par étape du cycle carte</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {CARD_STAGES.map((s, i) => {
            const compliance = [72, 88, 64, 95][i];
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {compliance} % dans le {s.sla}
                  </span>
                </div>
                <Progress value={compliance} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Partenaires & avantages                                         */
/* ------------------------------------------------------------------ */

function PartenairesView() {
  const [partner, setPartner] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const partners = Array.from(new Set(BENEFITS_CATALOG.map((b) => b.partner)));
  const categories = Array.from(new Set(BENEFITS_CATALOG.map((b) => b.category)));

  const filtered = BENEFITS_CATALOG.filter(
    (b) =>
      (partner === "all" || b.partner === partner) &&
      (category === "all" || b.category === category) &&
      (status === "all" || b.published === status)
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        Le catalogue est visible par tous les rôles. La création reste au pôle Marketing, la
        validation et la publication au rôle Admin.
      </ScopeNote>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Catalogue d'avantages</CardTitle>
              <CardDescription>
                {filtered.length} avantage(s) affiché(s) sur {BENEFITS_CATALOG.length}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
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
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Publication" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="publie">Publié</SelectItem>
                  <SelectItem value="a_valider">À valider</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
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
              <Badge
                variant="outline"
                className={cn("mt-2 text-[10px] px-1.5 py-0", PUBLICATION_STYLES[b.published])}
              >
                {PUBLICATION_LABELS[b.published]}
              </Badge>
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
              <Handshake className="h-4 w-4 text-primary" />
              Conventions partenaires
            </CardTitle>
            <CardDescription>Validité et couverture des accords en cours</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partenaire</TableHead>
                    <TableHead className="hidden sm:table-cell">Début</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="text-right">Offres</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONVENTIONS.map((c) => (
                    <TableRow key={c.partner}>
                      <TableCell className="font-medium">{c.partner}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {c.start}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{c.end}</TableCell>
                      <TableCell className="text-right">{c.benefits}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            c.status === "Active"
                              ? PUBLICATION_STYLES.publie
                              : PUBLICATION_STYLES.a_valider
                          )}
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Règles de publication & validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PUBLICATION_RULES.map((rule) => (
                <li key={rule} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Animation                                                       */
/* ------------------------------------------------------------------ */

function AnimationView() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        L'envoi des campagnes et la gestion des événements sont pilotés par le pôle Marketing ; les
        autres rôles disposent d'un accès en consultation.
      </ScopeNote>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            Campagnes & communications
          </CardTitle>
          <CardDescription>WhatsApp, SMS et e-mail à destination des membres Zô PME</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campagne</TableHead>
                  <TableHead className="hidden sm:table-cell">Canal</TableHead>
                  <TableHead className="hidden md:table-cell">Audience</TableHead>
                  <TableHead className="hidden lg:table-cell">Performance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CAMPAIGNS.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {c.channel}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {c.audience}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {c.rate}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{c.date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Separator />
          <div className="p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Démonstration — création de campagne")}
            >
              <Send className="h-4 w-4 mr-2" />
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
          <CardDescription>Suivi de participation par événement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {EVENTS.map((e) => (
            <div key={e.name}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium truncate">{e.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {e.city} · {e.date}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <Progress value={Math.round((e.registered / e.capacity) * 100)} className="h-2" />
                <span className="text-xs text-muted-foreground shrink-0">
                  {e.registered}/{e.capacity} inscrits
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Rapports                                                        */
/* ------------------------------------------------------------------ */

function RapportsView() {
  const [region, setRegion] = useState("all");
  const [segment, setSegment] = useState("all");
  const maxCount = Math.max(...MONTHLY_CONTRACTS.map((m) => m.count));

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        Le périmètre des données exportées dépend du rôle : la Direction et l'Admin accèdent à
        l'ensemble du programme, le Marketing aux données d'animation, la Souscription aux dossiers
        d'adhésion.
      </ScopeNote>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtres de restitution</CardTitle>
          <CardDescription>La période se règle dans l'en-tête de l'espace</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Région" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les régions</SelectItem>
              <SelectItem value="abidjan">Abidjan</SelectItem>
              <SelectItem value="bouake">Bouaké</SelectItem>
              <SelectItem value="san-pedro">San-Pédro</SelectItem>
              <SelectItem value="korhogo">Korhogo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les segments</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
              <SelectItem value="argent">Argent</SelectItem>
              <SelectItem value="or">Or</SelectItem>
              <SelectItem value="platine">Platine</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rapports disponibles</CardTitle>
          <CardDescription>Export par type, au format PDF ou Excel</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rapport</TableHead>
                  <TableHead className="hidden md:table-cell">Visibilité</TableHead>
                  <TableHead className="hidden sm:table-cell">Fréquence</TableHead>
                  <TableHead className="text-right">Exports</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REPORTS.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {r.scope}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {r.freq}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => toast.info(`Démonstration — export PDF : ${r.name}`)}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => toast.info(`Démonstration — export Excel : ${r.name}`)}
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                          Excel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Adhésions validées par mois</CardTitle>
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
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

const VUE_LABELS: Record<string, { title: string; subtitle: string }> = {
  pilotage: {
    title: "Pilotage",
    subtitle: "Indicateurs clés, fidélité, alertes et performance partenaires",
  },
  membres: {
    title: "Membres & cartes",
    subtitle: "Files de production et de remise des cartes, priorités SLA et suivi individuel",
  },
  partenaires: {
    title: "Partenaires & avantages",
    subtitle: "Catalogue, publication des offres et conventions partenaires",
  },
  animation: {
    title: "Animation",
    subtitle: "Campagnes, communications et événements du Club Zô PME",
  },
  rapports: {
    title: "Rapports",
    subtitle: "Restitutions filtrables et exports PDF / Excel par type",
  },
};

export default function ZoPmePage() {
  const [period, setPeriod] = useState("30d");
  const [searchParams] = useSearchParams();
  const vueParam = searchParams.get("vue") ?? "pilotage";
  const vue = VUE_LABELS[vueParam] ? vueParam : "pilotage";
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

      {vue === "pilotage" && <PilotageView />}
      {vue === "membres" && <MembresCartesView />}
      {vue === "partenaires" && <PartenairesView />}
      {vue === "animation" && <AnimationView />}
      {vue === "rapports" && <RapportsView />}
    </div>
  );
}
