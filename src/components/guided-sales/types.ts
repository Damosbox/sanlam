export type ProductType = "auto" | "habitation" | "sante" | "vie";
export type ClientType = "prospect" | "existing";
export type UsageType = "prive" | "professionnel" | "taxi" | "livraison";
export type PlanTier = "basic" | "standard" | "premium";

export interface ClientIdentificationData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  identityDocumentType: string;
  identityDocumentNumber: string;
  linkedContactId?: string;
  linkedContactType?: "prospect" | "client";
}

export interface NeedsAnalysisData {
  productType: ProductType;
  clientType: ClientType;
  budget: number;
  country: string;
  specificRisks: string;
  contactPreference: "whatsapp" | "sms" | "email";
  // Auto specific
  vehicleType?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleUsage?: UsageType;
  vehicleFirstCirculationDate?: string;
  vehicleVenalValue?: number;
  vehicleNewValue?: number;
  bonusMalus?: string;
  vehicleFiscalPower?: number;
  vehicleSeats?: number;
  hasClaimHistory?: boolean;
  // Habitation specific
  housingType?: "appartement" | "maison";
  materials?: "dur" | "semi-dur" | "leger";
  surface?: number;
  contentValue?: number;
  security?: string[];
  // Santé specific
  beneficiaryCount?: number;
  memberAges?: number[];
  region?: string;
  medicalHistory?: string[];
  coverageLevel?: "essentiel" | "standard" | "premium";
  // Vie specific
  capitalAmount?: number;
  duration?: number;
  isSmoker?: boolean;
  familyStatus?: string;
  monthlyIncome?: number;
  objective?: "protection" | "epargne" | "mixte";
}

export interface QuickQuoteData {
  franchise: number;
  insuredValue: number;
  zone: string;
  bonusMalus: string;
  // Habitation
  buildingValue?: number;
  contentValue?: number;
  // Santé
  beneficiaryCount?: number;
  medicalZone?: string;
  // Vie
  capital?: number;
  duration?: number;
  profession?: string;
}

export interface CoverageData {
  planTier: PlanTier;
  additionalOptions: string[];
  assistanceLevel?: string;
}

export interface UnderwritingData {
  documentsProvided: string[];
  agentJustification: string;
  manualReviewRequested: boolean;
}

export interface BindingData {
  signatureChannel: "email" | "sms" | "whatsapp" | "presential";
  signatureCompleted: boolean;
}

export interface IssuanceData {
  policyNumber: string;
  documentsGenerated: string[];
}

export interface GuidedSalesState {
  currentStep: number;
  clientIdentification: ClientIdentificationData;
  needsAnalysis: NeedsAnalysisData;
  quickQuote: QuickQuoteData;
  coverage: CoverageData;
  underwriting: UnderwritingData;
  binding: BindingData;
  issuance: IssuanceData;
  calculatedPremium: {
    primeNette: number;
    fraisAccessoires: number;
    taxes: number;
    primeTTC: number;
    fga: number;
    cedeao: number;
    totalAPayer: number;
    // Compatibilité ancienne structure
    netPremium: number;
    fees: number;
    total: number;
  };
}

export const initialState: GuidedSalesState = {
  currentStep: 0,
  clientIdentification: {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    identityDocumentType: "",
    identityDocumentNumber: "",
  },
  needsAnalysis: {
    productType: "auto",
    clientType: "prospect",
    budget: 500,
    country: "CI",
    specificRisks: "",
    contactPreference: "whatsapp",
  },
  quickQuote: {
    franchise: 250,
    insuredValue: 25000,
    zone: "urbain",
    bonusMalus: "bonus_25",
  },
  coverage: {
    planTier: "standard",
    additionalOptions: [],
  },
  underwriting: {
    documentsProvided: [],
    agentJustification: "",
    manualReviewRequested: false,
  },
  binding: {
    signatureChannel: "email",
    signatureCompleted: false,
  },
  issuance: {
    policyNumber: "",
    documentsGenerated: [],
  },
  calculatedPremium: {
    primeNette: 45000,
    fraisAccessoires: 10000,
    taxes: 6300,
    primeTTC: 61300,
    fga: 5000,
    cedeao: 5000,
    totalAPayer: 71300,
    netPremium: 45000,
    fees: 10000,
    total: 71300,
  },
};
