import { GuidedSalesState, UsageType, PlanTier } from "@/components/guided-sales/types";

// Barème RC de base par puissance fiscale (en FCFA)
const RC_BASE_RATES: Record<string, number> = {
  "1-5": 35000,
  "6-10": 45000,
  "11-15": 55000,
  "16-20": 70000,
  "21+": 85000,
};

// Coefficient par usage
const USAGE_COEFFICIENTS: Record<UsageType, number> = {
  prive: 1.0,
  professionnel: 1.25,
  taxi: 1.5,
  livraison: 1.35,
};

// Coefficient par nombre de places
const getSeatsCoefficient = (seats: number): number => {
  if (seats <= 5) return 1.0;
  if (seats <= 9) return 1.15;
  return 1.3;
};

// Coefficient BNS (Bonus/Malus)
const BNS_COEFFICIENTS: Record<string, number> = {
  "bonus_50": 0.50,
  "bonus_40": 0.60,
  "bonus_30": 0.70,
  "bonus_25": 0.75,
  "bonus_20": 0.80,
  "bonus_15": 0.85,
  "bonus_10": 0.90,
  "bonus_5": 0.95,
  "neutre": 1.0,
  "malus_10": 1.10,
  "malus_25": 1.25,
  "malus_50": 1.50,
  "malus_100": 2.0,
};

// Tarif des garanties optionnelles (% de la valeur vénale)
const OPTIONAL_COVERAGE_RATES: Record<string, number> = {
  vol: 0.015,           // 1.5%
  incendie: 0.008,      // 0.8%
  dommages: 0.025,      // 2.5%
  brisGlaces: 0.005,    // 0.5%
  tiersCollision: 0.012, // 1.2%
};

// Coefficient de réduction franchise (plus la franchise est haute, moins la prime est élevée)
const getFranchiseCoefficient = (franchise: number): number => {
  if (franchise >= 1000000) return 0.75;  // -25%
  if (franchise >= 500000) return 0.85;   // -15%
  if (franchise >= 250000) return 0.92;   // -8%
  if (franchise >= 100000) return 0.96;   // -4%
  return 1.0;                              // Pas de réduction
};

// Plan tiers - options incluses
const PLAN_COVERAGES: Record<PlanTier, string[]> = {
  basic: [],
  standard: ["vol", "incendie", "brisGlaces"],
  premium: ["vol", "incendie", "dommages", "brisGlaces", "tiersCollision"],
};

// Constantes fiscales CIMA
const TAX_RATE = 0.14;           // 14% de taxes
const ACCESSORIES_FEE = 10000;   // Frais d'accessoires fixes
const FGA_RATE = 0.02;           // 2% Fond de Garantie Auto
const FGA_MIN = 5000;            // Minimum FGA
const CEDEAO_FEE = 5000;         // Carte brune CEDEAO

export interface AutoPremiumBreakdown {
  primeRC: number;              // Prime Responsabilité Civile
  primeGaranties: number;       // Prime des garanties optionnelles
  primeNette: number;           // Prime nette totale
  fraisAccessoires: number;     // Frais d'accessoires
  taxes: number;                // Taxes fiscales
  primeTTC: number;             // Prime TTC
  fga: number;                  // Fond de Garantie Auto
  cedeao: number;               // Carte brune CEDEAO
  totalAPayer: number;          // Total à payer
}

const getFiscalPowerRange = (power: number): string => {
  if (power <= 5) return "1-5";
  if (power <= 10) return "6-10";
  if (power <= 15) return "11-15";
  if (power <= 20) return "16-20";
  return "21+";
};

export const calculateAutoPremium = (state: GuidedSalesState): AutoPremiumBreakdown => {
  const { needsAnalysis, quickQuote, coverage } = state;

  // Récupérer les données du véhicule
  const fiscalPower = needsAnalysis.vehicleFiscalPower || 7;
  const usage = needsAnalysis.vehicleUsage || "prive";
  const seats = needsAnalysis.vehicleSeats || 5;
  const venalValue = needsAnalysis.vehicleVenalValue || quickQuote.insuredValue * 655.957 || 5000000; // Convert to FCFA if needed
  const bonusMalus = needsAnalysis.bonusMalus || quickQuote.bonusMalus || "neutre";

  // 1. Calcul de la prime RC de base
  const rcBaseRate = RC_BASE_RATES[getFiscalPowerRange(fiscalPower)];
  const usageCoef = USAGE_COEFFICIENTS[usage];
  const seatsCoef = getSeatsCoefficient(seats);
  const bnsCoef = BNS_COEFFICIENTS[bonusMalus] || 1.0;

  const primeRC = Math.round(rcBaseRate * usageCoef * seatsCoef * bnsCoef);

  // 2. Calcul des garanties optionnelles avec impact franchise
  const franchise = quickQuote.franchise || 0;
  const franchiseCoef = getFranchiseCoefficient(franchise);
  
  const planCoverages = PLAN_COVERAGES[coverage.planTier];
  const allCoverages = [...new Set([...planCoverages, ...coverage.additionalOptions])];
  
  let primeGaranties = 0;
  allCoverages.forEach(cov => {
    const rate = OPTIONAL_COVERAGE_RATES[cov];
    if (rate) {
      // La franchise réduit le coût des garanties dommages
      primeGaranties += Math.round(venalValue * rate * franchiseCoef);
    }
  });

  // 3. Prime nette
  const primeNette = primeRC + primeGaranties;

  // 4. Frais d'accessoires (fixe)
  const fraisAccessoires = ACCESSORIES_FEE;

  // 5. Taxes fiscales (14% sur prime nette)
  const taxes = Math.round(primeNette * TAX_RATE);

  // 6. Prime TTC
  const primeTTC = primeNette + fraisAccessoires + taxes;

  // 7. FGA (2% de la prime nette, minimum 5000)
  const fga = Math.max(FGA_MIN, Math.round(primeNette * FGA_RATE));

  // 8. CEDEAO
  const cedeao = CEDEAO_FEE;

  // 9. Total à payer
  const totalAPayer = primeTTC + fga + cedeao;

  return {
    primeRC,
    primeGaranties,
    primeNette,
    fraisAccessoires,
    taxes,
    primeTTC,
    fga,
    cedeao,
    totalAPayer,
  };
};

// Convertir le breakdown pour l'état GuidedSales
export const convertToCalculatedPremium = (breakdown: AutoPremiumBreakdown) => ({
  primeNette: breakdown.primeNette,
  fraisAccessoires: breakdown.fraisAccessoires,
  taxes: breakdown.taxes,
  primeTTC: breakdown.primeTTC,
  fga: breakdown.fga,
  cedeao: breakdown.cedeao,
  totalAPayer: breakdown.totalAPayer,
  // Compatibilité avec l'ancien format
  netPremium: breakdown.primeNette,
  fees: breakdown.fraisAccessoires,
  total: breakdown.totalAPayer,
});
