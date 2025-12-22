import { MoloMoloData } from "@/components/guided-sales/types";

export interface MoloMoloPremiumBreakdown {
  cotisationMensuelle: number;
  cotisationAnnuelle: number;
  capitalDeces: number;
  epargneProjetee: number;
  fraisGestion: number;
  primeTTC: number;
}

const PERIODICITE_MULTIPLIER: Record<string, number> = {
  mensuelle: 12,
  trimestrielle: 4,
  semestrielle: 2,
  annuelle: 1,
};

const TAUX_INTERET_ANNUEL = 0.035; // 3.5% par an
const FRAIS_GESTION_RATE = 0.05; // 5% de frais de gestion

export const calculateMoloMoloPremium = (data: MoloMoloData): MoloMoloPremiumBreakdown => {
  const { montantCotisation, periodicity, dureeContrat } = data;
  
  const multiplier = PERIODICITE_MULTIPLIER[periodicity] || 12;
  const cotisationAnnuelle = montantCotisation * multiplier;
  
  // Calcul de l'épargne projetée avec intérêts composés
  let epargneProjetee = 0;
  for (let i = 1; i <= dureeContrat; i++) {
    epargneProjetee = (epargneProjetee + cotisationAnnuelle) * (1 + TAUX_INTERET_ANNUEL);
  }
  
  // Capital décès = 2x l'épargne projetée (garantie standard)
  const capitalDeces = epargneProjetee * 2;
  
  // Frais de gestion annuels
  const fraisGestion = cotisationAnnuelle * FRAIS_GESTION_RATE;
  
  // Prime TTC = cotisation + frais
  const primeTTC = cotisationAnnuelle + fraisGestion;
  
  // Cotisation mensuelle équivalente
  const cotisationMensuelle = primeTTC / 12;
  
  return {
    cotisationMensuelle: Math.round(cotisationMensuelle),
    cotisationAnnuelle: Math.round(cotisationAnnuelle),
    capitalDeces: Math.round(capitalDeces),
    epargneProjetee: Math.round(epargneProjetee),
    fraisGestion: Math.round(fraisGestion),
    primeTTC: Math.round(primeTTC),
  };
};

export const convertMoloMoloToCalculatedPremium = (breakdown: MoloMoloPremiumBreakdown) => {
  return {
    primeNette: breakdown.cotisationAnnuelle,
    fraisAccessoires: breakdown.fraisGestion,
    taxes: 0,
    primeTTC: breakdown.primeTTC,
    fga: 0,
    cedeao: 0,
    totalAPayer: breakdown.primeTTC,
    // Compatibilité ancienne structure
    netPremium: breakdown.cotisationAnnuelle,
    fees: breakdown.fraisGestion,
    total: breakdown.primeTTC,
  };
};
