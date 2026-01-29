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
export type EnergyType = "essence" | "gasoil";
export type QuoteType = "auto" | "2_3_roues";
export type GenderType = "feminin" | "masculin";
export type EmploymentType = 
  | "fonctionnaire" 
  | "salarie" 
  | "exploitant_agricole" 
  | "artisan" 
  | "religieux" 
  | "retraite" 
  | "sans_profession" 
  | "agent_commercial" 
  | "autres";
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
  // Auto VP specific - SanlamAllianz exact fields
  quoteType?: QuoteType;                    // 1. Type de devis
  isVTC?: boolean;                          // 2. VTC
  belongsToCompany?: boolean;               // 3. Appartient à entreprise
  isExistingClient?: boolean;               // 4. Déjà client SanlamAllianz
  hasAccident36Months?: boolean;            // 5. Accident 36 derniers mois
  gender?: GenderType;                      // 6. Sexe
  employmentType?: EmploymentType;          // 7. Type d'emploi
  vehicleEnergy?: EnergyType;               // 8. Énergie
  vehicleFiscalPower?: number;              // 9. Puissance fiscale (1-8)
  vehicleFirstCirculationDate?: string;     // 10. Date 1ère circulation
  vehicleSeats?: number;                    // 11. Nombre de places (3-8)
  effectiveDate?: string;                   // 12. Date d'effet
  contractPeriodicity?: ContractPeriodicity; // 13. Durée du contrat
  vehicleNewValue?: number;                 // 14. Valeur à neuf
  vehicleVenalValue?: number;               // 15. Valeur vénale
  hasPanoramicRoof?: boolean;               // 16. Toit panoramique
  hasGPSProtection?: boolean;               // 17. Protection GPS
  // Legacy Auto fields (kept for compatibility)
  vehicleType?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleUsage?: UsageType;
  bonusMalus?: string;
  socioProfessionalCategory?: string;
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

export type IntermediaryStatus = "agent" | "courtier" | "inspecteur" | "directeur";

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
  // Cash payment fields
  cashPaymentReceiptNumber?: string;
  cashPaymentReceiptImage?: string;
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
