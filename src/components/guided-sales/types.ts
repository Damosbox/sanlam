export type ProductType = "auto" | "habitation" | "sante" | "vie" | "mrh" | "assistance_voyage";
export type ProductCategory = "vie" | "non_vie";
export type SelectedProductType = "auto" | "molo_molo" | "pack_obseques" | "mrh" | "assistance_voyage";
export type ClientType = "prospect" | "existing";
export type UsageType = "prive" | "professionnel" | "taxi" | "livraison";
export type PlanTier = "basic" | "standard" | "premium";
export type ContractPeriodicity = "1_month" | "3_months" | "6_months" | "1_year";
export type SignatureType = "presential" | "electronic";
export type PaymentChannel = "email" | "sms" | "whatsapp";
export type ViePeriodicite = "mensuelle" | "trimestrielle" | "semestrielle" | "annuelle";
export type EnergyType = "essence" | "diesel" | "electrique" | "hybride";
export type TravelZone = "afrique" | "europe" | "amerique" | "asie" | "monde";

// Données spécifiques Pack Obsèques
export interface PackObsequesData {
  periodicity: ViePeriodicite;
  nombreEnfants: number;
  nombreAscendants: number;
  // Infos souscripteur
  subscriberName: string;
  subscriberFamilySituation: string;
  subscriberBirthDate: string;
  subscriberIdType: string;
  subscriberIdNumber: string;
  subscriberProfession: string;
  subscriberEmail: string;
  subscriberPhone: string;
  // Infos assuré (si différent du souscripteur)
  insuredIsDifferent: boolean;
  insuredName?: string;
  insuredBirthDate?: string;
  insuredIdType?: string;
  insuredIdNumber?: string;
  insuredProfession?: string;
  insuredEmail?: string;
  insuredPhone?: string;
  // Conjoint
  spouseBirthDate?: string;
}

// Données spécifiques Molo Molo
export interface MoloMoloData {
  montantCotisation: number;
  periodicity: ViePeriodicite;
  dureeContrat: number;
  // Infos souscripteur
  subscriberName: string;
  subscriberFamilySituation: string;
  subscriberBirthDate: string;
  subscriberIdType: string;
  subscriberIdNumber: string;
  subscriberProfession: string;
  subscriberEmail: string;
  subscriberPhone: string;
  // Bénéficiaires
  beneficiaries: Array<{
    name: string;
    relationship: string;
    percentage: number;
  }>;
}

export interface ProductSelectionData {
  category: ProductCategory;
  selectedProduct: SelectedProductType;
}

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
  // Auto VP specific
  vehicleType?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleUsage?: UsageType;
  vehicleFirstCirculationDate?: string;
  vehicleVenalValue?: number;
  vehicleNewValue?: number;
  bonusMalus?: string;
  vehicleFiscalPower?: number;
  vehicleSeats?: number;
  vehicleEnergy?: EnergyType;
  socioProfessionalCategory?: string;
  contractPeriodicity?: ContractPeriodicity;
  hasClaimHistory?: boolean;
  // MRH specific
  buildingValue?: number;
  rentValue?: number;
  contentValue?: number;
  itEquipmentValue?: number;
  numberOfRooms?: number;
  propertyAddress?: string;
  // Habitation specific (legacy)
  housingType?: "appartement" | "maison";
  materials?: "dur" | "semi-dur" | "leger";
  surface?: number;
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
  // Assistance Voyage specific
  travelZone?: TravelZone;
  travelerBirthDate?: string;
  departureDate?: string;
  returnDate?: string;
  numberOfDays?: number;
  passportNumber?: string;
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
  signatureType: SignatureType;
  signatureOtpSent: boolean;
  signatureOtpVerified: boolean;
  signatureCompleted: boolean;
  paymentMethod: string;
  paymentChannels: PaymentChannel[];
  paymentLinkSent: boolean;
  paymentReceived: boolean;
  clientPhone: string;
  clientEmail: string;
}

export interface IssuanceData {
  policyNumber: string;
  documentsGenerated: string[];
}

export interface GuidedSalesState {
  currentStep: number;
  productSelection: ProductSelectionData;
  clientIdentification: ClientIdentificationData;
  needsAnalysis: NeedsAnalysisData;
  quickQuote: QuickQuoteData;
  coverage: CoverageData;
  underwriting: UnderwritingData;
  binding: BindingData;
  issuance: IssuanceData;
  // Données spécifiques produits Vie
  moloMoloData?: MoloMoloData;
  packObsequesData?: PackObsequesData;
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
  productSelection: {
    category: "non_vie",
    selectedProduct: "auto",
  },
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
    contractPeriodicity: "1_year",
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
    signatureType: "presential",
    signatureOtpSent: false,
    signatureOtpVerified: false,
    signatureCompleted: false,
    paymentMethod: "wave",
    paymentChannels: [],
    paymentLinkSent: false,
    paymentReceived: false,
    clientPhone: "",
    clientEmail: "",
  },
  issuance: {
    policyNumber: "",
    documentsGenerated: [],
  },
  // Données Molo Molo par défaut
  moloMoloData: {
    montantCotisation: 10000,
    periodicity: "mensuelle",
    dureeContrat: 10,
    subscriberName: "",
    subscriberFamilySituation: "",
    subscriberBirthDate: "",
    subscriberIdType: "",
    subscriberIdNumber: "",
    subscriberProfession: "",
    subscriberEmail: "",
    subscriberPhone: "",
    beneficiaries: [],
  },
  // Données Pack Obsèques par défaut
  packObsequesData: {
    periodicity: "mensuelle",
    nombreEnfants: 0,
    nombreAscendants: 0,
    subscriberName: "",
    subscriberFamilySituation: "",
    subscriberBirthDate: "",
    subscriberIdType: "",
    subscriberIdNumber: "",
    subscriberProfession: "",
    subscriberEmail: "",
    subscriberPhone: "",
    insuredIsDifferent: false,
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
