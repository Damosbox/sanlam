import { FieldConfig } from "../FormFieldLibrary";
import type { Json } from "@/integrations/supabase/types";

// Type d'étape
export type StepType = "fields" | "calculation_rules";

// Structure des coefficients avec tranches
export interface CoefficientBracket {
  id: string;
  min: number;
  max: number;
  value: number;
  label?: string;
}

export interface PricingCoefficient {
  id: string;
  code: string;
  name: string;
  description?: string;
  brackets: CoefficientBracket[];
}

// Structure des taxes
export interface TaxConfig {
  id: string;
  code: string;
  name: string;
  rate: number; // Pourcentage (ex: 14.5)
  isActive: boolean;
}

// Structure des frais fixes
export interface FeeConfig {
  id: string;
  code: string;
  name: string;
  amount: number;
  condition?: string; // Expression DSL optionnelle
}

// Règles de calcul complètes
export interface CalculationRules {
  baseFormula: string; // Expression DSL principale
  coefficients: PricingCoefficient[];
  taxes: TaxConfig[];
  fees: FeeConfig[];
  variables: string[]; // Variables disponibles depuis les champs
  testData?: Record<string, unknown>; // Données de test pour simulation
}

// Sous-étape (dans une phase)
export interface FormSubStep {
  id: string;
  title: string;
  type: StepType;
  fields?: FieldConfig[]; // Si type = "fields"
  calculationRules?: CalculationRules; // Si type = "calculation_rules"
}

// Grande phase (Cotation ou Souscription)
export interface FormPhase {
  id: "cotation" | "souscription";
  name: string;
  icon: string;
  steps: FormSubStep[];
}

// Structure racine du formulaire
export interface FormStructure {
  phases: FormPhase[];
}

// Création de la structure par défaut
export const createDefaultFormStructure = (): FormStructure => ({
  phases: [
    {
      id: "cotation",
      name: "Cotation",
      icon: "Calculator",
      steps: [
        {
          id: `step_${Date.now()}_rules`,
          title: "Règles de calcul",
          type: "calculation_rules",
          calculationRules: {
            baseFormula: "",
            coefficients: [],
            taxes: [
              {
                id: `tax_${Date.now()}`,
                code: "TVA",
                name: "Taxe sur les assurances",
                rate: 14.5,
                isActive: true,
              },
            ],
            fees: [],
            variables: [],
          },
        },
        {
          id: `step_${Date.now()}_info`,
          title: "Informations",
          type: "fields",
          fields: [],
        },
      ],
    },
    {
      id: "souscription",
      name: "Souscription",
      icon: "FileSignature",
      steps: [
        {
          id: `step_${Date.now()}_identity`,
          title: "Identité",
          type: "fields",
          fields: [],
        },
      ],
    },
  ],
});

// Migration depuis l'ancien format vers le nouveau
export const migrateOldStepsToPhases = (
  oldSteps: Record<string, { title: string; fields: FieldConfig[] }>
): FormStructure => {
  const stepsArray = Object.values(oldSteps || {});

  if (stepsArray.length === 0) {
    return createDefaultFormStructure();
  }

  // Mettre toutes les anciennes étapes dans la phase cotation par défaut
  const cotationSteps: FormSubStep[] = stepsArray.map((step, index) => ({
    id: `step_migrated_${index}_${Date.now()}`,
    title: step.title,
    type: "fields" as const,
    fields: step.fields || [],
  }));

  return {
    phases: [
      {
        id: "cotation",
        name: "Cotation",
        icon: "Calculator",
        steps: cotationSteps,
      },
      {
        id: "souscription",
        name: "Souscription",
        icon: "FileSignature",
        steps: [],
      },
    ],
  };
};

// Vérifier si la structure est dans le nouveau format
export const isNewFormStructure = (steps: unknown): steps is FormStructure => {
  return (
    typeof steps === "object" &&
    steps !== null &&
    "phases" in steps &&
    Array.isArray((steps as FormStructure).phases)
  );
};

// Parser la structure stockée en BDD
export const parseFormStructure = (
  stepsData: unknown
): FormStructure => {
  if (!stepsData) {
    return createDefaultFormStructure();
  }

  // Nouveau format
  if (isNewFormStructure(stepsData)) {
    return stepsData;
  }

  // Ancien format - migration automatique
  return migrateOldStepsToPhases(
    stepsData as Record<string, { title: string; fields: FieldConfig[] }>
  );
};

// Sérialiser pour sauvegarde en BDD
export const serializeFormStructure = (structure: FormStructure): Json => {
  return JSON.parse(JSON.stringify(structure)) as Json;
};
