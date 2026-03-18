import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { GuidedSalesState, PackObsequesData, PackObsequesFormula, AdhesionType, TitleType, GenderType, ViePeriodicite } from "../types";
import { ChevronLeft, ChevronRight, Shield, Calculator, Check, Save, Send, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { CameraUploadButton } from "@/components/ui/CameraUploadButton";
import { formatFCFA } from "@/utils/formatCurrency";
import { calculatePackObsequesPremium, getPeriodicPremium, MAX_AGE_PRINCIPAL } from "@/utils/packObsequesPremiumCalculator";
import { toast } from "sonner";
import { QuotationSaveDialog } from "../QuotationSaveDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";


interface PackObsequesSimulationStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<PackObsequesData>) => void;
  onNext: () => void;
  onCalculate: () => void;
  onSaveQuote: (clientInfo?: { firstName: string; lastName: string; email: string }) => void;
  isCalculating: boolean;
  onRegisterBackHandler?: (handler: (() => boolean) | null) => void;
  initialSubStep?: number;
  onSubStepChange?: (subStep: number) => void;
}

export const PackObsequesSimulationStep = ({
  state,
  onUpdate,
  onNext,
  onCalculate,
  onSaveQuote,
  isCalculating,
  onRegisterBackHandler,
  initialSubStep,
  onSubStepChange
}: PackObsequesSimulationStepProps) => {
  const [subStepLocal, setSubStepLocal] = useState<1 | 2 | 3 | 4 | 5>((initialSubStep ?? 1) as 1 | 2 | 3 | 4 | 5);

  const setSubStep = (val: 1 | 2 | 3 | 4 | 5) => {
    setSubStepLocal(val);
    onSubStepChange?.(val);
  };

  const subStep = subStepLocal;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"save" | "send">("save");
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [screeningStatus, setScreeningStatus] = useState<"idle" | "processing" | "ok" | "blocked">("idle");
  
  const data = state.packObsequesData!;
  const simulationCalculated = state.simulationCalculated;

  // Register back handler for smart navigation
  useEffect(() => {
    onRegisterBackHandler?.(() => {
      if (subStep === 5) {
        setSubStep(4);
        return true;
      }
      if (subStep === 3) {
        setSubStep(1);
        return true;
      }
      if (subStep > 1) {
        setSubStep((subStep - 1) as 1 | 2 | 3 | 4 | 5);
        return true;
      }
      return false;
    });
    return () => onRegisterBackHandler?.(null);
  }, [subStep, onRegisterBackHandler]);
  
  // Check if family step should be shown
  const showFamilyStep = data.adhesionType !== "individuelle";
  
  // Sub-step navigation (skip sub-step 2, family fields are now inline in step 1)
  const goToNextSubStep = () => {
    if (subStep === 1) {
      setSubStep(3);
    } else if (subStep < 5) {
      setSubStep((subStep + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };
  
  const goToPrevSubStep = () => {
    if (subStep === 5) {
      setSubStep(4);
    } else if (subStep === 3) {
      setSubStep(1);
    } else if (subStep > 1) {
      setSubStep((subStep - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleCalculate = () => {
    onCalculate();
  };

  // Validation checks
  const isSubStep1Valid = data.selectedOption && data.formula && data.adhesionType && data.periodicity && data.effectiveDate;
  const isSubStep2Valid = data.adhesionType === "individuelle" || 
    (data.nombreEnfants >= 0 && (data.adhesionType === "famille" || data.nombreAscendants >= 0));
  const isPhoneValid = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  };
  const getAge = (dateStr: string) => {
    if (!dateStr) return 0;
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };
  const isAgeValid = (dateStr: string) => {
    const age = getAge(dateStr);
    return age >= 18 && age <= MAX_AGE_PRINCIPAL;
  };
  const getMaxBirthDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  };
  const getMinBirthDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - MAX_AGE_PRINCIPAL);
    return d.toISOString().split("T")[0];
  };
  const isSubStep3Valid = data.lastName && data.firstName && data.phone && isPhoneValid(data.phone) && data.birthDate && isAgeValid(data.birthDate) && screeningStatus !== "blocked";
  const isSubStep4Valid = data.email && data.gender && data.title && data.birthPlace;

  const handleSimOCRUpload = async (file: File) => {
    setIsOCRProcessing(true);
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
        if (ext.lastName) { updates.lastName = ext.lastName; filledFields.push("Nom"); }
        if (ext.firstName) { updates.firstName = ext.firstName; filledFields.push("Prénom"); }
        if (ext.birthDate) { updates.birthDate = ext.birthDate; filledFields.push("Date naissance"); }
        onUpdate(updates);

        if (filledFields.length > 0) {
          toast.success(`Pièce analysée ! Champs pré-remplis : ${filledFields.join(", ")}`, { duration: 5000 });
        }

        // Chain LCB-FT screening
        if (ext.firstName && ext.lastName) {
          setScreeningStatus("processing");
          try {
            const { data: screening, error: screenErr } = await supabase.functions.invoke("screen-ppe", {
              body: {
                clientId: "guided-sales-temp",
                entityType: "lead",
                firstName: ext.firstName,
                lastName: ext.lastName,
              },
            });
            if (screenErr) throw screenErr;
            setScreeningStatus(screening?.result?.screeningBlocked ? "blocked" : "ok");
          } catch {
            setScreeningStatus("ok");
          }
        }
      } else {
        toast.warning("Impossible d'extraire les données du document.");
      }
    } catch (err) {
      console.error("OCR error:", err);
      toast.error("Erreur lors de l'analyse du document");
    } finally {
      setIsOCRProcessing(false);
    }
  };

  // Render sub-step 1: Option, Formule & Type
  const renderSubStep1 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Formule et Type d'adhésion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 0. Sélectionner une option */}
        <div className="space-y-2">
          <Label>1. Sélectionner une option *</Label>
          <RadioGroup
            value={data.selectedOption}
            onValueChange={(value) => {
              const opt = value as "option1" | "option2";
              onUpdate({ 
                selectedOption: opt, 
                nombreEnfants: opt === "option1" ? 0 : 4 
              });
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option1" id="option1" />
              <Label htmlFor="option1" className="font-normal cursor-pointer">Option 1 (0 à 3 enfants)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option2" id="option2" />
              <Label htmlFor="option2" className="font-normal cursor-pointer">Option 2 (4 à 6 enfants)</Label>
            </div>
          </RadioGroup>
        </div>
        {/* 2. Formule */}
        <div className="space-y-2">
          <Label>2. Formule *</Label>
          <Select
            value={data.formula}
            onValueChange={(value) => onUpdate({ formula: value as PackObsequesFormula })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une formule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bronze">BRONZE</SelectItem>
              <SelectItem value="argent">ARGENT</SelectItem>
              <SelectItem value="or">OR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 3. Type d'adhésion */}
        <div className="space-y-2">
          <Label>3. Type d'adhésion *</Label>
          <Select
            value={data.adhesionType}
            onValueChange={(value) => onUpdate({ adhesionType: value as AdhesionType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner le type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individuelle">Individuelle</SelectItem>
              <SelectItem value="famille">Famille</SelectItem>
              <SelectItem value="famille_ascendant">Famille + Ascendant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4. Périodicité */}
        <div className="space-y-2">
          <Label>4. Périodicité *</Label>
          <Select
            value={data.periodicity}
            onValueChange={(value) => onUpdate({ periodicity: value as ViePeriodicite })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensuelle">Mensuelle</SelectItem>
              <SelectItem value="trimestrielle">Trimestrielle</SelectItem>
              <SelectItem value="semestrielle">Semestrielle</SelectItem>
              <SelectItem value="annuelle">Annuelle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 5. Nombre d'enfants à charge */}
        <div className="space-y-2">
          <Label>5. Nombre d'enfants à charge ({data.selectedOption === "option2" ? "4-6" : "0-3"}) *</Label>
          <Select
            value={String(data.nombreEnfants)}
            onValueChange={(value) => onUpdate({ nombreEnfants: Number(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.selectedOption === "option2" ? (
                <>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Plafond d'âge : enfants de moins de 21 ans
          </p>
        </div>

        {/* 6. Nombre d'ascendants (conditional) */}
        {data.adhesionType === "famille_ascendant" && (
          <div className="space-y-2">
            <Label>6. Nombre d'ascendants à charge (0-2) *</Label>
            <Select
              value={String(data.nombreAscendants)}
              onValueChange={(value) => onUpdate({ nombreAscendants: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 7. Ajouter conjoint (conditional) */}
        {(data.adhesionType === "famille" || data.adhesionType === "famille_ascendant") && (
          <div className="space-y-2">
            <Label>7. Voulez-vous ajouter votre conjoint(e) ?</Label>
            <RadioGroup
              value={data.addSpouse ? "oui" : "non"}
              onValueChange={(value) => onUpdate({ addSpouse: value === "oui" })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oui" id="spouse-yes-s1" />
                <Label htmlFor="spouse-yes-s1" className="font-normal cursor-pointer">Oui</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non" id="spouse-no-s1" />
                <Label htmlFor="spouse-no-s1" className="font-normal cursor-pointer">Non</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* 8. Date d'effet */}
        <div className="space-y-2">
          <Label>{data.adhesionType === "individuelle" ? "6" : data.adhesionType === "famille" ? "8" : "8"}. Date d'effet *</Label>
          <Input
            type="date"
            value={data.effectiveDate}
            onChange={(e) => onUpdate({ effectiveDate: e.target.value })}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={goToNextSubStep} disabled={!isSubStep1Valid} className="gap-2">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render sub-step 2: Famille (conditional)
  const renderSubStep2 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Composition familiale</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Nombre d'enfants */}
        <div className="space-y-2">
          <Label>1. Nombre d'enfants (0-3)</Label>
          <Select
            value={String(data.nombreEnfants)}
            onValueChange={(value) => onUpdate({ nombreEnfants: Number(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2. Ajouter conjoint? */}
        <div className="space-y-2">
          <Label>2. Ajouter conjoint?</Label>
          <RadioGroup
            value={data.addSpouse ? "oui" : "non"}
            onValueChange={(value) => onUpdate({ addSpouse: value === "oui" })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oui" id="spouse-yes" />
              <Label htmlFor="spouse-yes" className="font-normal cursor-pointer">Oui</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="non" id="spouse-no" />
              <Label htmlFor="spouse-no" className="font-normal cursor-pointer">Non</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 3. Nombre d'ascendants (only for famille_ascendant) */}
        {data.adhesionType === "famille_ascendant" && (
          <div className="space-y-2">
            <Label>3. Nombre d'ascendants (0-2)</Label>
            <Select
              value={String(data.nombreAscendants)}
              onValueChange={(value) => onUpdate({ nombreAscendants: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={goToPrevSubStep} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button onClick={goToNextSubStep} disabled={!isSubStep2Valid} className="gap-2">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render sub-step 3: Assuré principal (1/2) — Nom, Prénom, Téléphone, Date naissance
  const renderSubStep3 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Assuré principal (1/2)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OCR Scanner - FIRST BLOCK */}
        <div className="space-y-2">
          <Label className="font-medium">📄 Scanner une pièce d'identité</Label>
          {isOCRProcessing ? (
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
                id="ocr-simulation-step3"
                onFileSelected={handleSimOCRUpload}
                disabled={isOCRProcessing}
                uploadLabel="Uploader"
                cameraLabel="Scanner"
              />
            </div>
          )}
          {screeningStatus === "processing" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Vérification de conformité...
            </div>
          )}
          {screeningStatus === "ok" && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Conformité validée
            </Badge>
          )}
          {screeningStatus === "blocked" && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Souscription impossible</AlertTitle>
              <AlertDescription>
                Un contrôle de conformité empêche la poursuite. Contactez votre responsable.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* 1. Nom */}
        <div className="space-y-2">
          <Label>1. Nom * {data.lastName && <span className="text-xs text-muted-foreground italic">(pré-rempli)</span>}</Label>
          <Input
            value={data.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            placeholder="Nom de famille"
          />
        </div>

        {/* 2. Prénom */}
        <div className="space-y-2">
          <Label>2. Prénom * {data.firstName && <span className="text-xs text-muted-foreground italic">(pré-rempli)</span>}</Label>
          <Input
            value={data.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            placeholder="Prénom"
          />
        </div>

        {/* 3. Contact téléphonique */}
        <div className="space-y-2">
          <Label>3. Contact téléphonique *</Label>
          <Input
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+225 00 00 00 00 00"
            maxLength={20}
          />
          {data.phone && !isPhoneValid(data.phone) && (
            <p className="text-xs text-destructive">Le numéro doit contenir entre 10 et 15 chiffres</p>
          )}
        </div>

        {/* 4. Date de naissance */}
         <div className="space-y-2">
           <Label>4. Date de naissance *</Label>
           <Input
             type="date"
             value={data.birthDate}
             min={getMinBirthDate()}
             max={getMaxBirthDate()}
             onChange={(e) => onUpdate({ birthDate: e.target.value })}
           />
           {data.birthDate && getAge(data.birthDate) < 18 && (
             <p className="text-xs text-destructive">L'assuré doit avoir au moins 18 ans</p>
           )}
           {data.birthDate && getAge(data.birthDate) > MAX_AGE_PRINCIPAL && (
             <p className="text-xs text-destructive">L'assuré ne peut pas dépasser {MAX_AGE_PRINCIPAL} ans</p>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={goToPrevSubStep} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button onClick={goToNextSubStep} disabled={!isSubStep3Valid} className="gap-2">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render sub-step 4: Assuré principal (2/2) — Email, Sexe, Titre, Lieu naissance + Calculate
  const renderSubStep4 = () => {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Assuré principal (2/2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 1. E-mail */}
          <div className="space-y-2">
            <Label>1. E-mail *</Label>
            <Input
              type="email"
              value={data.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="email@exemple.com"
            />
          </div>

          {/* 2. Sexe */}
          <div className="space-y-2">
            <Label>2. Sexe *</Label>
            <Select
              value={data.gender}
              onValueChange={(value) => onUpdate({ gender: value as GenderType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculin">Masculin</SelectItem>
                <SelectItem value="feminin">Féminin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3. Titre */}
          <div className="space-y-2">
            <Label>3. Titre *</Label>
            <Select
              value={data.title}
              onValueChange={(value) => onUpdate({ title: value as TitleType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monsieur">Monsieur</SelectItem>
                <SelectItem value="madame">Madame</SelectItem>
                <SelectItem value="mademoiselle">Mademoiselle</SelectItem>
                <SelectItem value="docteur">Docteur</SelectItem>
                <SelectItem value="professeur">Professeur</SelectItem>
                <SelectItem value="maitre">Maître</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
                <SelectItem value="entreprise">Entreprise</SelectItem>
                <SelectItem value="etablissement">Établissement</SelectItem>
                <SelectItem value="general">Général</SelectItem>
                <SelectItem value="commandant">Commandant</SelectItem>
                <SelectItem value="lieutenant">Lieutenant</SelectItem>
                <SelectItem value="colonel">Colonel</SelectItem>
                <SelectItem value="warrant_officer">Warrant Officer</SelectItem>
                <SelectItem value="caporal">Caporal</SelectItem>
                <SelectItem value="lieutenant_colonel">Lieutenant Colonel</SelectItem>
                <SelectItem value="sergent">Sergent</SelectItem>
                <SelectItem value="marechal">Maréchal</SelectItem>
                <SelectItem value="monseigneur">Monseigneur</SelectItem>
                <SelectItem value="cardinal">Cardinal</SelectItem>
                <SelectItem value="eveque">Évêque</SelectItem>
                <SelectItem value="pasteur">Pasteur</SelectItem>
                <SelectItem value="camarade">Camarade</SelectItem>
                <SelectItem value="compagnie">Compagnie</SelectItem>
                <SelectItem value="groupe">Groupe</SelectItem>
                <SelectItem value="president">Président</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Lieu de naissance */}
          <div className="space-y-2">
            <Label>4. Lieu de naissance *</Label>
            <Input
              value={data.birthPlace}
              onChange={(e) => onUpdate({ birthPlace: e.target.value })}
              placeholder="Lieu de naissance"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={() => setSubStep(5)}
              disabled={!isSubStep4Valid}
              className="w-full gap-2"
              size="lg"
            >
              Voir le récapitulatif
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" onClick={goToPrevSubStep} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render sub-step 5: Récapitulatif de simulation
  const renderSubStep5 = () => {
    const breakdown = calculatePackObsequesPremium(data);
    const periodicPremium = getPeriodicPremium(breakdown.primeTotale, data.periodicity);
    const premierePrime = periodicPremium + breakdown.fraisAccessoires;

    const SectionEditButton = ({ targetStep }: { targetStep: 1 | 2 | 3 | 4 | 5 }) => (
      <Button variant="ghost" size="sm" onClick={() => setSubStep(targetStep)} className="gap-1.5 text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-3.5 w-3.5" />
        Modifier
      </Button>
    );

    return (
      <div className="space-y-4">
        {/* Section — Détails sur les capitaux (always visible) */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{simulationCalculated ? "2." : "1."} Détails sur les capitaux</CardTitle>
            <SectionEditButton targetStep={1} />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capital assuré principal</span>
                <span className="font-medium">{formatFCFA(breakdown.capitalGaranti - (data.nombreEnfants * breakdown.capitalParEnfant) - (data.nombreAscendants * breakdown.capitalParAscendant))}</span>
              </div>
              {data.nombreEnfants > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capital par enfant</span>
                  <span className="font-medium">{formatFCFA(breakdown.capitalParEnfant)}</span>
                </div>
              )}
              {data.nombreAscendants > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capital par ascendant</span>
                  <span className="font-medium">{formatFCFA(breakdown.capitalParAscendant)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-semibold">Capital total garanti</span>
                <span className="font-bold text-primary">{formatFCFA(breakdown.capitalGaranti)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section — Données de simulation (always visible) */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{simulationCalculated ? "3." : "2."} Données de simulation</CardTitle>
            <SectionEditButton targetStep={1} />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Option</span>
                <span className="font-medium">{data.selectedOption === "option1" ? "Option 1 (0-3 enfants)" : "Option 2 (4-6 enfants)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formule</span>
                <span className="font-medium uppercase">{data.formula}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type d'adhésion</span>
                <span className="font-medium capitalize">{data.adhesionType.replace("_", " + ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Périodicité</span>
                <span className="font-medium capitalize">{data.periodicity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre d'enfants</span>
                <span className="font-medium">{data.nombreEnfants}</span>
              </div>
              {data.nombreAscendants > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre d'ascendants</span>
                  <span className="font-medium">{data.nombreAscendants}</span>
                </div>
              )}
              {(data.adhesionType === "famille" || data.adhesionType === "famille_ascendant") && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conjoint</span>
                  <span className="font-medium">{data.addSpouse ? "Oui" : "Non"}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date d'effet</span>
                <span className="font-medium">{data.effectiveDate ? format(new Date(data.effectiveDate), "dd MMMM yyyy", { locale: fr }) : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assuré</span>
                <span className="font-medium">{data.firstName} {data.lastName}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculer la prime button (before calculation) */}
        {!simulationCalculated && (
          <Button 
            onClick={handleCalculate} 
            disabled={isCalculating}
            className="w-full gap-2"
            size="lg"
          >
            {isCalculating ? (
              <>
                <Calculator className="h-4 w-4 animate-spin" />
                Calcul en cours...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Calculer la prime
              </>
            )}
          </Button>
        )}

        {/* Section — Détail sur la prime (only after calculation) */}
        {simulationCalculated && (
          <>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  1. Détail sur la prime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                    <span className="text-sm font-semibold">Première prime</span>
                    <span className="text-lg font-bold text-primary">{formatFCFA(premierePrime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Prime Périodique nette</span>
                    <span className="font-medium">{formatFCFA(periodicPremium)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frais d'adhésion</span>
                    <span className="font-medium">{formatFCFA(breakdown.fraisAccessoires)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions: Sauvegarder / Envoyer / Souscrire */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => { setDialogMode("save"); setDialogOpen(true); }}
                className="gap-2 flex-1"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { setDialogMode("send"); setDialogOpen(true); }}
                className="gap-2 flex-1"
              >
                <Send className="h-4 w-4" />
                Envoyer
              </Button>
              <Button 
                onClick={onNext}
                className="gap-2 flex-1"
              >
                SOUSCRIRE
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        <Button variant="outline" onClick={goToPrevSubStep} className="gap-2 w-full">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>

        <QuotationSaveDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          defaultValues={{
            lastName: data.lastName || "",
            firstName: data.firstName || "",
            email: data.email || "",
          }}
          onConfirm={(info) => {
            onSaveQuote({ firstName: info.firstName, lastName: info.lastName, email: info.email });
            if (info.channel) {
              toast.success("Cotation envoyée avec succès", {
                description: `Envoyée par ${info.channel} à ${info.email}`,
              });
            } else {
              toast.success("Cotation sauvegardée avec succès");
            }
          }}
        />
      </div>
    );
  };



  const getCurrentStepNumber = () => {
    if (subStep === 1) return 1;
    if (subStep === 2) return 2;
    if (subStep === 3) return showFamilyStep ? 3 : 2;
    if (subStep === 4) return showFamilyStep ? 4 : 3;
    if (subStep === 5) return showFamilyStep ? 5 : 4;
    return 1;
  };

  const getTotalSteps = () => showFamilyStep ? 5 : 4;

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Pack Obsèques</h2>
          <p className="text-muted-foreground">Simulation - Étape {getCurrentStepNumber()}/{getTotalSteps()}</p>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-1">
        {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((step) => (
          <div 
            key={step}
            className={`h-1 flex-1 rounded-full transition-colors ${
              getCurrentStepNumber() >= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Render current sub-step */}
      {subStep === 1 && renderSubStep1()}
      {subStep === 2 && renderSubStep2()}
      {subStep === 3 && renderSubStep3()}
      {subStep === 4 && renderSubStep4()}
      {subStep === 5 && renderSubStep5()}
    </div>
  );
};
