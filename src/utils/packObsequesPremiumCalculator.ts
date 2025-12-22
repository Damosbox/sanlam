import { PackObsequesData } from "@/components/guided-sales/types";

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
}

const PERIODICITE_MULTIPLIER: Record<string, number> = {
  mensuelle: 12,
  trimestrielle: 4,
  semestrielle: 2,
  annuelle: 1,
};

// Tarifs de base annuels (en FCFA)
const TARIF_BASE_ANNUEL = 36000; // 3000 FCFA/mois
const TARIF_ENFANT_ANNUEL = 12000; // 1000 FCFA/mois par enfant
const TARIF_ASCENDANT_ANNUEL = 18000; // 1500 FCFA/mois par ascendant
const TARIF_CONJOINT_ANNUEL = 24000; // 2000 FCFA/mois pour le conjoint

const CAPITAL_BASE = 500000; // 500 000 FCFA de capital garanti de base
const CAPITAL_PAR_ENFANT = 100000;
const CAPITAL_PAR_ASCENDANT = 150000;

const FRAIS_ACCESSOIRES = 5000;
const TAUX_TAXE = 0.14; // 14% de taxes

export const calculatePackObsequesPremium = (data: PackObsequesData): PackObsequesPremiumBreakdown => {
  const { nombreEnfants, nombreAscendants, subscriberFamilySituation, periodicity } = data;
  
  const hasSpouse = subscriberFamilySituation === "marie";
  
  // Calcul des primes annuelles
  const primeBase = TARIF_BASE_ANNUEL;
  const primeEnfants = nombreEnfants * TARIF_ENFANT_ANNUEL;
  const primeAscendants = nombreAscendants * TARIF_ASCENDANT_ANNUEL;
  const primeConjoint = hasSpouse ? TARIF_CONJOINT_ANNUEL : 0;
  
  const primeTotale = primeBase + primeEnfants + primeAscendants + primeConjoint;
  
  // Taxes sur la prime
  const taxes = Math.round(primeTotale * TAUX_TAXE);
  
  // Prime TTC
  const primeTTC = primeTotale + FRAIS_ACCESSOIRES + taxes;
  
  // Capital garanti
  const capitalGaranti = CAPITAL_BASE + 
    (nombreEnfants * CAPITAL_PAR_ENFANT) + 
    (nombreAscendants * CAPITAL_PAR_ASCENDANT);
  
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
