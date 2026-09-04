import type { ChecklistState, FileStage, SubscriptionFile } from "./types";

export const STAGE_LABELS: Record<FileStage, string> = {
  a_controler: "À contrôler",
  conforme: "Conforme",
  active: "Activé",
};

export const STAGE_STYLES: Record<FileStage, string> = {
  a_controler:
    "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))] border-[hsl(var(--orange))]/30",
  conforme: "bg-primary/10 text-primary border-primary/30",
  active:
    "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40",
};

export const STAGE_ORDER: FileStage[] = ["a_controler", "conforme", "active"];

export const CHECKLIST_LABELS: Record<ChecklistState, string> = {
  valide: "Validé",
  manquant: "Manquant",
  a_verifier: "À vérifier",
};

export const CHECKLIST_STYLES: Record<ChecklistState, string> = {
  valide: "text-[hsl(var(--success))]",
  manquant: "text-destructive",
  a_verifier: "text-[hsl(var(--orange))]",
};

const checklist = (states: [string, string, boolean, ChecklistState][]) =>
  states.map(([id, libelle, obligatoire, statut]) => ({
    id,
    libelle,
    obligatoire,
    statut,
  }));

export const SUBSCRIPTION_FILES: SubscriptionFile[] = [
  {
    reference: "DS-2026-118",
    pmeId: "PME-1042",
    etape: "a_controler",
    montantAnnuel: 1_850_000,
    deposeLe: "28/08/2026",
    checklist: checklist([
      ["k1", "Registre de commerce (RCCM)", true, "valide"],
      ["k2", "Attestation fiscale à jour", true, "manquant"],
      ["k3", "Pièce d'identité du contact directeur", true, "valide"],
      ["k4", "Liste nominative des porteurs de carte", true, "a_verifier"],
      ["k5", "Mandat de prélèvement signé", false, "manquant"],
    ]),
    journal: [
      { date: "28/08/2026 09:10", acteur: "Commercial", action: "Dossier déposé" },
      {
        date: "29/08/2026 11:25",
        acteur: "Souscription",
        action: "Complément demandé",
        motif: "Attestation fiscale absente",
      },
    ],
  },
  {
    reference: "DS-2026-119",
    pmeId: "PME-1046",
    etape: "a_controler",
    montantAnnuel: 4_200_000,
    deposeLe: "21/08/2026",
    checklist: checklist([
      ["k1", "Registre de commerce (RCCM)", true, "valide"],
      ["k2", "Attestation fiscale à jour", true, "valide"],
      ["k3", "Pièce d'identité du contact directeur", true, "a_verifier"],
      ["k4", "Liste nominative des porteurs de carte", true, "valide"],
      ["k5", "Mandat de prélèvement signé", false, "valide"],
    ]),
    journal: [{ date: "21/08/2026 14:00", acteur: "Commercial", action: "Dossier déposé" }],
  },
  {
    reference: "DS-2026-112",
    pmeId: "PME-1049",
    etape: "a_controler",
    montantAnnuel: 960_000,
    deposeLe: "01/09/2026",
    checklist: checklist([
      ["k1", "Registre de commerce (RCCM)", true, "manquant"],
      ["k2", "Attestation fiscale à jour", true, "manquant"],
      ["k3", "Pièce d'identité du contact directeur", true, "valide"],
      ["k4", "Liste nominative des porteurs de carte", true, "manquant"],
      ["k5", "Mandat de prélèvement signé", false, "manquant"],
    ]),
    journal: [{ date: "01/09/2026 10:30", acteur: "Commercial", action: "Dossier déposé" }],
  },
  {
    reference: "DS-2026-104",
    pmeId: "PME-1050",
    etape: "conforme",
    montantAnnuel: 3_400_000,
    deposeLe: "14/05/2026",
    checklist: checklist([
      ["k1", "Registre de commerce (RCCM)", true, "valide"],
      ["k2", "Attestation fiscale à jour", true, "valide"],
      ["k3", "Pièce d'identité du contact directeur", true, "valide"],
      ["k4", "Liste nominative des porteurs de carte", true, "valide"],
      ["k5", "Mandat de prélèvement signé", false, "valide"],
    ]),
    journal: [
      { date: "14/05/2026 09:00", acteur: "Commercial", action: "Dossier déposé" },
      { date: "16/05/2026 15:40", acteur: "Souscription", action: "Dossier déclaré conforme" },
    ],
  },
  {
    reference: "DS-2026-101",
    pmeId: "PME-1051",
    etape: "conforme",
    montantAnnuel: 2_750_000,
    deposeLe: "07/03/2026",
    checklist: checklist([
      ["k1", "Registre de commerce (RCCM)", true, "valide"],
      ["k2", "Attestation fiscale à jour", true, "valide"],
      ["k3", "Pièce d'identité du contact directeur", true, "valide"],
      ["k4", "Liste nominative des porteurs de carte", true, "valide"],
      ["k5", "Mandat de prélèvement signé", false, "a_verifier"],
    ]),
    journal: [
      { date: "07/03/2026 08:30", acteur: "Commercial", action: "Dossier déposé" },
      { date: "09/03/2026 10:15", acteur: "Souscription", action: "Dossier déclaré conforme" },
    ],
  },
  {
    reference: "DS-2026-088",
    pmeId: "PME-1044",
    etape: "active",
    montantAnnuel: 12_500_000,
    deposeLe: "19/01/2026",
    checklist: checklist([
      ["k1", "Registre de commerce (RCCM)", true, "valide"],
      ["k2", "Attestation fiscale à jour", true, "valide"],
      ["k3", "Pièce d'identité du contact directeur", true, "valide"],
      ["k4", "Liste nominative des porteurs de carte", true, "valide"],
      ["k5", "Mandat de prélèvement signé", false, "valide"],
    ]),
    journal: [
      { date: "19/01/2026 09:00", acteur: "Commercial", action: "Dossier déposé" },
      { date: "20/01/2026 11:00", acteur: "Souscription", action: "Dossier déclaré conforme" },
      { date: "22/01/2026 09:30", acteur: "Admin Zô PME", action: "Adhésion activée" },
    ],
  },
  {
    reference: "DS-2026-090",
    pmeId: "PME-1048",
    etape: "active",
    montantAnnuel: 5_100_000,
    deposeLe: "30/08/2026",
    checklist: checklist([
      ["k1", "Registre de commerce (RCCM)", true, "valide"],
      ["k2", "Attestation fiscale à jour", true, "valide"],
      ["k3", "Pièce d'identité du contact directeur", true, "valide"],
      ["k4", "Liste nominative des porteurs de carte", true, "valide"],
      ["k5", "Mandat de prélèvement signé", false, "valide"],
    ]),
    journal: [
      { date: "30/08/2026 09:20", acteur: "Commercial", action: "Dossier déposé" },
      { date: "30/08/2026 16:00", acteur: "Souscription", action: "Dossier déclaré conforme" },
      { date: "31/08/2026 08:40", acteur: "Admin Zô PME", action: "Adhésion activée" },
    ],
  },
  {
    reference: "DS-2026-075",
    pmeId: "PME-1041",
    etape: "active",
    montantAnnuel: 6_800_000,
    deposeLe: "12/02/2026",
    checklist: checklist([
      ["k1", "Registre de commerce (RCCM)", true, "valide"],
      ["k2", "Attestation fiscale à jour", true, "valide"],
      ["k3", "Pièce d'identité du contact directeur", true, "valide"],
      ["k4", "Liste nominative des porteurs de carte", true, "valide"],
      ["k5", "Mandat de prélèvement signé", false, "valide"],
    ]),
    journal: [
      { date: "12/02/2026 09:00", acteur: "Commercial", action: "Dossier déposé" },
      { date: "13/02/2026 14:10", acteur: "Souscription", action: "Dossier déclaré conforme" },
      { date: "14/02/2026 09:00", acteur: "Admin Zô PME", action: "Adhésion activée" },
    ],
  },
];

export const MONTHLY_CONTRACTS = [
  { month: "Avr", count: 18 },
  { month: "Mai", count: 24 },
  { month: "Juin", count: 21 },
  { month: "Juil", count: 32 },
  { month: "Août", count: 29 },
  { month: "Sept", count: 37 },
];
