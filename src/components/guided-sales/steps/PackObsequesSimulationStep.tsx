import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GuidedSalesState, PackObsequesData, PackObsequesFormula, AdhesionType, TitleType, GenderType, ViePeriodicite } from "../types";
import { ChevronLeft, ChevronRight, Cross, Calculator, Check } from "lucide-react";
import { formatFCFA } from "@/utils/formatCurrency";
import { calculatePackObsequesPremium } from "@/utils/packObsequesPremiumCalculator";
import { toast } from "sonner";

interface PackObsequesSimulationStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<PackObsequesData>) => void;
  onNext: () => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

export const PackObsequesSimulationStep = ({
  state,
  onUpdate,
  onNext,
  onCalculate,
  isCalculating
}: PackObsequesSimulationStepProps) => {
  const [subStep, setSubStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  
  const data = state.packObsequesData!;
  const simulationCalculated = state.simulationCalculated;
  
  // Check if family step should be shown
  const showFamilyStep = data.adhesionType !== "individuelle";
  
  // Sub-step navigation
  const goToNextSubStep = () => {
    if (subStep === 1) {
      // If individual, skip to sub-step 3
      if (data.adhesionType === "individuelle") {
        setSubStep(3);
      } else {
        setSubStep(2);
      }
    } else if (subStep < 5) {
      setSubStep((subStep + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };
  
  const goToPrevSubStep = () => {
    if (subStep === 3 && data.adhesionType === "individuelle") {
      setSubStep(1);
    } else if (subStep > 1) {
      setSubStep((subStep - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleCalculate = () => {
    onCalculate();
    setSubStep(5);
  };

  // Validation checks
  const isSubStep1Valid = data.formula && data.adhesionType && data.periodicity && data.effectiveDate;
  const isSubStep2Valid = data.adhesionType === "individuelle" || 
    (data.nombreEnfants >= 0 && (data.adhesionType === "famille" || data.nombreAscendants >= 0));
  const isSubStep3Valid = data.title && data.lastName && data.firstName && data.gender;
  const isSubStep4Valid = data.birthDate && data.birthPlace && data.phone && data.email;

  // Render sub-step 1: Formule & Type
  const renderSubStep1 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Formule et Type d'adhésion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Formule */}
        <div className="space-y-2">
          <Label>1. Formule *</Label>
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

        {/* 2. Type d'adhésion */}
        <div className="space-y-2">
          <Label>2. Type d'adhésion *</Label>
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

        {/* 3. Périodicité */}
        <div className="space-y-2">
          <Label>3. Périodicité *</Label>
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

        {/* 4. Date d'effet */}
        <div className="space-y-2">
          <Label>4. Date d'effet *</Label>
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

  // Render sub-step 3: Assuré principal (1/2)
  const renderSubStep3 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Assuré principal (1/2)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Titre */}
        <div className="space-y-2">
          <Label>1. Titre *</Label>
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
              <SelectItem value="maitre">Maître</SelectItem>
              <SelectItem value="corporation">Corporation</SelectItem>
              <SelectItem value="entreprise">Entreprise</SelectItem>
              <SelectItem value="etablissement">Établissement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2. Nom */}
        <div className="space-y-2">
          <Label>2. Nom *</Label>
          <Input
            value={data.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            placeholder="Nom de famille"
          />
        </div>

        {/* 3. Prénom */}
        <div className="space-y-2">
          <Label>3. Prénom *</Label>
          <Input
            value={data.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            placeholder="Prénom"
          />
        </div>

        {/* 4. Sexe */}
        <div className="space-y-2">
          <Label>4. Sexe *</Label>
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

  // Render sub-step 4: Assuré principal (2/2) + Calculate
  const renderSubStep4 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Assuré principal (2/2)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Date de naissance */}
        <div className="space-y-2">
          <Label>1. Date de naissance *</Label>
          <Input
            type="date"
            value={data.birthDate}
            onChange={(e) => onUpdate({ birthDate: e.target.value })}
          />
        </div>

        {/* 2. Lieu de naissance */}
        <div className="space-y-2">
          <Label>2. Lieu de naissance *</Label>
          <Input
            value={data.birthPlace}
            onChange={(e) => onUpdate({ birthPlace: e.target.value })}
            placeholder="Lieu de naissance"
          />
        </div>

        {/* 3. Téléphone */}
        <div className="space-y-2">
          <Label>3. Contact téléphonique *</Label>
          <Input
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+225 00 00 00 00 00"
          />
        </div>

        {/* 4. Email */}
        <div className="space-y-2">
          <Label>4. E-mail *</Label>
          <Input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder="email@exemple.com"
          />
        </div>

        <div className="flex flex-col gap-3 pt-4">
          {/* Calculate Button */}
          <Button 
            onClick={handleCalculate} 
            disabled={!isSubStep4Valid || isCalculating}
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
          
          <Button variant="outline" onClick={goToPrevSubStep} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render sub-step 5: Results
  const renderSubStep5 = () => {
    const breakdown = calculatePackObsequesPremium(data);
    
    return (
      <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Résultat de la simulation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Première prime</p>
                <p className="text-lg font-semibold">{formatFCFA(breakdown.primeTTC)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prime TTC</p>
                <p className="text-lg font-semibold">{formatFCFA(breakdown.primeTTC)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prime périodique nette</p>
                <p className="text-lg font-semibold">{formatFCFA(breakdown.primeTotale)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Capital assuré principal</p>
                <p className="text-lg font-semibold">{formatFCFA(breakdown.capitalGaranti)}</p>
              </div>
              {data.nombreAscendants > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Capital par ascendant</p>
                  <p className="text-lg font-semibold">{formatFCFA(150000)}</p>
                </div>
              )}
              {data.nombreEnfants > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Capital par enfant</p>
                  <p className="text-lg font-semibold">{formatFCFA(100000)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
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
                <span className="text-muted-foreground">Assuré</span>
                <span className="font-medium">{data.firstName} {data.lastName}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setSubStep(4)} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Modifier
          </Button>
          <Button onClick={onNext} className="gap-2">
            Voir les offres
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Get current step number for display
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
          <Cross className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Pack Obsèques</h2>
          <p className="text-muted-foreground">Simulation - Étape {getCurrentStepNumber()}/{getTotalSteps()}</p>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].filter(s => showFamilyStep || s !== 2).map((step) => (
          <div 
            key={step}
            className={`h-1 flex-1 rounded-full transition-colors ${
              getCurrentStepNumber() >= (showFamilyStep ? step : step - (step > 2 ? 1 : 0)) 
                ? 'bg-primary' 
                : 'bg-muted'
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
