import type { Kpi, OperationalAlert, ReportDefinition, Severity } from "./types";

export const SEVERITY_LABELS: Record<Severity, string> = {
  critique: "Critique",
  eleve: "Élevé",
  moyen: "Moyen",
  faible: "Faible",
};

export const SEVERITY_STYLES: Record<Severity, string> = {
  critique: "bg-destructive/10 text-destructive border-destructive/30",
  eleve:
    "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))] border-[hsl(var(--orange))]/30",
  moyen:
    "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning-foreground))] border-[hsl(var(--warning))]/40",
  faible: "bg-muted text-muted-foreground border-border",
};

export const SEVERITY_RANK: Record<Severity, number> = {
  critique: 0,
  eleve: 1,
  moyen: 2,
  faible: 3,
};

export const DIRECTION_KPIS: Record<string, Kpi[]> = {
  "7d": [
    { key: "membres", label: "PME actives", value: "1 284", trend: "+16 sur 7 j", trendDirection: "up" },
    { key: "cartes", label: "Cartes actives", value: "1 097", trend: "+22 sur 7 j", trendDirection: "up" },
    { key: "partenaires", label: "Partenaires actifs", value: "42", trend: "stable", trendDirection: "flat" },
    { key: "satisfaction", label: "Satisfaction", value: "4,6 / 5", trend: "38 avis", trendDirection: "up" },
  ],
  "30d": [
    { key: "membres", label: "PME actives", value: "1 284", trend: "+8,4 % vs période préc.", trendDirection: "up" },
    { key: "cartes", label: "Cartes actives", value: "1 097", trend: "85 % du parc émis", trendDirection: "up" },
    { key: "partenaires", label: "Partenaires actifs", value: "42", trend: "+3 conventions", trendDirection: "up" },
    { key: "satisfaction", label: "Satisfaction", value: "4,6 / 5", trend: "312 avis collectés", trendDirection: "up" },
  ],
  "90d": [
    { key: "membres", label: "PME actives", value: "1 251", trend: "+14,2 % vs trimestre préc.", trendDirection: "up" },
    { key: "cartes", label: "Cartes actives", value: "1 042", trend: "82 % du parc émis", trendDirection: "flat" },
    { key: "partenaires", label: "Partenaires actifs", value: "39", trend: "-1 convention expirée", trendDirection: "down" },
    { key: "satisfaction", label: "Satisfaction", value: "4,4 / 5", trend: "864 avis collectés", trendDirection: "up" },
  ],
  ytd: [
    { key: "membres", label: "PME actives", value: "1 284", trend: "+41 % depuis janvier", trendDirection: "up" },
    { key: "cartes", label: "Cartes actives", value: "1 097", trend: "+512 depuis janvier", trendDirection: "up" },
    { key: "partenaires", label: "Partenaires actifs", value: "42", trend: "+11 depuis janvier", trendDirection: "up" },
    { key: "satisfaction", label: "Satisfaction", value: "4,5 / 5", trend: "2 140 avis collectés", trendDirection: "up" },
  ],
};

export const PERIOD_OPTIONS = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "90 derniers jours" },
  { value: "ytd", label: "Année en cours" },
];

export const MEMBERSHIP_TREND = [
  { month: "Avr", adhesions: 62, resiliations: 8 },
  { month: "Mai", adhesions: 74, resiliations: 11 },
  { month: "Juin", adhesions: 69, resiliations: 6 },
  { month: "Juil", adhesions: 91, resiliations: 9 },
  { month: "Août", adhesions: 103, resiliations: 12 },
  { month: "Sept", adhesions: 118, resiliations: 7 },
];

export const OPERATIONAL_ALERTS: OperationalAlert[] = [
  {
    id: "AL-01",
    titre: "SLA de production dépassé",
    detail: "3 cartes dépassent leur SLA cible dans la file de production.",
    severity: "critique",
    categorie: "sla",
    vueCible: "cartes",
  },
  {
    id: "AL-02",
    titre: "Conventions à renouveler",
    detail: "2 conventions partenaires expirent sous 30 jours, 1 est déjà expirée.",
    severity: "eleve",
    categorie: "convention",
    vueCible: "partenaires",
  },
  {
    id: "AL-03",
    titre: "Inactivité membres",
    detail: "128 PME sans usage d'avantage depuis 90 jours.",
    severity: "moyen",
    categorie: "inactivite",
    vueCible: "membres",
  },
  {
    id: "AL-04",
    titre: "Anomalies de facturation partenaires",
    detail: "3 relevés présentent un écart de remise à instruire.",
    severity: "faible",
    categorie: "anomalie",
    vueCible: "partenaires",
  },
];

export const REPORTS: ReportDefinition[] = [
  {
    id: "RP-01",
    nom: "Activité PME & adhésions",
    perimetre: "Direction, Admin Zô PME",
    frequence: "Mensuel",
    dernierGenere: "01/09/2026",
    formats: ["PDF", "Excel"],
  },
  {
    id: "RP-02",
    nom: "Production et logistique des cartes",
    perimetre: "Marketing, Admin Zô PME",
    frequence: "Hebdomadaire",
    dernierGenere: "02/09/2026",
    formats: ["Excel"],
  },
  {
    id: "RP-03",
    nom: "Usage des avantages par partenaire",
    perimetre: "Marketing, Direction",
    frequence: "Mensuel",
    dernierGenere: "01/09/2026",
    formats: ["PDF", "Excel"],
  },
  {
    id: "RP-04",
    nom: "Conventions et facturation partenaires",
    perimetre: "Admin Zô PME",
    frequence: "Mensuel",
    dernierGenere: "31/08/2026",
    formats: ["PDF"],
  },
  {
    id: "RP-05",
    nom: "Satisfaction et animation",
    perimetre: "Direction, Marketing",
    frequence: "Trimestriel",
    dernierGenere: "30/06/2026",
    formats: ["PDF"],
  },
];
