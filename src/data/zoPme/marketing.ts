import type { Campaign, CampaignStatus, ZoEvent } from "./types";

export const CAMPAIGN_LABELS: Record<CampaignStatus, string> = {
  brouillon: "Brouillon",
  programmee: "Programmée",
  envoyee: "Envoyée",
  suspendue: "Suspendue",
};

export const CAMPAIGN_STYLES: Record<CampaignStatus, string> = {
  brouillon: "bg-muted text-muted-foreground border-border",
  programmee: "bg-primary/10 text-primary border-primary/30",
  envoyee:
    "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40",
  suspendue: "bg-destructive/10 text-destructive border-destructive/30",
};

export const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  brouillon: ["programmee"],
  programmee: ["suspendue", "brouillon"],
  envoyee: [],
  suspendue: ["programmee"],
};

export const CAMPAIGNS: Campaign[] = [
  {
    id: "CP-01",
    nom: "Relance cartes non activées",
    canal: "WhatsApp",
    ciblePaliers: ["Bronze", "Argent"],
    audience: 231,
    statut: "programmee",
    date: "08/09/2026",
    envoyes: 0,
    lus: 0,
    clics: 0,
  },
  {
    id: "CP-02",
    nom: "Nouveaux avantages santé",
    canal: "WhatsApp",
    ciblePaliers: ["Bronze", "Argent", "Or", "Platine"],
    audience: 1097,
    statut: "envoyee",
    date: "28/08/2026",
    envoyes: 1097,
    lus: 680,
    clics: 214,
  },
  {
    id: "CP-03",
    nom: "Enquête satisfaction T3",
    canal: "E-mail",
    ciblePaliers: ["Bronze"],
    audience: 612,
    statut: "brouillon",
    date: "—",
    envoyes: 0,
    lus: 0,
    clics: 0,
  },
  {
    id: "CP-04",
    nom: "Invitation networking Zô",
    canal: "SMS",
    ciblePaliers: ["Or", "Platine"],
    audience: 420,
    statut: "envoyee",
    date: "21/08/2026",
    envoyes: 420,
    lus: 302,
    clics: 201,
  },
  {
    id: "CP-05",
    nom: "Rappel conventions partenaires",
    canal: "E-mail",
    ciblePaliers: ["Platine"],
    audience: 66,
    statut: "suspendue",
    date: "02/09/2026",
    envoyes: 0,
    lus: 0,
    clics: 0,
  },
];

export const EVENTS: ZoEvent[] = [
  {
    id: "EV-01",
    nom: "Petit-déjeuner PME – Plateau",
    date: "12/09/2026",
    ville: "Abidjan",
    inscrits: 48,
    capacite: 60,
    statut: "ouvert",
  },
  {
    id: "EV-02",
    nom: "Atelier gestion des risques",
    date: "26/09/2026",
    ville: "Bouaké",
    inscrits: 40,
    capacite: 40,
    statut: "complet",
  },
  {
    id: "EV-03",
    nom: "Networking partenaires Zô",
    date: "10/10/2026",
    ville: "Abidjan",
    inscrits: 12,
    capacite: 80,
    statut: "ouvert",
  },
  {
    id: "EV-04",
    nom: "Forum PME & assurance",
    date: "18/06/2026",
    ville: "Yamoussoukro",
    inscrits: 74,
    capacite: 80,
    statut: "cloture",
  },
];
