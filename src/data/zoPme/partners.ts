import type { ConventionStatus, Partner } from "./types";

export const CONVENTION_LABELS: Record<ConventionStatus, string> = {
  active: "Active",
  a_renouveler: "À renouveler",
  expiree: "Expirée",
};

export const CONVENTION_STYLES: Record<ConventionStatus, string> = {
  active:
    "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40",
  a_renouveler:
    "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))] border-[hsl(var(--orange))]/30",
  expiree: "bg-destructive/10 text-destructive border-destructive/30",
};

export const PARTNERS: Partner[] = [
  {
    id: "PT-01",
    nom: "Clinique Farah",
    categorie: "Santé",
    ville: "Abidjan",
    actif: true,
    contact: {
      nom: "Daniel Farah",
      email: "partenariat@cliniquefarah.ci",
      telephone: "+225 27 22 41 60 18",
    },
    convention: {
      reference: "CV-2026-014",
      debut: "01/02/2026",
      fin: "31/01/2027",
      statut: "active",
      tauxRemise: 15,
    },
    usagesPeriode: 187,
    volumePeriode: 4_310_000,
    slaTraitement: "48 h",
  },
  {
    id: "PT-02",
    nom: "Total Energies – Plateau",
    categorie: "Carburant",
    ville: "Abidjan",
    actif: true,
    contact: {
      nom: "Sandrine Oulaï",
      email: "b2b.ci@totalenergies.com",
      telephone: "+225 27 20 31 44 90",
    },
    convention: {
      reference: "CV-2026-021",
      debut: "15/03/2026",
      fin: "30/09/2026",
      statut: "a_renouveler",
      tauxRemise: 10,
    },
    usagesPeriode: 366,
    volumePeriode: 7_120_000,
    slaTraitement: "24 h",
  },
  {
    id: "PT-03",
    nom: "Prosuma / Cash Center",
    categorie: "Grande distribution",
    ville: "Abidjan",
    actif: true,
    contact: {
      nom: "Léa Bamba",
      email: "partenaires@prosuma.ci",
      telephone: "+225 05 44 12 87 60",
    },
    convention: {
      reference: "CV-2026-030",
      debut: "10/04/2026",
      fin: "09/10/2026",
      statut: "a_renouveler",
      tauxRemise: 8,
    },
    usagesPeriode: 298,
    volumePeriode: 5_640_000,
    slaTraitement: "72 h",
  },
  {
    id: "PT-04",
    nom: "Orange CI Business",
    categorie: "Télécom",
    ville: "Abidjan",
    actif: true,
    contact: {
      nom: "Yann Kacou",
      email: "business@orange.ci",
      telephone: "+225 07 07 07 12 00",
    },
    convention: {
      reference: "CV-2026-004",
      debut: "01/01/2026",
      fin: "31/12/2026",
      statut: "active",
      tauxRemise: 20,
    },
    usagesPeriode: 154,
    volumePeriode: 2_980_000,
    slaTraitement: "48 h",
  },
  {
    id: "PT-05",
    nom: "Pharmacie Cocody Danga",
    categorie: "Santé",
    ville: "Abidjan",
    actif: true,
    contact: {
      nom: "Aminata Bakayoko",
      email: "contact@pharmadanga.ci",
      telephone: "+225 27 22 48 11 05",
    },
    convention: {
      reference: "CV-2026-041",
      debut: "01/06/2026",
      fin: "31/05/2027",
      statut: "active",
      tauxRemise: 12,
    },
    usagesPeriode: 412,
    volumePeriode: 8_450_000,
    slaTraitement: "24 h",
  },
  {
    id: "PT-06",
    nom: "Bouaké Auto Services",
    categorie: "Automobile",
    ville: "Bouaké",
    actif: false,
    contact: {
      nom: "Ousmane Diarra",
      email: "contact@bouake-auto.ci",
      telephone: "+225 01 55 62 33 84",
    },
    convention: {
      reference: "CV-2025-098",
      debut: "01/07/2025",
      fin: "30/06/2026",
      statut: "expiree",
      tauxRemise: 10,
    },
    usagesPeriode: 21,
    volumePeriode: 640_000,
    slaTraitement: "—",
  },
];

export const findPartner = (id: string) => PARTNERS.find((p) => p.id === id);
