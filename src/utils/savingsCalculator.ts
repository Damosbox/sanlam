interface YearBreakdown {
  year: number;
  premiumsPaid: number;
  fees: number;
  netPremium: number;
  interests: number;
  capital: number;
}

export interface SavingsResult {
  totalPremiums: number;
  totalFees: number;
  netInvested: number;
  totalInterests: number;
  finalCapital: number;
  yearByYearBreakdown: YearBreakdown[];
}

const ANNUAL_INTEREST_RATE = 0.035; // 3.5%

const getFeeRate = (year: number): number => {
  if (year <= 2) return 0.15;      // 15% years 1-2
  if (year <= 5) return 0.10;      // 10% years 3-5
  if (year <= 15) return 0.05;     // 5% years 6-15
  return 0;                        // 0% year 16+
};

export const calculateSavings = (monthlyPremium: number, years: number): SavingsResult => {
  let totalPremiums = 0;
  let totalFees = 0;
  let netInvested = 0;
  let totalInterests = 0;
  let previousCapital = 0;
  const yearByYearBreakdown: YearBreakdown[] = [];

  for (let year = 1; year <= years; year++) {
    const annualPremium = monthlyPremium * 12;
    const feeRate = getFeeRate(year);
    const fees = annualPremium * feeRate;
    const netPremium = annualPremium - fees;

    totalPremiums += annualPremium;
    totalFees += fees;
    netInvested += netPremium;

    // Calculate interests on accumulated capital + new net premium
    const interests = (previousCapital + netPremium) * ANNUAL_INTEREST_RATE;
    totalInterests += interests;

    const capital = previousCapital + netPremium + interests;
    previousCapital = capital;

    yearByYearBreakdown.push({
      year,
      premiumsPaid: annualPremium,
      fees,
      netPremium,
      interests,
      capital
    });
  }

  return {
    totalPremiums,
    totalFees,
    netInvested,
    totalInterests,
    finalCapital: previousCapital,
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

export const getLifestyleLabel = (amount: number): string => {
  if (amount <= 10000) return "≈ un abonnement internet";
  if (amount <= 20000) return "≈ 3 repas au restaurant";
  if (amount <= 30000) return "Effort mensuel modéré";
  return "Effort mensuel maximal";
};
