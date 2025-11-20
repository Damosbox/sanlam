export interface EducationResult {
  totalPremiumsPaid: number;      // Primes totales versées pendant le différé
  annualRent: number;             // Rente annuelle pendant 5 ans
  totalRentReceived: number;      // Total reçu sur 5 ans
  totalFees: number;              // Frais totaux
  netInvested: number;            // Capital net investi
  yearByYearBreakdown: Array<{
    year: number;
    phase: 'accumulation' | 'distribution';
    premiumsPaid: number;
    fees: number;
    rentReceived: number;
    cumulativeCapital: number;
  }>;
}

// Taux de frais progressifs (similaire à Épargne Plus)
const getFeeRate = (year: number): number => {
  if (year <= 2) return 0.15;      // 15% ans 1-2
  if (year <= 5) return 0.10;      // 10% ans 3-5
  if (year <= 15) return 0.05;     // 5% ans 6-15
  return 0;                        // 0% an 16+
};

const ANNUAL_INTEREST_RATE = 0.04; // 4% pour produit éducation
const RENT_DISTRIBUTION_YEARS = 5; // Rente versée sur 5 ans
const MIN_ANNUAL_RENT = 100000;    // Rente annuelle minimum: 100,000 FCFA

export const calculateEducation = (
  monthlyPremium: number,
  deferredYears: number
): EducationResult => {
  let totalPremiumsPaid = 0;
  let totalFees = 0;
  let netInvested = 0;
  let accumulatedCapital = 0;
  const yearByYearBreakdown: EducationResult['yearByYearBreakdown'] = [];

  // Phase 1: Accumulation (période de différé)
  for (let year = 1; year <= deferredYears; year++) {
    const annualPremium = monthlyPremium * 12;
    const feeRate = getFeeRate(year);
    const fees = annualPremium * feeRate;
    const netPremium = annualPremium - fees;
    
    totalPremiumsPaid += annualPremium;
    totalFees += fees;
    netInvested += netPremium;
    
    // Intérêts sur le capital accumulé + nouvelle prime nette
    const interests = (accumulatedCapital + netPremium) * ANNUAL_INTEREST_RATE;
    accumulatedCapital += netPremium + interests;
    
    yearByYearBreakdown.push({
      year,
      phase: 'accumulation',
      premiumsPaid: annualPremium,
      fees,
      rentReceived: 0,
      cumulativeCapital: accumulatedCapital
    });
  }

  // Calcul de la rente annuelle (capital accumulé / 5 ans)
  const calculatedAnnualRent = accumulatedCapital / RENT_DISTRIBUTION_YEARS;
  const annualRent = Math.max(calculatedAnnualRent, MIN_ANNUAL_RENT);
  const totalRentReceived = annualRent * RENT_DISTRIBUTION_YEARS;

  // Phase 2: Distribution (rente sur 5 ans)
  for (let year = 1; year <= RENT_DISTRIBUTION_YEARS; year++) {
    yearByYearBreakdown.push({
      year: deferredYears + year,
      phase: 'distribution',
      premiumsPaid: 0,
      fees: 0,
      rentReceived: annualRent,
      cumulativeCapital: accumulatedCapital - (annualRent * year)
    });
  }

  return {
    totalPremiumsPaid,
    annualRent,
    totalRentReceived,
    totalFees,
    netInvested,
    yearByYearBreakdown
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' Fcfa';
};

export const getChildAgeLabel = (currentAge: number, deferredYears: number): string => {
  const futureAge = currentAge + deferredYears;
  if (futureAge <= 6) return "Début de scolarité primaire";
  if (futureAge <= 11) return "Entrée au collège";
  if (futureAge <= 15) return "Entrée au lycée";
  if (futureAge <= 18) return "Études supérieures";
  return "Formation professionnelle";
};
