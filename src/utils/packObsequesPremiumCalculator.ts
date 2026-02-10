import { PackObsequesData, PackObsequesFormula } from "@/components/guided-sales/types";

export interface PackObsequesPremiumBreakdown {
  primeBase: number;
  primeEnfants: number;
  primeAscendants: number;
  primeConjoint: number;
  primeTotale: number;
  fraisAccessoires: number;
  taxes: number;
  primeTTC: number;
  capitalGaranti: number;
  capitalParEnfant: number;
  capitalParAscendant: number;
}

const PERIODICITE_MULTIPLIER: Record<string, number> = {
  mensuelle: 12,
  trimestrielle: 4,
  semestrielle: 2,
  annuelle: 1,
};

// Tarifs de base annuels par formule (en FCFA)
const TARIF_BASE_ANNUEL: Record<PackObsequesFormula, number> = {
  bronze: 36000,   // 3 000 FCFA/mois
  argent: 60000,   // 5 000 FCFA/mois
  or: 96000,       // 8 000 FCFA/mois
};

const TARIF_ENFANT_ANNUEL: Record<PackObsequesFormula, number> = {
  bronze: 12000,   // 1 000 FCFA/mois par enfant
  argent: 18000,   // 1 500 FCFA/mois par enfant
  or: 24000,       // 2 000 FCFA/mois par enfant
};

const TARIF_ASCENDANT_ANNUEL: Record<PackObsequesFormula, number> = {
  bronze: 18000,   // 1 500 FCFA/mois par ascendant
  argent: 24000,   // 2 000 FCFA/mois par ascendant
  or: 36000,       // 3 000 FCFA/mois par ascendant
};

const TARIF_CONJOINT_ANNUEL: Record<PackObsequesFormula, number> = {
  bronze: 24000,   // 2 000 FCFA/mois
  argent: 36000,   // 3 000 FCFA/mois
  or: 48000,       // 4 000 FCFA/mois
};

// Capitaux garantis par formule
const CAPITAL_BASE: Record<PackObsequesFormula, number> = {
  bronze: 500000,    // 500 000 FCFA
  argent: 1000000,   // 1 000 000 FCFA
  or: 2000000,       // 2 000 000 FCFA
};

const CAPITAL_PAR_ENFANT: Record<PackObsequesFormula, number> = {
  bronze: 100000,
  argent: 200000,
  or: 400000,
};

const CAPITAL_PAR_ASCENDANT: Record<PackObsequesFormula, number> = {
  bronze: 150000,
  argent: 300000,
  or: 600000,
};

const FRAIS_ACCESSOIRES = 5000;
const TAUX_TAXE = 0.14; // 14% de taxes

export const calculatePackObsequesPremium = (data: PackObsequesData): PackObsequesPremiumBreakdown => {
  const { nombreEnfants, nombreAscendants, addSpouse, periodicity, formula = "bronze" } = data;
  
  // Calcul des primes annuelles basées sur la formule
  const primeBase = TARIF_BASE_ANNUEL[formula];
  const primeEnfants = nombreEnfants * TARIF_ENFANT_ANNUEL[formula];
  const primeAscendants = nombreAscendants * TARIF_ASCENDANT_ANNUEL[formula];
  const primeConjoint = addSpouse ? TARIF_CONJOINT_ANNUEL[formula] : 0;
  
  const primeTotale = primeBase + primeEnfants + primeAscendants + primeConjoint;
  
  // Taxes sur la prime
  const taxes = Math.round(primeTotale * TAUX_TAXE);
  
  // Prime TTC
  const primeTTC = primeTotale + FRAIS_ACCESSOIRES + taxes;
  
  // Capital garanti basé sur la formule
  const capitalGaranti = CAPITAL_BASE[formula] + 
    (nombreEnfants * CAPITAL_PAR_ENFANT[formula]) + 
    (nombreAscendants * CAPITAL_PAR_ASCENDANT[formula]);
  
  return {
    primeBase,
    primeEnfants,
    primeAscendants,
    primeConjoint,
    primeTotale,
    fraisAccessoires: FRAIS_ACCESSOIRES,
    taxes,
    primeTTC,
    capitalGaranti,
    capitalParEnfant: CAPITAL_PAR_ENFANT[formula],
    capitalParAscendant: CAPITAL_PAR_ASCENDANT[formula],
  };
};

export const getPeriodicPremium = (annualPremium: number, periodicity: string): number => {
  const multiplier = PERIODICITE_MULTIPLIER[periodicity] || 12;
  return Math.round(annualPremium / multiplier);
};

export const convertPackObsequesToCalculatedPremium = (breakdown: PackObsequesPremiumBreakdown) => {
  return {
    primeNette: breakdown.primeTotale,
    fraisAccessoires: breakdown.fraisAccessoires,
    taxes: breakdown.taxes,
    primeTTC: breakdown.primeTTC,
    fga: 0,
    cedeao: 0,
    totalAPayer: breakdown.primeTTC,
    // Compatibilité ancienne structure
    netPremium: breakdown.primeTotale,
    fees: breakdown.fraisAccessoires,
    total: breakdown.primeTTC,
  };
};
