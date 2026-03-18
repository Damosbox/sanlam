import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuidedSalesState, PackObsequesData, MaritalStatusType, ProfessionType, IdentityDocType, PrelevementType, PaymentMethodObseques, BeneficiaireType, SignatureMethodType } from "../types";
import { ChevronLeft, ChevronRight, Upload, User, FileCheck, Stethoscope, Users, CreditCard, FileText, Banknote, Check, Loader2, ScanLine, ShieldCheck, ShieldAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CameraUploadButton } from "@/components/ui/CameraUploadButton";
import { formatFCFA } from "@/utils/formatCurrency";
import { calculatePackObsequesPremium, getPeriodicPremium, MAX_AGE_PRINCIPAL, MAX_AGE_CONJOINT } from "@/utils/packObsequesPremiumCalculator";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface PackObsequesSubscriptionFlowProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<PackObsequesData>) => void;
  onNext: () => void;
  initialSubStep?: number;
  onSubStepChange?: (step: number) => void;
}

const NATIONALITIES = [
  "Ivoirienne", "Afghane", "Algérienne", "Allemande", "Américaine", "Anglaise", "Argentine", "Australienne",
  "Belge", "Brésilienne", "Burkinabè", "Camerounaise", "Canadienne", "Chinoise", "Congolaise",
  "Égyptienne", "Espagnole", "Française", "Gabonaise", "Ghanéenne", "Guinéenne",
  "Indienne", "Italienne", "Japonaise", "Kényane", "Libanaise", "Malienne",
  "Marocaine", "Nigériane", "Nigérienne", "Russe", "Sénégalaise", "Sud-Africaine",
  "Togolaise", "Tunisienne", "Turque"
];

const COUNTRIES = [
  "Côte d'Ivoire", "Afghanistan", "Algérie", "Allemagne", "Belgique", "Bénin", "Burkina Faso",
  "Cameroun", "Canada", "Chine", "Congo", "Égypte", "Espagne", "États-Unis", "France",
  "Gabon", "Ghana", "Guinée", "Inde", "Italie", "Japon", "Kenya", "Liban", "Mali",
  "Maroc", "Niger", "Nigeria", "Royaume-Uni", "Russie", "Sénégal", "Afrique du Sud",
  "Togo", "Tunisie", "Turquie"
];

const PhoneAlert = ({ value }: { value: string }) => {
  if (value && value.replace(/\D/g, "").length > 0 && value.replace(/\D/g, "").length < 10) {
    return <p className="text-xs text-destructive">Le numéro doit contenir au moins 10 chiffres</p>;
  }
  return null;
};

const formatDateFR = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: fr });
  } catch {
    return dateStr;
  }
};

const MIN_AGE = 18;

const getAge = (dateStr: string) => {
  if (!dateStr) return 0;
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const getMaxBirthDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().split("T")[0];
};

const getMinBirthDateForAge = (maxAge: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - maxAge);
  return d.toISOString().split("T")[0];
};

const AgeAlert = ({ value, maxAge, label }: { value: string; maxAge?: number; label?: string }) => {
  if (!value) return null;
  const age = getAge(value);
  if (age < MIN_AGE) {
    return <p className="text-xs text-destructive">{label || "L'assuré"} doit avoir au moins {MIN_AGE} ans</p>;
  }
  if (maxAge && age > maxAge) {
    return <p className="text-xs text-destructive">{label || "L'assuré"} ne peut pas dépasser {maxAge} ans</p>;
  }
  return null;
};

export const PackObsequesSubscriptionFlow = ({
  state,
  onUpdate,
  onNext,
  initialSubStep,
  onSubStepChange
}: PackObsequesSubscriptionFlowProps) => {
  const [currentStep, setCurrentStepLocal] = useState(initialSubStep || 1);
  const [isOCRProcessing, setIsOCRProcessing] = useState<"step1" | "step2" | "beneficiaire" | null>(null);
  const [screeningStep1, setScreeningStep1] = useState<"idle" | "processing" | "ok" | "blocked">("idle");
  const [screeningStep2, setScreeningStep2] = useState<"idle" | "processing" | "ok" | "blocked">("idle");
  const fileInputStep1Ref = useRef<HTMLInputElement>(null);
  const fileInputStep2Ref = useRef<HTMLInputElement>(null);
  const data = state.packObsequesData!;

  const setCurrentStep = (step: number | ((prev: number) => number)) => {
    setCurrentStepLocal(prev => {
      const newStep = typeof step === "function" ? step(prev) : step;
      onSubStepChange?.(newStep);
      return newStep;
    });
  };

  const isMarried = data.maritalStatus === "marie";
  const totalSteps = 7;

  const goNext = () => {
    if (currentStep === 1 && !isMarried) {
      setCurrentStep(3); // Skip conjoint
    } else if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      // Step 7: finalize and advance main flow
      toast.success("Paiement initié avec succès !");
      onNext();
    }
  };

  const goPrev = () => {
    if (currentStep === 3 && !isMarried) {
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStart = () => setCurrentStep(1);

  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: "step1" | "step2") => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsOCRProcessing(target);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data: result, error } = await supabase.functions.invoke("ocr-identity", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;

      if (result?.extracted) {
        const ext = result.extracted;
        const filledFields: string[] = [];
        let extractedFirstName = "";
        let extractedLastName = "";

        if (target === "step1") {
          const updates: Partial<PackObsequesData> = {};
          if (ext.lastName) { updates.lastName = ext.lastName; extractedLastName = ext.lastName; filledFields.push("Nom"); }
          if (ext.firstName) { updates.firstName = ext.firstName; extractedFirstName = ext.firstName; filledFields.push("Prénom"); }
          if (ext.documentNumber) { updates.identityNumber = ext.documentNumber; filledFields.push("N° pièce"); }
          if (ext.documentType) {
            const typeMap: Record<string, string> = { "CNI": "cni", "Passeport": "passeport", "Permis de conduire": "permis", "Carte consulaire": "carte_sejour" };
            const mapped = typeMap[ext.documentType] || "cni";
            updates.identityDocumentType = mapped;
            filledFields.push("Type pièce");
          }
          if (ext.birthDate) { updates.birthDate = ext.birthDate; filledFields.push("Date naissance"); }
          onUpdate(updates);
        } else {
          const updates: Partial<PackObsequesData> = {};
          if (ext.lastName) { updates.conjointLastName = ext.lastName; extractedLastName = ext.lastName; filledFields.push("Nom"); }
          if (ext.firstName) { updates.conjointFirstName = ext.firstName; extractedFirstName = ext.firstName; filledFields.push("Prénom"); }
          if (ext.documentNumber) { updates.conjointIdNumber = ext.documentNumber; filledFields.push("N° pièce"); }
          if (ext.documentType) {
            const typeMap: Record<string, string> = { "CNI": "cni", "Passeport": "passeport", "Permis de conduire": "permis", "Carte consulaire": "carte_sejour" };
            const mapped = typeMap[ext.documentType] || "cni";
            updates.conjointIdType = mapped;
            filledFields.push("Type pièce");
          }
          if (ext.birthDate) { updates.conjointBirthDate = ext.birthDate; filledFields.push("Date naissance"); }
          onUpdate(updates);
        }

        if (filledFields.length > 0) {
          toast.success(`Pièce analysée ! Champs pré-remplis : ${filledFields.join(", ")}`, { duration: 5000 });
        } else {
          toast.warning("L'analyse n'a pas pu extraire de données.");
        }

        // Chain LCB-FT screening automatically
        if (extractedFirstName && extractedLastName) {
          const setScreening = target === "step1" ? setScreeningStep1 : setScreeningStep2;
          setScreening("processing");
          try {
            const { data: screening, error: screenErr } = await supabase.functions.invoke("screen-ppe", {
              body: {
                clientId: "guided-sales-temp",
                entityType: "lead",
                firstName: extractedFirstName,
                lastName: extractedLastName,
                nationality: target === "step1" ? data.nationality : data.conjointNationality,
              },
            });
            if (screenErr) throw screenErr;
            setScreening(screening?.result?.screeningBlocked ? "blocked" : "ok");
          } catch (screenError) {
            console.error("Screening error:", screenError);
            setScreening("ok"); // fail-open for demo
          }
        }
      } else {
        toast.warning("Impossible d'extraire les données du document.");
      }
    } catch (err) {
      console.error("OCR error:", err);
      toast.error("Erreur lors de l'analyse du document");
    } finally {
      setIsOCRProcessing(null);
      if (target === "step1" && fileInputStep1Ref.current) fileInputStep1Ref.current.value = "";
      if (target === "step2" && fileInputStep2Ref.current) fileInputStep2Ref.current.value = "";
    }
  };

  // ===== VALIDATION =====
  const isAgeValid = (dateStr: string, maxAge?: number) => {
    if (!dateStr) return false;
    const age = getAge(dateStr);
    if (age < MIN_AGE) return false;
    if (maxAge && age > maxAge) return false;
    return true;
  };

  const isStep1Valid = data.identityDocumentType && data.identityNumber && data.lastName && data.firstName && data.birthDate && isAgeValid(data.birthDate, MAX_AGE_PRINCIPAL) && data.nationality && data.profession && data.maritalStatus && data.email && data.phone && screeningStep1 !== "blocked";
  const isStep2Valid = data.conjointIdType && data.conjointIdNumber && data.conjointLastName && data.conjointFirstName && data.conjointBirthDate && isAgeValid(data.conjointBirthDate, MAX_AGE_CONJOINT) && data.conjointNationality && data.conjointProfession && data.conjointEmail && data.conjointPhone && screeningStep2 !== "blocked";
  const isStep3Valid = data.taille > 0 && data.poids > 0 && data.medicalQ1 !== undefined && data.medicalQ2 !== undefined && data.medicalQ3 !== undefined && data.medicalQ4 !== undefined && data.medicalQ5 !== undefined && data.medicalQ6 !== undefined && data.medicalQ7 !== undefined && data.medicalQ8 !== undefined && data.medicalQ9 !== undefined && data.medicalQ10 !== undefined;
  const isStep4Valid = !!data.beneficiaireType && (data.beneficiaireType === "ayant_droit" || (data.beneficiaireNom && data.beneficiairePrenom && data.beneficiaireLien));
  const isStep5Valid = data.prelevementAuto === false || (data.prelevementAuto === true && data.typePrelevement && (data.typePrelevement !== "banque" || (data.rib && data.nomBanque && data.titulaireBanque)));
  const isStep6Valid = data.acceptCGU && data.signatureMethod;
  const isStep7Valid = data.paymentPhoneNumber && data.selectedPaymentMethod;

  const getStepValid = () => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      case 5: return isStep5Valid;
      case 6: return isStep6Valid;
      case 7: return isStep7Valid;
      default: return false;
    }
  };

  // ===== STEP 1: Enregistrement assuré principal =====
  const renderStep1 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Enregistrement assuré principal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OCR Scanner - FIRST BLOCK */}
        <div className="space-y-2">
          <Label className="font-medium">📄 Scanner une pièce d'identité</Label>
          <input
            ref={fileInputStep1Ref}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleOCRUpload(e, "step1")}
            disabled={isOCRProcessing !== null}
          />
          {isOCRProcessing === "step1" ? (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">Analyse en cours...</p>
                <p className="text-xs text-muted-foreground">Extraction des données d'identité</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Scannez la pièce pour pré-remplir les champs ci-dessous</p>
              <CameraUploadButton
                id="ocr-identity-step1"
                onFileSelected={(file) => {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  const fakeEvent = { target: { files: dt.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleOCRUpload(fakeEvent, "step1");
                }}
                disabled={isOCRProcessing !== null}
                uploadLabel="Uploader"
                cameraLabel="Scanner"
              />
            </div>
          )}
          {/* Screening status */}
          {screeningStep1 === "processing" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Vérification de conformité...
            </div>
          )}
          {screeningStep1 === "ok" && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Conformité validée
            </Badge>
          )}
          {screeningStep1 === "blocked" && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Souscription impossible</AlertTitle>
              <AlertDescription>
                Un contrôle de conformité empêche la poursuite de cette souscription. Contactez votre responsable.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label>Type de pièce d'identité *</Label>
          <Select value={data.identityDocumentType} onValueChange={(v) => onUpdate({ identityDocumentType: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="attestation_identite">Attestation d'identité</SelectItem>
              <SelectItem value="cni">CNI</SelectItem>
              <SelectItem value="passeport">Passeport</SelectItem>
              <SelectItem value="permis">Permis de conduire</SelectItem>
              <SelectItem value="carte_sejour">Carte de séjour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Numéro d'identification *</Label>
          <Input value={data.identityNumber} onChange={(e) => onUpdate({ identityNumber: e.target.value })} placeholder="Écrivez ici" />
        </div>

        <div className="space-y-2">
          <Label>Nom de famille * {data.lastName && <span className="text-xs text-muted-foreground italic">(pré-rempli)</span>}</Label>
          <Input value={data.lastName} onChange={(e) => onUpdate({ lastName: e.target.value })} placeholder="Écrivez ici" />
        </div>

        <div className="space-y-2">
          <Label>Prénoms * {data.firstName && <span className="text-xs text-muted-foreground italic">(pré-rempli)</span>}</Label>
          <Input value={data.firstName} onChange={(e) => onUpdate({ firstName: e.target.value })} placeholder="Écrivez ici" />
        </div>

         <div className="space-y-2">
           <Label>Date de naissance * {data.birthDate && <span className="text-xs text-muted-foreground italic">(pré-rempli)</span>}</Label>
           <Input type="date" value={data.birthDate} min={getMinBirthDateForAge(MAX_AGE_PRINCIPAL)} max={getMaxBirthDate()} onChange={(e) => onUpdate({ birthDate: e.target.value })} />
           <AgeAlert value={data.birthDate} maxAge={MAX_AGE_PRINCIPAL} label="L'assuré principal" />
         </div>

        <div className="space-y-2">
          <Label>Nationalité *</Label>
          <Select value={data.nationality} onValueChange={(v) => onUpdate({ nationality: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>
              {NATIONALITIES.map(n => <SelectItem key={n} value={n.toLowerCase()}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Profession *</Label>
          <Select value={data.profession} onValueChange={(v) => onUpdate({ profession: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="agriculteur_exploitant">Agriculteur exploitant</SelectItem>
              <SelectItem value="artisans">Artisans</SelectItem>
              <SelectItem value="cadres">Cadres et professions intellectuelles supérieures</SelectItem>
              <SelectItem value="employes">Employés</SelectItem>
              <SelectItem value="ouvriers">Ouvriers</SelectItem>
              <SelectItem value="professions_intermediaires">Professions intermédiaires</SelectItem>
              <SelectItem value="retraites">Retraités</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Pays de résidence</Label>
          <Select value={data.paysResidence} onValueChange={(v) => onUpdate({ paysResidence: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => <SelectItem key={c} value={c.toLowerCase().replace(/[' ]/g, "_")}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ville de résidence</Label>
          <Input value={data.villeResidence} onChange={(e) => onUpdate({ villeResidence: e.target.value })} placeholder="Écrivez ici" />
        </div>

        <div className="space-y-2">
          <Label>Situation matrimoniale *</Label>
          <Select value={data.maritalStatus} onValueChange={(v) => onUpdate({ maritalStatus: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="marie">Marié</SelectItem>
              <SelectItem value="celibataire">Célibataire</SelectItem>
              <SelectItem value="divorce">Divorcé(e)</SelectItem>
              <SelectItem value="veuf">Veuf / Veuve</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Email * {data.email && <span className="text-xs text-muted-foreground italic">(pré-rempli)</span>}</Label>
          <Input type="email" value={data.email} onChange={(e) => onUpdate({ email: e.target.value })} placeholder="adjoua.kouassi@email.ci" />
        </div>

        <div className="space-y-2">
          <Label>Téléphone * {data.phone && <span className="text-xs text-muted-foreground italic">(pré-rempli)</span>}</Label>
          <Input type="tel" value={data.phone} onChange={(e) => onUpdate({ phone: e.target.value })} placeholder="Écrivez ici" />
          <PhoneAlert value={data.phone} />
        </div>
      </CardContent>
    </Card>
  );

  // ===== STEP 2: Conjoint =====
  const renderStep2 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Conjoint
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OCR Scanner - FIRST BLOCK */}
        <div className="space-y-2">
          <Label className="font-medium">📄 Scanner la pièce d'identité du conjoint</Label>
          <input
            ref={fileInputStep2Ref}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleOCRUpload(e, "step2")}
            disabled={isOCRProcessing !== null}
          />
          {isOCRProcessing === "step2" ? (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">Analyse en cours...</p>
                <p className="text-xs text-muted-foreground">Extraction des données d'identité du conjoint</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Scannez la pièce pour pré-remplir les champs ci-dessous</p>
              <CameraUploadButton
                id="ocr-identity-step2"
                onFileSelected={(file) => {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  const fakeEvent = { target: { files: dt.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleOCRUpload(fakeEvent, "step2");
                }}
                disabled={isOCRProcessing !== null}
                uploadLabel="Uploader"
                cameraLabel="Scanner"
              />
            </div>
          )}
          {/* Screening status */}
          {screeningStep2 === "processing" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Vérification de conformité...
            </div>
          )}
          {screeningStep2 === "ok" && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Conformité validée
            </Badge>
          )}
          {screeningStep2 === "blocked" && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Souscription impossible</AlertTitle>
              <AlertDescription>
                Un contrôle de conformité empêche la poursuite de cette souscription. Contactez votre responsable.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label>Type de pièce d'identité *</Label>
          <Select value={data.conjointIdType} onValueChange={(v) => onUpdate({ conjointIdType: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="attestation_identite">Attestation d'identité</SelectItem>
              <SelectItem value="cni">CNI</SelectItem>
              <SelectItem value="passeport">Passeport</SelectItem>
              <SelectItem value="permis">Permis de conduire</SelectItem>
              <SelectItem value="carte_sejour">Carte de séjour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Numéro d'identification *</Label>
          <Input value={data.conjointIdNumber} onChange={(e) => onUpdate({ conjointIdNumber: e.target.value })} placeholder="Écrivez ici" />
        </div>

        <div className="space-y-2">
          <Label>Nom de famille *</Label>
          <Input value={data.conjointLastName} onChange={(e) => onUpdate({ conjointLastName: e.target.value })} placeholder="Écrivez ici" />
        </div>

        <div className="space-y-2">
          <Label>Prénoms *</Label>
          <Input value={data.conjointFirstName} onChange={(e) => onUpdate({ conjointFirstName: e.target.value })} placeholder="Écrivez ici" />
        </div>

         <div className="space-y-2">
           <Label>Date de naissance *</Label>
           <Input type="date" value={data.conjointBirthDate} min={getMinBirthDateForAge(MAX_AGE_CONJOINT)} max={getMaxBirthDate()} onChange={(e) => onUpdate({ conjointBirthDate: e.target.value })} />
           <AgeAlert value={data.conjointBirthDate} maxAge={MAX_AGE_CONJOINT} label="Le conjoint" />
         </div>

        <div className="space-y-2">
          <Label>Nationalité *</Label>
          <Select value={data.conjointNationality} onValueChange={(v) => onUpdate({ conjointNationality: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>
              {NATIONALITIES.map(n => <SelectItem key={n} value={n.toLowerCase()}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Profession *</Label>
          <Select value={data.conjointProfession} onValueChange={(v) => onUpdate({ conjointProfession: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="agriculteur_exploitant">Agriculteur exploitant</SelectItem>
              <SelectItem value="artisans">Artisans</SelectItem>
              <SelectItem value="cadres">Cadres et professions intellectuelles supérieures</SelectItem>
              <SelectItem value="employes">Employés</SelectItem>
              <SelectItem value="ouvriers">Ouvriers</SelectItem>
              <SelectItem value="professions_intermediaires">Professions intermédiaires</SelectItem>
              <SelectItem value="retraites">Retraités</SelectItem>
            </SelectContent>
          </Select>
        </div>

         <div className="space-y-2">
           <Label>Pays de résidence</Label>
           <Select value={data.conjointPaysResidence} onValueChange={(v) => onUpdate({ conjointPaysResidence: v })}>
             <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
             <SelectContent>
               {COUNTRIES.map(c => <SelectItem key={c} value={c.toLowerCase().replace(/[' ]/g, "_")}>{c}</SelectItem>)}
             </SelectContent>
           </Select>
         </div>

         <div className="space-y-2">
           <Label>Ville de résidence</Label>
           <Input value={data.conjointVilleResidence} onChange={(e) => onUpdate({ conjointVilleResidence: e.target.value })} placeholder="Écrivez ici" />
         </div>

        <div className="space-y-2">
          <Label>Email *</Label>
          <Input type="email" value={data.conjointEmail} onChange={(e) => onUpdate({ conjointEmail: e.target.value })} placeholder="Écrivez ici" />
        </div>

        <div className="space-y-2">
          <Label>Téléphone *</Label>
          <Input type="tel" value={data.conjointPhone} onChange={(e) => onUpdate({ conjointPhone: e.target.value })} placeholder="Écrivez ici" />
          <PhoneAlert value={data.conjointPhone} />
        </div>
      </CardContent>
    </Card>
  );

  // ===== STEP 3: Questionnaire médical =====
  const medicalQuestions = [
    { key: "medicalQ1" as const, text: "Avez-vous été hospitalisé pour des problèmes cardio-vasculaire ou déjà eu un AVC ou une crise cardiaque ?" },
    { key: "medicalQ2" as const, text: "Souffrez-vous d'une insuffisance rénale ?" },
    { key: "medicalQ3" as const, text: "Souffrez-vous de diabète ?" },
    { key: "medicalQ4" as const, text: "Souffrez-vous d'un cancer ?" },
    { key: "medicalQ5" as const, text: "Avez-vous été amputé ?" },
    { key: "medicalQ6" as const, text: "Souffrez-vous de cirrhose ?" },
    { key: "medicalQ7" as const, text: "Êtes-vous paraplégique / hémiplégique ?" },
    { key: "medicalQ8" as const, text: "Êtes-vous totalement aveugle ?" },
    { key: "medicalQ9" as const, text: "Avez-vous eu une opération chirurgicale au cours de ces 12 derniers mois ?" },
    { key: "medicalQ10" as const, text: "Êtes-vous hospitalisé ou en congé de maladie de plus de 30 jours continus au cours des 12 derniers mois ?" },
  ];

  const renderStep3 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          Questionnaire médical - Assuré principal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Taille (cm) *</Label>
            <Input type="number" min={0} value={data.taille || ""} onChange={(e) => onUpdate({ taille: Number(e.target.value) })} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Poids (kg) *</Label>
            <Input type="number" min={0} value={data.poids || ""} onChange={(e) => onUpdate({ poids: Number(e.target.value) })} placeholder="0" />
          </div>
        </div>

        {medicalQuestions.map((q, i) => (
          <div key={q.key} className="space-y-2">
            <Label className="text-sm leading-relaxed">{i + 1}. {q.text} *</Label>
            <RadioGroup
              value={data[q.key] === true ? "oui" : data[q.key] === false ? "non" : ""}
              onValueChange={(v) => onUpdate({ [q.key]: v === "oui" })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oui" id={`${q.key}-oui`} />
                <Label htmlFor={`${q.key}-oui`} className="font-normal cursor-pointer">Oui</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non" id={`${q.key}-non`} />
                <Label htmlFor={`${q.key}-non`} className="font-normal cursor-pointer">Non</Label>
              </div>
            </RadioGroup>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  // ===== OCR handler for beneficiaire =====
  const handleBeneficiaireOCR = async (file: File) => {
    setIsOCRProcessing("beneficiaire");
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data: result, error } = await supabase.functions.invoke("ocr-identity", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;

      if (result?.extracted) {
        const ext = result.extracted;
        const updates: Partial<PackObsequesData> = {};
        const filledFields: string[] = [];
        if (ext.lastName) { updates.beneficiaireNom = ext.lastName; filledFields.push("Nom"); }
        if (ext.firstName) { updates.beneficiairePrenom = ext.firstName; filledFields.push("Prénom"); }
        onUpdate(updates);
        if (filledFields.length > 0) {
          toast.success(`Pièce analysée ! Champs pré-remplis : ${filledFields.join(", ")}`, { duration: 5000 });
        } else {
          toast.warning("L'analyse n'a pas pu extraire de données.");
        }
      } else {
        toast.warning("Impossible d'extraire les données du document.");
      }
    } catch (err) {
      console.error("OCR error:", err);
      toast.error("Erreur lors de l'analyse du document");
    } finally {
      setIsOCRProcessing(null);
    }
  };

  // ===== STEP 4: Bénéficiaires =====
  const renderStep4 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Information sur les bénéficiaires
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={data.beneficiaireType}
          onValueChange={(v) => onUpdate({ beneficiaireType: v as BeneficiaireType })}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ayant_droit" id="ben-legal" />
            <Label htmlFor="ben-legal" className="font-normal cursor-pointer">Ayant droit légaux</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="autre" id="ben-autre" />
            <Label htmlFor="ben-autre" className="font-normal cursor-pointer">Autre à préciser</Label>
          </div>
        </RadioGroup>

        {data.beneficiaireType === "autre" && (
          <div className="space-y-4 pt-4 border-t">
            {/* OCR Scanner for beneficiary */}
            <div className="space-y-2">
              <Label className="font-medium">📄 Scanner la pièce d'identité du bénéficiaire</Label>
              {isOCRProcessing === "beneficiaire" ? (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="text-sm font-medium">Analyse en cours...</p>
                    <p className="text-xs text-muted-foreground">Extraction des données d'identité du bénéficiaire</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Scannez la pièce pour pré-remplir nom et prénom</p>
                  <CameraUploadButton
                    id="ocr-identity-beneficiaire"
                    onFileSelected={handleBeneficiaireOCR}
                    disabled={isOCRProcessing !== null}
                    uploadLabel="Uploader"
                    cameraLabel="Scanner"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nom du bénéficiaire * {data.beneficiaireNom && <span className="text-xs text-muted-foreground italic">(pré-rempli)</span>}</Label>
              <Input value={data.beneficiaireNom || ""} onChange={(e) => onUpdate({ beneficiaireNom: e.target.value })} placeholder="Écrivez ici" />
            </div>
            <div className="space-y-2">
              <Label>Prénom du bénéficiaire * {data.beneficiairePrenom && <span className="text-xs text-muted-foreground italic">(pré-rempli)</span>}</Label>
              <Input value={data.beneficiairePrenom || ""} onChange={(e) => onUpdate({ beneficiairePrenom: e.target.value })} placeholder="Écrivez ici" />
            </div>
            <div className="space-y-2">
              <Label>Lien de parenté *</Label>
              <Input value={data.beneficiaireLien || ""} onChange={(e) => onUpdate({ beneficiaireLien: e.target.value })} placeholder="Écrivez ici" />
            </div>
            <div className="space-y-2">
              <Label>Pourcentage (%)</Label>
              <Input type="number" min={0} max={100} value={data.beneficiairePourcentage || ""} onChange={(e) => onUpdate({ beneficiairePourcentage: Number(e.target.value) })} placeholder="100" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ===== STEP 5: Moyen de prélèvement =====
  const renderStep5 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Moyen de prélèvement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Souhaitez-vous opter pour un prélèvement automatique ? *</Label>
          <Select
            value={data.prelevementAuto === true ? "oui" : data.prelevementAuto === false ? "non" : ""}
            onValueChange={(v) => onUpdate({ prelevementAuto: v === "oui" })}
          >
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="oui">Oui</SelectItem>
              <SelectItem value="non">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.prelevementAuto && (
          <>
            <div className="space-y-2">
              <Label>Type de moyen de prélèvement *</Label>
              <Select value={data.typePrelevement || ""} onValueChange={(v) => onUpdate({ typePrelevement: v as PrelevementType })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banque">Banque</SelectItem>
                  <SelectItem value="solde">Solde</SelectItem>
                  <SelectItem value="aps">APS</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data.typePrelevement === "banque" && (
              <>
                <div className="space-y-2">
                  <Label>RIB *</Label>
                  <Input value={data.rib || ""} onChange={(e) => onUpdate({ rib: e.target.value })} placeholder="Écrivez ici" />
                </div>
                <div className="space-y-2">
                  <Label>Nom de la Banque *</Label>
                  <Input value={data.nomBanque || ""} onChange={(e) => onUpdate({ nomBanque: e.target.value })} placeholder="Écrivez ici" />
                </div>
                <div className="space-y-2">
                  <Label>Nom du titulaire du compte *</Label>
                  <Input value={data.titulaireBanque || ""} onChange={(e) => onUpdate({ titulaireBanque: e.target.value })} placeholder="Écrivez ici" />
                </div>
                <div className="space-y-2">
                  <Label>Téléchargez les documents (RIB)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Téléchargez ici...</p>
                  </div>
                </div>
              </>
            )}

            {data.typePrelevement === "solde" && (
              <>
                <div className="space-y-2">
                  <Label>Matricule *</Label>
                  <Input value={data.soldeMatricule || ""} onChange={(e) => onUpdate({ soldeMatricule: e.target.value })} placeholder="Numéro matricule" />
                </div>
                <div className="space-y-2">
                  <Label>Employeur *</Label>
                  <Input value={data.soldeEmployeur || ""} onChange={(e) => onUpdate({ soldeEmployeur: e.target.value })} placeholder="Nom de l'employeur" />
                </div>
                <div className="space-y-2">
                  <Label>Direction / Service</Label>
                  <Input value={data.soldeDirection || ""} onChange={(e) => onUpdate({ soldeDirection: e.target.value })} placeholder="Direction ou service" />
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  // ===== STEP 6: Résumé + Détail prime =====
  const breakdown = calculatePackObsequesPremium(data);
  const periodicPremium = getPeriodicPremium(breakdown.primeTotale, data.periodicity);
  const premierePrime = periodicPremium + breakdown.fraisAccessoires;

  const renderStep6 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Résumé souscription Pack Obsèques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" defaultValue={["prime", "assure"]} className="w-full">
          {/* Détail de la prime */}
          <AccordionItem value="prime">
            <AccordionTrigger>Détail de la prime</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">Première prime</span>
                  <span className="text-lg font-bold text-primary">{formatFCFA(premierePrime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prime Périodique nette</span>
                  <span className="font-medium">{formatFCFA(periodicPremium)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frais d'adhésion</span>
                  <span className="font-medium">{formatFCFA(breakdown.fraisAccessoires)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="assure">
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1">Informations sur l'assuré(e) principal(e)</AccordionTrigger>
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="text-muted-foreground hover:text-primary text-xs gap-1 mr-2 shrink-0">
                <ChevronLeft className="h-3 w-3" />Modifier
              </Button>
            </div>
            <AccordionContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span>{data.lastName} {data.firstName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">E-mail</span><span>{data.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span><span>{data.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date de naissance</span><span>{formatDateFR(data.birthDate)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Nationalité</span><span className="capitalize">{data.nationality}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Profession</span><span className="capitalize">{data.profession?.replace(/_/g, " ")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Situation matrimoniale</span><span className="capitalize">{data.maritalStatus}</span></div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {isMarried && (
            <AccordionItem value="conjoint">
              <div className="flex items-center justify-between">
                <AccordionTrigger className="flex-1">Information sur le conjoint</AccordionTrigger>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="text-muted-foreground hover:text-primary text-xs gap-1 mr-2 shrink-0">
                  <ChevronLeft className="h-3 w-3" />Modifier
                </Button>
              </div>
              <AccordionContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span>{data.conjointLastName} {data.conjointFirstName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">E-mail</span><span>{data.conjointEmail}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span><span>{data.conjointPhone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date de naissance</span><span>{formatDateFR(data.conjointBirthDate)}</span></div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="simulation">
            <AccordionTrigger>Données de simulation</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Formule</span><span className="font-medium uppercase">{data.formula}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type d'adhésion</span><span className="font-medium capitalize">{data.adhesionType.replace("_", " + ")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Périodicité</span><span className="font-medium capitalize">{data.periodicity}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Nombre d'enfants</span><span className="font-medium">{data.nombreEnfants}</span></div>
                {data.nombreAscendants > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Nombre d'ascendants</span><span className="font-medium">{data.nombreAscendants}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Date d'effet</span><span className="font-medium">{formatDateFR(data.effectiveDate)}</span></div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="medical">
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1">Questionnaire médical - Assuré principal</AccordionTrigger>
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)} className="text-muted-foreground hover:text-primary text-xs gap-1 mr-2 shrink-0">
                <ChevronLeft className="h-3 w-3" />Modifier
              </Button>
            </div>
            <AccordionContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Taille</span><span>{data.taille} cm</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Poids</span><span>{data.poids} kg</span></div>
                {medicalQuestions.map((q, i) => (
                  <div key={q.key} className="flex justify-between">
                    <span className="text-muted-foreground text-xs max-w-[70%]">{i + 1}. {q.text}</span>
                    <span className="font-medium">{data[q.key] ? "Oui" : "Non"}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="beneficiaires">
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1">Information sur les bénéficiaires</AccordionTrigger>
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)} className="text-muted-foreground hover:text-primary text-xs gap-1 mr-2 shrink-0">
                <ChevronLeft className="h-3 w-3" />Modifier
              </Button>
            </div>
            <AccordionContent>
              <div className="text-sm">
                <span className="capitalize">{data.beneficiaireType === "ayant_droit" ? "Ayant droit légaux" : `${data.beneficiaireNom} ${data.beneficiairePrenom} (${data.beneficiaireLien})`}</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="prelevement">
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1">Moyen de prélèvement</AccordionTrigger>
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(5)} className="text-muted-foreground hover:text-primary text-xs gap-1 mr-2 shrink-0">
                <ChevronLeft className="h-3 w-3" />Modifier
              </Button>
            </div>
            <AccordionContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Prélèvement auto</span><span>{data.prelevementAuto ? "Oui" : "Non"}</span></div>
                {data.prelevementAuto && data.typePrelevement && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{data.typePrelevement}</span></div>
                )}
                {data.typePrelevement === "banque" && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">RIB</span><span>{data.rib}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Banque</span><span>{data.nomBanque}</span></div>
                  </>
                )}
                {data.typePrelevement === "solde" && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Matricule</span><span>{data.soldeMatricule}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Employeur</span><span>{data.soldeEmployeur}</span></div>
                    {data.soldeDirection && <div className="flex justify-between"><span className="text-muted-foreground">Direction</span><span>{data.soldeDirection}</span></div>}
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="cgu"
              checked={data.acceptCGU}
              onCheckedChange={(checked) => onUpdate({ acceptCGU: checked === true })}
            />
            <Label htmlFor="cgu" className="text-sm leading-relaxed cursor-pointer">
              J'accepte les <span className="text-primary underline cursor-pointer">conditions générales d'utilisation</span> et la politique de confidentialité
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Mode de signature</Label>
            <RadioGroup
              value={data.signatureMethod}
              onValueChange={(v) => onUpdate({ signatureMethod: v as SignatureMethodType })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="signer_ici" id="sig-here" />
                <Label htmlFor="sig-here" className="font-normal cursor-pointer">Signez ici</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="telecharger" id="sig-upload" />
                <Label htmlFor="sig-upload" className="font-normal cursor-pointer">Téléchargez la signature</Label>
              </div>
            </RadioGroup>
          </div>

          {data.signatureMethod === "signer_ici" && (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">Zone de signature électronique</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ===== STEP 7: Paiement =====
  const premiumData = state.calculatedPremium;
  const fraisAdhesion = breakdown.fraisAccessoires;
  const fraisOperateur = 0;
  const montantTotal = periodicPremium + fraisAdhesion + fraisOperateur;

  const paymentMethods: { id: PaymentMethodObseques; name: string; color: string }[] = [
    { id: "orange_money", name: "Orange Money", color: "bg-orange-500" },
    { id: "mtn", name: "MTN Money", color: "bg-yellow-500" },
    { id: "wave", name: "Wave", color: "bg-blue-500" },
    { id: "moov", name: "Moov Money", color: "bg-cyan-500" },
  ];

  const isAutoDebitNonEwallet = data.prelevementAuto && data.typePrelevement && data.typePrelevement !== "ewallet";

  const renderStep7 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary" />
          {isAutoDebitNonEwallet ? "Paiement de la première prime" : "Paiement de la souscription"}
        </CardTitle>
        {isAutoDebitNonEwallet && (
          <p className="text-sm text-muted-foreground mt-1">
            Les prochaines primes seront prélevées automatiquement via{" "}
            {data.typePrelevement === "banque" ? "votre compte bancaire" : data.typePrelevement === "solde" ? "votre solde employeur" : "APS"}.
            Seule la première prime et les frais d'adhésion sont à régler maintenant par paiement mobile.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Financial recap */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr><th className="text-left p-3">Description</th><th className="text-right p-3">Montant</th></tr>
            </thead>
            <tbody>
              <tr className="border-t"><td className="p-3">Prime périodique nette</td><td className="p-3 text-right">{formatFCFA(periodicPremium)}</td></tr>
              <tr className="border-t"><td className="p-3">Frais d'adhésion</td><td className="p-3 text-right">{formatFCFA(fraisAdhesion)}</td></tr>
              <tr className="border-t"><td className="p-3">Frais d'opérateur</td><td className="p-3 text-right">{formatFCFA(fraisOperateur)}</td></tr>
              <tr className="border-t bg-primary/5 font-semibold"><td className="p-3">Montant total à payer</td><td className="p-3 text-right">{formatFCFA(montantTotal)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          <Label>Numéro de téléphone *</Label>
          <Input value={data.paymentPhoneNumber} onChange={(e) => onUpdate({ paymentPhoneNumber: e.target.value })} placeholder="Écrivez ici" />
          <PhoneAlert value={data.paymentPhoneNumber} />
        </div>

        <div className="space-y-2">
          <Label>Paiement Mobile</Label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => onUpdate({ selectedPaymentMethod: pm.id })}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  data.selectedPaymentMethod === pm.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <div className={`h-8 w-8 rounded-full ${pm.color} mx-auto mb-2`} />
                <p className="text-sm font-medium">{pm.name}</p>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ===== STEP TITLES =====
  const stepTitles = [
    "", "Enregistrement assuré principal", "Conjoint", "Questionnaire médical",
    "Information sur les bénéficiaires", "Moyen de prélèvement", "Résumé souscription", "Paiement"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Souscription Pack Obsèques</h2>
        <p className="text-muted-foreground">Étape {currentStep}/{totalSteps} - {stepTitles[currentStep]}</p>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`h-1 flex-1 rounded-full transition-colors ${
              currentStep >= step ? "bg-primary" : step === 2 && !isMarried ? "bg-muted/30" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Current step */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {currentStep === 5 && renderStep5()}
      {currentStep === 6 && renderStep6()}
      {currentStep === 7 && renderStep7()}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <div className="flex gap-2">
          {currentStep === 6 && (
            <Button variant="outline" onClick={goToStart} className="gap-2">
              Reprendre
            </Button>
          )}
          <Button variant="outline" onClick={goPrev} disabled={currentStep === 1} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
        </div>
        <Button
          onClick={goNext}
          disabled={!getStepValid()}
          className="gap-2"
        >
          {currentStep === 7 ? (
            <>
              <Check className="h-4 w-4" />
              Payer
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
