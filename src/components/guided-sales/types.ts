export type ProductType = "auto" | "vie";
export type ProductCategory = "vie" | "non-vie";
export type SelectedProductType = "auto" | "pack_obseques";
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
export type TitleType = "monsieur" | "madame" | "mademoiselle" | "docteur" | "professeur" | "maitre" | "corporation" | "entreprise" | "etablissement" | "general" | "commandant" | "lieutenant" | "colonel" | "warrant_officer" | "caporal" | "lieutenant_colonel" | "sergent" | "marechal" | "monseigneur" | "cardinal" | "eveque" | "pasteur" | "camarade" | "compagnie" | "groupe" | "president";
export type MaritalStatusType = "marie" | "celibataire" | "divorce" | "veuf";
export type ProfessionType = "agriculteur_exploitant" | "artisans" | "cadres" | "employes" | "ouvriers" | "professions_intermediaires" | "retraites";
export type IdentityDocType = "attestation_identite" | "cni" | "passeport" | "permis" | "carte_sejour";
export type PrelevementType = "banque" | "solde" | "aps" | "ewallet";
export type PaymentMethodObseques = "orange_money" | "mtn" | "wave" | "moov";
export type BeneficiaireType = "ayant_droit" | "autre";
export type SignatureMethodType = "signer_ici" | "telecharger";

// Données spécifiques Pack Obsèques
export interface PackObsequesData {
  // Simulation - Étape 1/2
  selectedOption: "option1" | "option2";
  formula: PackObsequesFormula;
  adhesionType: AdhesionType;
  periodicity: ViePeriodicite;
  effectiveDate: string;
  nombreEnfants: number;
  addSpouse: boolean;
  nombreAscendants: number;
  // Simulation - Étape 2/2 (Assuré principal)
  title: TitleType;
  lastName: string;
  firstName: string;
  gender: GenderType;
  birthDate: string;
  birthPlace: string;
  phone: string;
  email: string;

  // Souscription - Étape 1/7: Enregistrement assuré principal
  identityDocumentType: IdentityDocType | string;
  identityNumber: string;
  identityDocumentFile?: string;
  nationality: string;
  profession: ProfessionType | string;
  paysResidence: string;
  villeResidence: string;
  maritalStatus: MaritalStatusType | string;

  // Souscription - Étape 2/7: Conjoint (conditionnel)
  conjointIdType: IdentityDocType | string;
  conjointIdNumber: string;
  conjointDocumentFile?: string;
  conjointLastName: string;
  conjointFirstName: string;
  conjointBirthDate: string;
  conjointNationality: string;
  conjointProfession: ProfessionType | string;
  conjointPaysResidence: string;
  conjointVilleResidence: string;
  conjointEmail: string;
  conjointPhone: string;

  // Souscription - Étape 3/7: Questionnaire médical
  taille: number;
  poids: number;
  medicalQ1?: boolean;
  medicalQ2?: boolean;
  medicalQ3?: boolean;
  medicalQ4?: boolean;
  medicalQ5?: boolean;
  medicalQ6?: boolean;
  medicalQ7?: boolean;
  medicalQ8?: boolean;
  medicalQ9?: boolean;
  medicalQ10?: boolean;

  // Souscription - Étape 4/7: Bénéficiaires
  beneficiaireType: BeneficiaireType;
  beneficiaireNom?: string;
  beneficiairePrenom?: string;
  beneficiaireLien?: string;
  beneficiairePourcentage?: number;

  // Souscription - Étape 5/7: Moyen de prélèvement
  prelevementAuto?: boolean;
  typePrelevement?: PrelevementType;
  rib?: string;
  nomBanque?: string;
  titulaireBanque?: string;
  ribDocumentFile?: string;

  // Souscription - Étape 6/7: Résumé & Signature
  acceptCGU: boolean;
  signatureMethod: SignatureMethodType;
  signatureData?: string;

  // Souscription - Étape 7/7: Paiement
  paymentPhoneNumber: string;
  selectedPaymentMethod?: PaymentMethodObseques;

  // Legacy fields for compatibility
  geographicLocation?: string;
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
    category: "non-vie",
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
  // Données Pack Obsèques par défaut
  packObsequesData: {
    selectedOption: "option1",
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
    nationality: "",
    profession: "",
    paysResidence: "",
    villeResidence: "",
    conjointIdType: "",
    conjointIdNumber: "",
    conjointLastName: "",
    conjointFirstName: "",
    conjointBirthDate: "",
    conjointNationality: "",
    conjointProfession: "",
    conjointPaysResidence: "",
    conjointVilleResidence: "",
    conjointEmail: "",
    conjointPhone: "",
    taille: 0,
    poids: 0,
    beneficiaireType: "ayant_droit",
    acceptCGU: false,
    signatureMethod: "signer_ici",
    paymentPhoneNumber: "",
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
