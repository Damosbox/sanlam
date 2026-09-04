import type { CardStatus, Priority, ZoCard } from "./types";

export const CARD_STATUS_ORDER: CardStatus[] = [
  "demandee",
  "a_produire",
  "en_production",
  "produite",
  "a_envoyer",
  "expediee",
  "a_remettre",
  "remise",
  "activee",
  "bloquee",
];

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  demandee: "Demandée",
  a_produire: "À produire",
  en_production: "En production",
  produite: "Produite",
  a_envoyer: "À envoyer",
  expediee: "Expédiée",
  a_remettre: "À remettre",
  remise: "Remise",
  activee: "Activée",
  bloquee: "Bloquée",
};

export const CARD_STATUS_STYLES: Record<CardStatus, string> = {
  demandee: "bg-muted text-muted-foreground border-border",
  a_produire:
    "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))] border-[hsl(var(--orange))]/30",
  en_production: "bg-primary/10 text-primary border-primary/30",
  produite: "bg-primary/10 text-primary border-primary/30",
  a_envoyer:
    "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning-foreground))] border-[hsl(var(--warning))]/40",
  expediee: "bg-primary/10 text-primary border-primary/30",
  a_remettre:
    "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning-foreground))] border-[hsl(var(--warning))]/40",
  remise:
    "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40",
  activee:
    "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40",
  bloquee: "bg-destructive/10 text-destructive border-destructive/30",
};

/** SLA cible par statut, en heures. */
export const CARD_STATUS_SLA: Record<CardStatus, number> = {
  demandee: 12,
  a_produire: 24,
  en_production: 48,
  produite: 24,
  a_envoyer: 24,
  expediee: 72,
  a_remettre: 120,
  remise: 48,
  activee: 0,
  bloquee: 0,
};

/** Transitions autorisées du cycle des cartes (mock front-end). */
export const CARD_TRANSITIONS: Record<CardStatus, CardStatus[]> = {
  demandee: ["a_produire", "bloquee"],
  a_produire: ["en_production", "bloquee"],
  en_production: ["produite", "bloquee"],
  produite: ["a_envoyer", "bloquee"],
  a_envoyer: ["expediee", "bloquee"],
  expediee: ["a_remettre", "bloquee"],
  a_remettre: ["remise", "bloquee"],
  remise: ["activee", "bloquee"],
  activee: ["bloquee"],
  bloquee: ["a_remettre", "activee"],
};

/** Étapes affichées dans le kanban Marketing (les statuts terminaux sont hors file). */
export const KANBAN_STAGES: CardStatus[] = [
  "demandee",
  "a_produire",
  "en_production",
  "produite",
  "a_envoyer",
  "expediee",
  "a_remettre",
];

export const PRIORITY_ORDER: Priority[] = ["critique", "eleve", "moyen", "faible"];

export const CARDS: ZoCard[] = [
  {
    reference: "ZC-4412",
    pmeId: "PME-1041",
    porteur: "Aristide Kouassi",
    statut: "a_produire",
    priorite: "critique",
    slaCibleHeures: 24,
    slaEcouleHeures: 72,
    demandeeLe: "01/09/2026",
    historique: [
      { date: "01/09/2026 09:12", acteur: "Souscription", action: "Carte demandée" },
      { date: "01/09/2026 15:40", acteur: "Marketing", action: "Passée à À produire" },
    ],
  },
  {
    reference: "ZC-3980",
    pmeId: "PME-1041",
    porteur: "Sylvie Ahou",
    statut: "activee",
    priorite: "faible",
    slaCibleHeures: 0,
    slaEcouleHeures: 0,
    demandeeLe: "14/02/2026",
    historique: [
      { date: "14/02/2026 10:02", acteur: "Souscription", action: "Carte demandée" },
      { date: "20/02/2026 11:30", acteur: "Marketing", action: "Carte remise" },
      { date: "21/02/2026 08:15", acteur: "Membre", action: "Carte activée" },
    ],
  },
  {
    reference: "ZC-4413",
    pmeId: "PME-1042",
    porteur: "Mariam Konan",
    statut: "demandee",
    priorite: "moyen",
    slaCibleHeures: 12,
    slaEcouleHeures: 6,
    demandeeLe: "02/09/2026",
    historique: [{ date: "02/09/2026 08:45", acteur: "Souscription", action: "Carte demandée" }],
  },
  {
    reference: "ZC-4398",
    pmeId: "PME-1043",
    porteur: "Salif Traoré",
    statut: "en_production",
    priorite: "eleve",
    slaCibleHeures: 48,
    slaEcouleHeures: 51,
    demandeeLe: "30/08/2026",
    historique: [
      { date: "30/08/2026 09:00", acteur: "Souscription", action: "Carte demandée" },
      { date: "30/08/2026 14:20", acteur: "Marketing", action: "Passée à À produire" },
      { date: "31/08/2026 10:05", acteur: "Marketing", action: "Passée à En production" },
    ],
  },
  {
    reference: "ZC-4390",
    pmeId: "PME-1044",
    porteur: "Nadia Kessé",
    statut: "activee",
    priorite: "faible",
    slaCibleHeures: 0,
    slaEcouleHeures: 0,
    demandeeLe: "22/01/2026",
    historique: [
      { date: "22/01/2026 09:30", acteur: "Souscription", action: "Carte demandée" },
      { date: "28/01/2026 16:00", acteur: "Marketing", action: "Carte remise" },
      { date: "29/01/2026 09:10", acteur: "Membre", action: "Carte activée" },
    ],
  },
  {
    reference: "ZC-4377",
    pmeId: "PME-1045",
    porteur: "Daniel Farah",
    statut: "a_envoyer",
    priorite: "critique",
    slaCibleHeures: 24,
    slaEcouleHeures: 96,
    demandeeLe: "06/03/2026",
    historique: [
      { date: "06/03/2026 11:00", acteur: "Souscription", action: "Carte demandée" },
      { date: "07/03/2026 09:00", acteur: "Marketing", action: "Passée à En production" },
      { date: "08/03/2026 17:45", acteur: "Marketing", action: "Passée à Produite" },
      { date: "09/03/2026 08:30", acteur: "Marketing", action: "Passée à À envoyer" },
    ],
  },
  {
    reference: "ZC-4352",
    pmeId: "PME-1047",
    porteur: "Yves N'Guessan",
    statut: "bloquee",
    priorite: "eleve",
    slaCibleHeures: 0,
    slaEcouleHeures: 0,
    demandeeLe: "15/12/2025",
    historique: [
      { date: "15/12/2025 10:00", acteur: "Souscription", action: "Carte demandée" },
      {
        date: "12/06/2026 14:20",
        acteur: "Souscription",
        action: "Carte bloquée",
        motif: "PME suspendue pour impayé",
      },
    ],
  },
  {
    reference: "ZC-4348",
    pmeId: "PME-1048",
    porteur: "Ibrahim Diallo",
    statut: "a_remettre",
    priorite: "moyen",
    slaCibleHeures: 120,
    slaEcouleHeures: 30,
    demandeeLe: "31/08/2026",
    historique: [
      { date: "31/08/2026 09:20", acteur: "Souscription", action: "Carte demandée" },
      { date: "01/09/2026 12:00", acteur: "Marketing", action: "Passée à Expédiée" },
      { date: "02/09/2026 09:00", acteur: "Marketing", action: "Passée à À remettre" },
    ],
  },
  {
    reference: "ZC-4361",
    pmeId: "PME-1050",
    porteur: "Michel Kponou",
    statut: "produite",
    priorite: "moyen",
    slaCibleHeures: 24,
    slaEcouleHeures: 18,
    demandeeLe: "27/08/2026",
    historique: [
      { date: "27/08/2026 10:10", acteur: "Souscription", action: "Carte demandée" },
      { date: "28/08/2026 11:00", acteur: "Marketing", action: "Passée à En production" },
      { date: "29/08/2026 15:30", acteur: "Marketing", action: "Passée à Produite" },
    ],
  },
  {
    reference: "ZC-4366",
    pmeId: "PME-1051",
    porteur: "Célestin Bohui",
    statut: "expediee",
    priorite: "faible",
    slaCibleHeures: 72,
    slaEcouleHeures: 40,
    demandeeLe: "26/08/2026",
    historique: [
      { date: "26/08/2026 08:40", acteur: "Souscription", action: "Carte demandée" },
      { date: "28/08/2026 09:00", acteur: "Marketing", action: "Passée à À envoyer" },
      { date: "29/08/2026 16:10", acteur: "Marketing", action: "Passée à Expédiée" },
    ],
  },
  {
    reference: "ZC-4370",
    pmeId: "PME-1050",
    porteur: "Estelle Gnaoré",
    statut: "remise",
    priorite: "faible",
    slaCibleHeures: 48,
    slaEcouleHeures: 12,
    demandeeLe: "25/08/2026",
    historique: [
      { date: "25/08/2026 09:00", acteur: "Souscription", action: "Carte demandée" },
      { date: "01/09/2026 10:00", acteur: "Marketing", action: "Carte remise" },
    ],
  },
];

export const isSlaBreached = (card: ZoCard) =>
  card.slaCibleHeures > 0 && card.slaEcouleHeures > card.slaCibleHeures;

export const slaRatio = (card: ZoCard) =>
  card.slaCibleHeures > 0
    ? Math.min(150, Math.round((card.slaEcouleHeures / card.slaCibleHeures) * 100))
    : 0;
