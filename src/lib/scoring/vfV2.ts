/**
 * Grille de scoring VF_v2 — validée Allianz 28/04/2026.
 * Score effectif : -5 à 100.
 */

export type VfNiveau = "bronze" | "argent" | "or" | "platine";

export const VF_NIVEAU_LABEL: Record<VfNiveau, string> = {
  bronze: "Bronze",
  argent: "Argent",
  or: "Or",
  platine: "Platine",
};

export const VF_NIVEAU_THRESHOLDS: { niveau: VfNiveau; min: number; max: number }[] = [
  { niveau: "bronze", min: -5, max: 39 },
  { niveau: "argent", min: 40, max: 64 },
  { niveau: "or", min: 65, max: 79 },
  { niveau: "platine", min: 80, max: 100 },
];

export const VF_ACTION_TYPES = [
  { value: "parrainage", label: "Parrainage", points: 5 },
  { value: "renouvellement", label: "Renouvellement", points: 3 },
  { value: "diversification", label: "Diversification", points: 3 },
  { value: "souscription", label: "Souscription", points: 2 },
  { value: "enquete", label: "Enquête de satisfaction", points: 2 },
] as const;

export const VF_ACTION_CAP_PER_YEAR = 15;
export const VF_SCORE_MIN = -5;
export const VF_SCORE_MAX = 100;

export function getNiveau(score: number): VfNiveau {
  if (score >= 80) return "platine";
  if (score >= 65) return "or";
  if (score >= 40) return "argent";
  return "bronze";
}

export function getNextThreshold(score: number): { next: VfNiveau | null; pointsTo: number } {
  if (score >= 80) return { next: null, pointsTo: 0 };
  if (score >= 65) return { next: "platine", pointsTo: 80 - score };
  if (score >= 40) return { next: "or", pointsTo: 65 - score };
  return { next: "argent", pointsTo: 40 - Math.max(score, 0) };
}

export interface VfScoreInputs {
  anciennete_annees: number | null;
  prime_annuelle: number | null;
  nb_equipements: number | null;
  sinistres_responsables_annee: number | null;
  action_ponctuelle_points: number; // cumul 12 mois glissants, 0..15
}

export interface VfScoreBreakdown {
  score_anciennete: number;
  score_prime: number;
  score_multi_equipements: number;
  score_sinistre: number;
  score_action_ponctuelle: number;
  score_global: number;
  niveau: VfNiveau;
  is_partial: boolean;
  missing_fields: string[];
}

export function scoreAnciennete(years: number | null): number {
  if (years == null) return 0;
  if (years >= 10) return 20;
  if (years >= 5) return 15;
  if (years >= 3) return 10;
  if (years >= 0) return 5;
  return 0;
}

export function scorePrime(amount: number | null): number {
  if (amount == null) return 0;
  if (amount >= 1_000_000) return 30;
  if (amount >= 500_000) return 20;
  if (amount >= 50_000) return 10;
  if (amount >= 0) return 5;
  return 0;
}

export function scoreMultiEquipements(n: number | null): number {
  if (n == null) return 0;
  if (n >= 5) return 20;
  if (n === 4) return 15;
  if (n === 3) return 10;
  if (n === 2) return 5;
  return 0; // 1 ou 0 = 0
}

/**
 * Sinistre responsable : 0 → 15, 1 → 0, 2+ → -5.
 * null → 0 (pas de malus, AC-3).
 */
export function scoreSinistre(n: number | null): number {
  if (n == null) return 0;
  if (n === 0) return 15;
  if (n === 1) return 0;
  return -5;
}

export function computeVfScore(inputs: VfScoreInputs): VfScoreBreakdown {
  const missing: string[] = [];
  if (inputs.anciennete_annees == null) missing.push("anciennete_annees");
  if (inputs.prime_annuelle == null) missing.push("prime_annuelle");
  if (inputs.nb_equipements == null) missing.push("nb_equipements");

  const sa = scoreAnciennete(inputs.anciennete_annees);
  const sp = scorePrime(inputs.prime_annuelle);
  const se = scoreMultiEquipements(inputs.nb_equipements);
  const ss = scoreSinistre(inputs.sinistres_responsables_annee);
  const sap = Math.min(VF_ACTION_CAP_PER_YEAR, Math.max(0, inputs.action_ponctuelle_points));

  let total = sa + sp + se + ss + sap;
  total = Math.max(VF_SCORE_MIN, Math.min(VF_SCORE_MAX, total));

  return {
    score_anciennete: sa,
    score_prime: sp,
    score_multi_equipements: se,
    score_sinistre: ss,
    score_action_ponctuelle: sap,
    score_global: total,
    niveau: getNiveau(total),
    is_partial: missing.length > 0,
    missing_fields: missing,
  };
}

export const VF_FIELD_LABELS: Record<string, string> = {
  anciennete_annees: "Ancienneté",
  prime_annuelle: "Prime annuelle",
  nb_equipements: "Multi-équipements",
  sinistres_responsables_annee: "Sinistres responsables",
};