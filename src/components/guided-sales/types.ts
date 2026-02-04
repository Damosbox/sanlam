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
export type EnergyType = "essence" | "gasoil" | "hybride" | "electrique";
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
export type LicenseCategory = "A" | "B" | "C" | "D" | "E" | "AB" | "ABCD" | "ABCDE";
export type CityType = "abidjan" | "bouake" | "yamoussoukro" | "korhogo" | "daloa" | "san_pedro" | "man" | "gagnoa";
export type MobilePaymentMethod = "orange_money" | "mtn_momo" | "wave" | "moov";
export type SalesPhase = "preparation" | "construction" | "souscription" | "finalisation";

// Pack Obsèques specific types
export type PackObsequesFormula = "bronze" | "argent" | "or";
export type AdhesionType = "individuelle" | "famille" | "famille_ascendant";
export type TitleType = "monsieur" | "madame" | "mademoiselle" | "docteur" | "maitre" | "corporation" | "entreprise" | "etablissement";

// Données spécifiques Pack Obsèques
export interface PackObsequesData {
  // Simulation - Sub-step 1
  formula: PackObsequesFormula;
  adhesionType: AdhesionType;
  periodicity: ViePeriodicite;
  effectiveDate: string;
  // Simulation - Sub-step 2 (conditional)
  nombreEnfants: number;
  addSpouse: boolean;
  nombreAscendants: number;
  // Simulation - Sub-step 3
  title: TitleType;
  lastName: string;
  firstName: string;
  gender: GenderType;
  // Simulation - Sub-step 4
  birthDate: string;
  birthPlace: string;
  phone: string;
  email: string;
  // Subscription - Sub-step 1
  identityDocumentFile?: string;
  identityDocumentType: string;
  identityNumber: string;
  maritalStatus: string;
  // Subscription - Sub-step 3
  geographicLocation?: string;
  // Legacy fields for compatibility
  subscriberName: string;
  subscriberFamilySituation: string;
  subscriberBirthDate: string;
  subscriberIdType: string;
  subscriberIdNumber: string;
  subscriberProfession: string;
  subscriberEmail: string;
  subscriberPhone: string;
  insuredIsDifferent: boolean;
  insuredName?: string;
  insuredBirthDate?: string;
  insuredIdType?: string;
  insuredIdNumber?: string;
  insuredProfession?: string;
  insuredEmail?: string;
  insuredPhone?: string;
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
export type PriorCertificateType = "documents" | "declaration";

// Phase 3 : Données de souscription (Subscription Data)
export interface SubscriptionData {
  // Agent
  agentCode: string;
  // Localisation
  geographicAddress: string;
  city: CityType;
  // Véhicule identité
  vehicleBrand: string;
  vehicleModel: string;
  vehicleRegistrationNumber: string;
  vehicleChassisNumber: string;
  // Conducteur
  driverName: string;
  isHabitualDriver: boolean;
  licenseCategory: LicenseCategory;
  licenseNumber: string;
  licenseIssueDate: string;
  licenseIssuePlace: string;
  // Documents
  vehicleRegistrationDocument?: string;
  priorCertificateType: PriorCertificateType;
  priorInsurer?: string;
  bonusPercentage?: number;
  declarationText?: string;
}

// Phase 4 : Données de paiement mobile
export interface MobilePaymentData {
  paymentMethod: MobilePaymentMethod;
  paymentPhone: string;
  paymentDate: string;
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
  // Cash payment fields
  cashPaymentReceiptNumber?: string;
  cashPaymentReceiptImage?: string;
  // Legal checkboxes
  acceptTerms: boolean;
  acceptDataSharing: boolean;
  // Signature canvas
  signatureData?: string;
}

export interface IssuanceData {
  policyNumber: string;
  documentsGenerated: string[];
}

export interface GuidedSalesState {
  currentStep: number;
  currentPhase: SalesPhase;
  // Sub-step navigation
  simulationSubStep: 1 | 2 | 3 | 4 | 5;
  subscriptionSubStep: 1 | 2 | 3 | 4 | 5 | 6;
  productSelection: ProductSelectionData;
  clientIdentification: ClientIdentificationData;
  needsAnalysis: NeedsAnalysisData;
  quickQuote: QuickQuoteData;
  coverage: CoverageData;
  underwriting: UnderwritingData;
  subscription: SubscriptionData;
  mobilePayment: MobilePaymentData;
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
  // Simulation calculated flag
  simulationCalculated: boolean;
}

export const initialState: GuidedSalesState = {
  currentStep: 0,
  currentPhase: "preparation",
  simulationSubStep: 1,
  subscriptionSubStep: 1,
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
    quoteType: "auto",
    vehicleEnergy: "essence",
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
  subscription: {
    agentCode: "DP-9191",
    geographicAddress: "",
    city: "abidjan",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleRegistrationNumber: "",
    vehicleChassisNumber: "",
    driverName: "",
    isHabitualDriver: true,
    licenseCategory: "B",
    licenseNumber: "",
    licenseIssueDate: "",
    licenseIssuePlace: "",
    priorCertificateType: "declaration",
  },
  mobilePayment: {
    paymentMethod: "wave",
    paymentPhone: "",
    paymentDate: "",
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
    acceptTerms: false,
    acceptDataSharing: false,
  },
  issuance: {
    policyNumber: "",
    documentsGenerated: [],
  },
  simulationCalculated: false,
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
    formula: "bronze",
    adhesionType: "individuelle",
    periodicity: "mensuelle",
    effectiveDate: "",
    nombreEnfants: 0,
    addSpouse: false,
    nombreAscendants: 0,
    title: "monsieur",
    lastName: "",
    firstName: "",
    gender: "masculin",
    birthDate: "",
    birthPlace: "",
    phone: "",
    email: "",
    identityDocumentType: "",
    identityNumber: "",
    maritalStatus: "",
    geographicLocation: "",
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
