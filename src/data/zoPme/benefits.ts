import type { Benefit, PublicationStatus } from "./types";

export const PUBLICATION_LABELS: Record<PublicationStatus, string> = {
  brouillon: "Brouillon",
  a_valider: "À valider",
  publie: "Publié",
  suspendu: "Suspendu",
};

export const PUBLICATION_STYLES: Record<PublicationStatus, string> = {
  brouillon: "bg-muted text-muted-foreground border-border",
  a_valider:
    "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))] border-[hsl(var(--orange))]/30",
  publie:
    "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40",
  suspendu: "bg-destructive/10 text-destructive border-destructive/30",
};

export const PUBLICATION_TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
  brouillon: ["a_valider"],
  a_valider: ["publie", "brouillon"],
  publie: ["suspendu"],
  suspendu: ["publie"],
};

export const PUBLICATION_RULES = [
  "Toute nouvelle offre est créée en brouillon par le pôle Marketing.",
  "Une convention partenaire signée et en cours de validité est obligatoire avant publication.",
  "La validation finale relève du rôle Admin Zô PME ; les paliers d'éligibilité sont obligatoires.",
  "Une offre liée à une convention expirée est automatiquement dépubliée.",
];

export const BENEFITS: Benefit[] = [
  {
    id: "AV-01",
    libelle: "-15 % consultations générales",
    partnerId: "PT-01",
    categorie: "Santé",
    valeur: "-15 %",
    paliersEligibles: ["Bronze", "Argent", "Or", "Platine"],
    regles: ["Sur présentation de la carte Zô", "Hors urgences et hospitalisation"],
    publication: "publie",
    usagesPeriode: 246,
  },
  {
    id: "AV-02",
    libelle: "Bilan sanguin -25 %",
    partnerId: "PT-01",
    categorie: "Santé",
    valeur: "-25 %",
    paliersEligibles: ["Or", "Platine"],
    regles: ["Deux bilans par an et par porteur"],
    publication: "a_valider",
    usagesPeriode: 34,
  },
  {
    id: "AV-03",
    libelle: "-10 % carburant professionnel",
    partnerId: "PT-02",
    categorie: "Carburant",
    valeur: "-10 %",
    paliersEligibles: ["Bronze", "Argent", "Or", "Platine"],
    regles: ["Plafond 250 000 FCFA / mois", "Stations partenaires du Plateau"],
    publication: "publie",
    usagesPeriode: 221,
  },
  {
    id: "AV-04",
    libelle: "Lavage véhicule offert",
    partnerId: "PT-02",
    categorie: "Carburant",
    valeur: "Offert",
    paliersEligibles: ["Or", "Platine"],
    regles: ["Un lavage par mois"],
    publication: "brouillon",
    usagesPeriode: 0,
  },
  {
    id: "AV-05",
    libelle: "-20 % forfait data pro",
    partnerId: "PT-04",
    categorie: "Télécom",
    valeur: "-20 %",
    paliersEligibles: ["Argent", "Or", "Platine"],
    regles: ["Engagement 12 mois", "Maximum 10 lignes par PME"],
    publication: "publie",
    usagesPeriode: 134,
  },
  {
    id: "AV-06",
    libelle: "Livraison B2B offerte",
    partnerId: "PT-03",
    categorie: "Grande distribution",
    valeur: "Offert",
    paliersEligibles: ["Or", "Platine"],
    regles: ["Commande minimum 150 000 FCFA", "Abidjan uniquement"],
    publication: "a_valider",
    usagesPeriode: 97,
  },
  {
    id: "AV-07",
    libelle: "Check-up PME offert",
    partnerId: "PT-05",
    categorie: "Santé",
    valeur: "Offert",
    paliersEligibles: ["Platine"],
    regles: ["Un check-up par an pour 5 collaborateurs"],
    publication: "publie",
    usagesPeriode: 168,
  },
  {
    id: "AV-08",
    libelle: "Conciergerie dédiée",
    partnerId: "PT-05",
    categorie: "Services",
    valeur: "Inclus",
    paliersEligibles: ["Platine"],
    regles: ["Ligne dédiée 8 h – 20 h"],
    publication: "publie",
    usagesPeriode: 58,
  },
  {
    id: "AV-09",
    libelle: "Révision véhicule -10 %",
    partnerId: "PT-06",
    categorie: "Automobile",
    valeur: "-10 %",
    paliersEligibles: ["Bronze", "Argent"],
    regles: ["Convention expirée : offre dépubliée automatiquement"],
    publication: "suspendu",
    usagesPeriode: 21,
  },
];
