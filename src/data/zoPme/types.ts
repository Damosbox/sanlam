/**
 * Modèles de données du module « Espace Zô PME ».
 * Prototype front-end : aucune table Supabase associée à ce lot.
 */

export type Tier = "Bronze" | "Argent" | "Or" | "Platine";

export type Severity = "critique" | "eleve" | "moyen" | "faible";

/** Cycle de vie d'une PME membre du programme. */
export type PmeLifecycle =
  | "prospect"
  | "adhesion_en_cours"
  | "actif"
  | "suspendu"
  | "resilie";

/** Rôle d'un contact rattaché à la PME. Le directeur est un contact parmi d'autres. */
export type ContactRole =
  | "directeur"
  | "responsable_administratif"
  | "responsable_achats"
  | "comptable"
  | "porteur_carte";

export interface PmeContact {
  id: string;
  nom: string;
  fonction: string;
  role: ContactRole;
  email: string;
  telephone: string;
  principal: boolean;
}

/** Score de fidélité : /100, palier et avantages. Ne jamais mélanger avec le RFM. */
export interface FideliteSnapshot {
  score: number;
  palier: Tier;
  pointsPeriode: number;
  depuis: string;
}

/**
 * Segmentation analytique RFM.
 * Dépend d'une future table d'activations / transactions : valeurs indicatives.
 */
export interface RfmSnapshot {
  recence: number;
  frequence: number;
  montant: number;
  segment: string;
  disponible: boolean;
}

export interface Pme {
  id: string;
  matricule: string;
  raisonSociale: string;
  secteur: string;
  ville: string;
  effectif: number;
  cycleVie: PmeLifecycle;
  fidelite: FideliteSnapshot;
  rfm: RfmSnapshot;
  contacts: PmeContact[];
  cartesRefs: string[];
  adhesionLe: string;
  derniereActivite: string;
  conformiteComplete: boolean;
  /** Intermédiaire / apporteur rattaché (périmètre commercial). */
  intermediaire?: string;
  /** Produits souscrits déclarés (référentiel produit à arbitrer côté métier). */
  produitsSouscrits?: string[];
}

/* --- Cartes --- */

export type CardStatus =
  | "demandee"
  | "a_produire"
  | "en_production"
  | "produite"
  | "a_envoyer"
  | "expediee"
  | "a_remettre"
  | "remise"
  | "activee"
  | "bloquee";

export type Priority = Severity;

export interface CardEvent {
  date: string;
  acteur: string;
  action: string;
  motif?: string;
}

export type CardDigitalState = "non_genere" | "genere" | "actif" | "revoque";
export type CardPrintState = "non_lancee" | "imprimee" | "remise";

export interface CardProof {
  type: "bordereau" | "accuse_reception" | "photo_remise";
  reference: string;
  date: string;
  /** Preuve de démonstration : aucune GED branchée sur ce lot. */
  demo: true;
}

export interface ZoCard {
  reference: string;
  pmeId: string;
  porteur: string;
  statut: CardStatus;
  priorite: Priority;
  slaCibleHeures: number;
  slaEcouleHeures: number;
  demandeeLe: string;
  historique: CardEvent[];
  /** Motif d'émission (première émission, renouvellement, perte, remplacement…). */
  motifEmission?: string;
  /** Version de la carte (V1, V2…). */
  version?: string;
  etatDigital?: CardDigitalState;
  etatImpression?: CardPrintState;
  preuveEnvoi?: CardProof | null;
  courrierBienvenue?: { envoye: boolean; date?: string };
}

/* --- Partenaires, conventions, avantages --- */

export type ConventionStatus = "active" | "a_renouveler" | "expiree";

export interface Partner {
  id: string;
  nom: string;
  categorie: string;
  ville: string;
  actif: boolean;
  contact: { nom: string; email: string; telephone: string };
  convention: {
    reference: string;
    debut: string;
    fin: string;
    statut: ConventionStatus;
    tauxRemise: number;
  };
  usagesPeriode: number;
  volumePeriode: number;
  slaTraitement: string;
  /** Type de partenaire (enseigne, prestataire, institutionnel…). */
  type?: string;
  categories?: string[];
  responsableInterne?: string;
  contactSupport?: { nom: string; email: string; telephone: string };
  accord?: {
    type: string;
    contreparties: string;
    clauses: string;
  };
  ciblage?: { produits: string; segment: string; zone: string };
  kpiCible?: number;
  kpiRealise?: number;
  risque?: Severity;
  planB?: string;
  historiqueConvention?: { date: string; acteur: string; action: string; motif?: string }[];
}

export type PublicationStatus = "brouillon" | "a_valider" | "publie" | "suspendu";

export interface Benefit {
  id: string;
  libelle: string;
  partnerId: string;
  categorie: string;
  valeur: string;
  paliersEligibles: Tier[];
  regles: string[];
  publication: PublicationStatus;
  usagesPeriode: number;
  /** Partenaires associés (un avantage peut être porté par plusieurs partenaires). */
  partnerIds?: string[];
  secteur?: string;
  description?: string;
  conditions?: string;
  dateDebut?: string;
  dateFin?: string;
}

/* --- Souscription --- */

export type FileStage = "a_controler" | "conforme" | "active";

export type ChecklistState = "valide" | "manquant" | "a_verifier";

export interface ChecklistItem {
  id: string;
  libelle: string;
  obligatoire: boolean;
  statut: ChecklistState;
}

export interface DecisionEntry {
  date: string;
  acteur: string;
  action: string;
  motif?: string;
}

export interface SubscriptionFile {
  reference: string;
  pmeId: string;
  etape: FileStage;
  montantAnnuel: number;
  deposeLe: string;
  checklist: ChecklistItem[];
  journal: DecisionEntry[];
}

/* --- Marketing / animation --- */

export type CampaignStatus = "brouillon" | "programmee" | "envoyee" | "suspendue";

export interface Campaign {
  id: string;
  nom: string;
  canal: "WhatsApp" | "SMS" | "E-mail";
  ciblePaliers: Tier[];
  audience: number;
  statut: CampaignStatus;
  date: string;
  envoyes: number;
  lus: number;
  clics: number;
  objectif?: string;
  budget?: number;
}

export interface ZoEvent {
  id: string;
  nom: string;
  date: string;
  ville: string;
  inscrits: number;
  capacite: number;
  statut: "ouvert" | "complet" | "cloture";
}

/* --- Direction --- */

export interface Kpi {
  key: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down" | "flat";
}

export interface OperationalAlert {
  id: string;
  titre: string;
  detail: string;
  severity: Severity;
  categorie: "sla" | "convention" | "inactivite" | "anomalie";
  vueCible?: string;
}

export interface ReportDefinition {
  id: string;
  nom: string;
  perimetre: string;
  frequence: string;
  dernierGenere: string;
  formats: ("PDF" | "Excel")[];
}
