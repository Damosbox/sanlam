import { FieldType } from "@/components/admin/FormFieldLibrary";

export type OcrDocumentType = "CNI" | "PERMIS" | "CARTE_GRISE";

export interface OcrKeyDefinition {
  key: string;
  label: string;
}

export const OCR_DOCUMENT_TYPES: { value: OcrDocumentType; label: string }[] = [
  { value: "CNI", label: "Carte Nationale d'Identité" },
  { value: "PERMIS", label: "Permis de conduire" },
  { value: "CARTE_GRISE", label: "Carte grise" },
];

export const OCR_KEYS_BY_TYPE: Record<OcrDocumentType, OcrKeyDefinition[]> = {
  CNI: [
    { key: "surname", label: "Nom" },
    { key: "given_names", label: "Prénoms" },
    { key: "surname_and_given_names", label: "Nom complet" },
    { key: "date_of_birth", label: "Date de naissance" },
    { key: "place_of_birth", label: "Lieu de naissance" },
    { key: "sex", label: "Sexe" },
    { key: "height", label: "Taille" },
    { key: "document_number", label: "Numéro CNI" },
    { key: "date_of_issue", label: "Date de délivrance" },
    { key: "date_of_expiry", label: "Date d'expiration" },
    { key: "place_of_issue", label: "Lieu de délivrance" },
    { key: "issuing_state_name", label: "Pays" },
  ],
  PERMIS: [
    { key: "surname", label: "Nom" },
    { key: "given_names", label: "Prénoms" },
    { key: "surname_and_given_names", label: "Nom complet" },
    { key: "date_of_birth", label: "Date de naissance" },
    { key: "place_of_birth", label: "Lieu de naissance" },
    { key: "document_number", label: "Numéro permis" },
    { key: "date_of_issue", label: "Date de délivrance" },
    { key: "place_of_issue", label: "Lieu de délivrance" },
    { key: "dl_class", label: "Catégories" },
    { key: "issuing_state_name", label: "Pays" },
  ],
  CARTE_GRISE: [
    { key: "owner", label: "Propriétaire" },
    { key: "document_number", label: "Numéro carte grise" },
    { key: "regcert_regnumber", label: "Immatriculation" },
    { key: "regcert_carmark", label: "Marque" },
    { key: "regcert_carmodel", label: "Modèle" },
    { key: "regcert_carcolor", label: "Couleur" },
    { key: "fuel_type", label: "Carburant" },
    { key: "engine_power", label: "Puissance" },
    { key: "engine_volume", label: "Cylindrée" },
    { key: "number_of_seats", label: "Nombre de places" },
    { key: "date_of_issue", label: "Date de délivrance" },
    { key: "first_issue_date", label: "Première mise en circulation" },
    { key: "issuing_state_name", label: "Pays" },
  ],
};

/** Returns the appropriate field type for an OCR key */
export const getDefaultFieldType = (ocrKey: string): FieldType => {
  if (ocrKey.includes("date")) return "date";
  if (["height", "engine_power", "engine_volume", "number_of_seats"].includes(ocrKey)) return "number";
  if (["sex", "dl_class", "fuel_type"].includes(ocrKey)) return "select";
  return "text";
};

/** Returns the default options for select-type OCR fields */
export const getDefaultSelectOptions = (ocrKey: string): string[] | undefined => {
  switch (ocrKey) {
    case "sex":
      return ["M", "F"];
    case "fuel_type":
      return ["Essence", "Diesel", "Hybride", "Électrique", "GPL"];
    case "dl_class":
      return ["A", "A1", "A2", "B", "C", "D", "E"];
    default:
      return undefined;
  }
};

/** Returns the edge function name for a document type */
export const getOcrEdgeFunctionName = (documentType: OcrDocumentType): string => {
  switch (documentType) {
    case "CNI":
    case "PERMIS":
      return "ocr-identity";
    case "CARTE_GRISE":
      return "ocr-vehicle-registration";
  }
};
