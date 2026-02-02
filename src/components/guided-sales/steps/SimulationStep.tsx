import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Car, 
  Bike, 
  ChevronRight, 
  ChevronLeft,
  Calculator,
  Shield,
  Calendar
} from "lucide-react";
import { GuidedSalesState, QuoteType, EnergyType, GenderType, EmploymentType, ContractPeriodicity } from "../types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatFCFA } from "@/utils/formatCurrency";

interface SimulationStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["needsAnalysis"]>) => void;
  onCalculate: () => void;
  onNext: () => void;
  isCalculating?: boolean;
}

// Only Essence and Gasoil per document
const energyOptions: { value: EnergyType; label: string }[] = [
  { value: "essence", label: "Essence" },
  { value: "gasoil", label: "Gasoil" },
];

const fiscalPowerOptions = [1, 2, 3, 4, 5, 6, 7, 8];
const seatsOptions = [3, 4, 5, 6, 7, 8];

const employmentOptions: { value: EmploymentType; label: string }[] = [
  { value: "fonctionnaire", label: "Fonctionnaire" },
  { value: "salarie", label: "Salarié" },
  { value: "exploitant_agricole", label: "Exploitant agricole" },
  { value: "artisan", label: "Artisan" },
  { value: "religieux", label: "Religieux" },
  { value: "retraite", label: "Retraité" },
  { value: "sans_profession", label: "Sans profession" },
  { value: "agent_commercial", label: "Agent commercial" },
  { value: "autres", label: "Autres" },
];

const periodicityOptions: { id: ContractPeriodicity; name: string }[] = [
  { id: "1_month", name: "1 mois" },
  { id: "3_months", name: "3 mois" },
  { id: "6_months", name: "6 mois" },
  { id: "1_year", name: "12 mois" },
];

const SUB_STEPS = [
  { id: 1, title: "Type & Usage" },
  { id: 2, title: "Profil" },
  { id: 3, title: "Véhicule" },
  { id: 4, title: "Contrat & Valeurs" },
  { id: 5, title: "Équipements" },
];

export const SimulationStep = ({ 
  state, 
  onUpdate, 
  onCalculate,
  onNext,
  isCalculating = false 
}: SimulationStepProps) => {
  const [subStep, setSubStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const { needsAnalysis, simulationCalculated, calculatedPremium } = state;

  const firstCircDate = needsAnalysis.vehicleFirstCirculationDate 
    ? new Date(needsAnalysis.vehicleFirstCirculationDate) 
    : undefined;
  const effectiveDate = needsAnalysis.effectiveDate 
    ? new Date(needsAnalysis.effectiveDate) 
    : undefined;

  // Sub-step validations
  const isSubStep1Valid = () => {
    return (
      needsAnalysis.quoteType &&
      needsAnalysis.isVTC !== undefined &&
      needsAnalysis.belongsToCompany !== undefined &&
      needsAnalysis.isExistingClient !== undefined
    );
  };

  const isSubStep2Valid = () => {
    return (
      needsAnalysis.hasAccident36Months !== undefined &&
      needsAnalysis.gender &&
      needsAnalysis.employmentType
    );
  };

  const isSubStep3Valid = () => {
    return (
      needsAnalysis.vehicleEnergy &&
      needsAnalysis.vehicleFiscalPower &&
      needsAnalysis.vehicleFirstCirculationDate &&
      needsAnalysis.vehicleSeats
    );
  };

  const isSubStep4Valid = () => {
    return (
      needsAnalysis.effectiveDate &&
      needsAnalysis.contractPeriodicity &&
      needsAnalysis.vehicleNewValue &&
      needsAnalysis.vehicleVenalValue
    );
  };

  const isSubStep5Valid = () => {
    return (
      needsAnalysis.hasPanoramicRoof !== undefined &&
      needsAnalysis.hasGPSProtection !== undefined
    );
  };

  const canCalculate = isSubStep1Valid() && isSubStep2Valid() && isSubStep3Valid() && isSubStep4Valid() && isSubStep5Valid();

  const goNext = () => {
    if (subStep < 5) {
      setSubStep((subStep + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const goBack = () => {
    if (subStep > 1) {
      setSubStep((subStep - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  // Progress dots
  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {SUB_STEPS.map((s) => (
        <button
          key={s.id}
          onClick={() => s.id <= subStep && setSubStep(s.id as 1 | 2 | 3 | 4 | 5)}
          disabled={s.id > subStep}
          className={cn(
            "w-3 h-3 rounded-full transition-all",
            s.id === subStep 
              ? "bg-primary scale-110" 
              : s.id < subStep 
                ? "bg-primary/50 cursor-pointer hover:bg-primary/70" 
                : "bg-muted"
          )}
          title={s.title}
        />
      ))}
    </div>
  );

  // Sub-step 1: Type & Usage (fields 1-4)
  const renderSubStep1 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Type & Usage</h1>
        <p className="text-muted-foreground mt-1">Étape 1/5 - Informations générales</p>
      </div>

      {/* 1. Type de devis */}
      <Card>
        <CardContent className="pt-6">
          <Label className="text-sm font-medium mb-3 block">1. Type de devis *</Label>
          <RadioGroup
            value={needsAnalysis.quoteType || "auto"}
            onValueChange={(v) => onUpdate({ quoteType: v as QuoteType })}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="auto" id="quote-auto" className="peer sr-only" />
              <Label
                htmlFor="quote-auto"
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                  "hover:border-primary/50 hover:bg-muted/50",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                )}
              >
                <Car className="h-6 w-6 mb-1 text-primary" />
                <span className="font-semibold text-sm">Devis Auto</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="2_3_roues" id="quote-2-3" className="peer sr-only" />
              <Label
                htmlFor="quote-2-3"
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                  "hover:border-primary/50 hover:bg-muted/50",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                )}
              >
                <Bike className="h-6 w-6 mb-1 text-primary" />
                <span className="font-semibold text-sm">Devis 2 & 3 Roues</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Fields 2-4 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 2. VTC */}
            <div>
              <Label className="text-sm font-medium">2. Le véhicule est-il un VTC ? *</Label>
              <Select
                value={needsAnalysis.isVTC === undefined ? "" : needsAnalysis.isVTC ? "oui" : "non"}
                onValueChange={(v) => onUpdate({ isVTC: v === "oui" })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Entreprise */}
            <div>
              <Label className="text-sm font-medium">3. Appartient à une entreprise ? *</Label>
              <Select
                value={needsAnalysis.belongsToCompany === undefined ? "" : needsAnalysis.belongsToCompany ? "oui" : "non"}
                onValueChange={(v) => onUpdate({ belongsToCompany: v === "oui" })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. Déjà client */}
            <div>
              <Label className="text-sm font-medium">4. Déjà client SanlamAllianz ? *</Label>
              <Select
                value={needsAnalysis.isExistingClient === undefined ? "" : needsAnalysis.isExistingClient ? "oui" : "non"}
                onValueChange={(v) => onUpdate({ isExistingClient: v === "oui" })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={goNext} disabled={!isSubStep1Valid()} className="gap-2">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Sub-step 2: Profil (fields 5-7)
  const renderSubStep2 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil</h1>
        <p className="text-muted-foreground mt-1">Étape 2/5 - Informations sur le conducteur</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* 5. Accident 36 mois */}
          <div>
            <Label className="text-sm font-medium">5. Accident au cours des 36 derniers mois ? *</Label>
            <Select
              value={needsAnalysis.hasAccident36Months === undefined ? "" : needsAnalysis.hasAccident36Months ? "oui" : "non"}
              onValueChange={(v) => onUpdate({ hasAccident36Months: v === "oui" })}
            >
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oui">Oui</SelectItem>
                <SelectItem value="non">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 6. Sexe */}
            <div>
              <Label className="text-sm font-medium">6. Sexe *</Label>
              <Select
                value={needsAnalysis.gender || ""}
                onValueChange={(v) => onUpdate({ gender: v as GenderType })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feminin">Féminin</SelectItem>
                  <SelectItem value="masculin">Masculin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 7. Type d'emploi */}
            <div>
              <Label className="text-sm font-medium">7. Type d'emploi *</Label>
              <Select
                value={needsAnalysis.employmentType || ""}
                onValueChange={(v) => onUpdate({ employmentType: v as EmploymentType })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {employmentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button onClick={goNext} disabled={!isSubStep2Valid()} className="gap-2">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Sub-step 3: Véhicule technique (fields 8-11)
  const renderSubStep3 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Véhicule</h1>
        <p className="text-muted-foreground mt-1">Étape 3/5 - Caractéristiques techniques</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 8. Énergie */}
            <div>
              <Label className="text-sm font-medium">8. Énergie *</Label>
              <Select
                value={needsAnalysis.vehicleEnergy || ""}
                onValueChange={(v) => onUpdate({ vehicleEnergy: v as EnergyType })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {energyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 9. Puissance fiscale */}
            <div>
              <Label className="text-sm font-medium">9. Puissance fiscale (CV) *</Label>
              <Select
                value={needsAnalysis.vehicleFiscalPower?.toString() || ""}
                onValueChange={(v) => onUpdate({ vehicleFiscalPower: parseInt(v) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {fiscalPowerOptions.map((cv) => (
                    <SelectItem key={cv} value={cv.toString()}>
                      {cv} CV
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 10. Date 1ère circulation */}
            <div>
              <Label className="text-sm font-medium">10. Date de 1ère mise en circulation *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !firstCircDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {firstCircDate ? format(firstCircDate, "dd/MM/yyyy", { locale: fr }) : "JJ/MM/AAAA"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={firstCircDate}
                    onSelect={(date) => date && onUpdate({ vehicleFirstCirculationDate: date.toISOString() })}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 11. Nombre de places */}
            <div>
              <Label className="text-sm font-medium">11. Nombre de places *</Label>
              <Select
                value={needsAnalysis.vehicleSeats?.toString() || ""}
                onValueChange={(v) => onUpdate({ vehicleSeats: parseInt(v) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {seatsOptions.map((seats) => (
                    <SelectItem key={seats} value={seats.toString()}>
                      {seats} places
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button onClick={goNext} disabled={!isSubStep3Valid()} className="gap-2">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Sub-step 4: Contrat & Valeurs (fields 12-15)
  const renderSubStep4 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contrat & Valeurs</h1>
        <p className="text-muted-foreground mt-1">Étape 4/5 - Paramètres du contrat</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 12. Date d'effet */}
            <div>
              <Label className="text-sm font-medium">12. Date d'effet *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !effectiveDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {effectiveDate ? format(effectiveDate, "dd/MM/yyyy", { locale: fr }) : "JJ/MM/AAAA"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={effectiveDate}
                    onSelect={(date) => date && onUpdate({ effectiveDate: date.toISOString() })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 13. Durée du contrat */}
            <div>
              <Label className="text-sm font-medium">13. Durée du contrat *</Label>
              <Select
                value={needsAnalysis.contractPeriodicity || ""}
                onValueChange={(v) => onUpdate({ contractPeriodicity: v as ContractPeriodicity })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {periodicityOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 14. Valeur à neuf */}
            <div>
              <Label className="text-sm font-medium">14. Valeur à neuf *</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  placeholder="10 000 000"
                  value={needsAnalysis.vehicleNewValue || ""}
                  onChange={(e) => onUpdate({ vehicleNewValue: parseInt(e.target.value) || 0 })}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  FCFA
                </span>
              </div>
            </div>

            {/* 15. Valeur vénale */}
            <div>
              <Label className="text-sm font-medium">15. Valeur vénale *</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  placeholder="7 000 000"
                  value={needsAnalysis.vehicleVenalValue || ""}
                  onChange={(e) => onUpdate({ vehicleVenalValue: parseInt(e.target.value) || 0 })}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  FCFA
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button onClick={goNext} disabled={!isSubStep4Valid()} className="gap-2">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Sub-step 5: Équipements (fields 16-17) + CALCULER button
  const renderSubStep5 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Équipements</h1>
        <p className="text-muted-foreground mt-1">Étape 5/5 - Options du véhicule</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 16. Toit panoramique */}
            <div>
              <Label className="text-sm font-medium">16. Toit panoramique ? *</Label>
              <Select
                value={needsAnalysis.hasPanoramicRoof === undefined ? "" : needsAnalysis.hasPanoramicRoof ? "oui" : "non"}
                onValueChange={(v) => onUpdate({ hasPanoramicRoof: v === "oui" })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 17. Protection GPS */}
            <div>
              <Label className="text-sm font-medium">17. Protection GPS ? *</Label>
              <Select
                value={needsAnalysis.hasGPSProtection === undefined ? "" : needsAnalysis.hasGPSProtection ? "oui" : "non"}
                onValueChange={(v) => onUpdate({ hasGPSProtection: v === "oui" })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultat simulation si calculé */}
      {simulationCalculated && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-lg">Estimation de prime</h3>
            </div>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-primary">
                {formatFCFA(calculatedPremium.totalAPayer)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Prime estimée
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton Calculer */}
      <div className="flex flex-col items-center gap-4">
        <Button 
          onClick={onCalculate} 
          disabled={!canCalculate || isCalculating}
          size="lg"
          className="gap-2 px-12"
        >
          <Calculator className="h-5 w-5" />
          {isCalculating ? "Calcul en cours..." : simulationCalculated ? "Recalculer" : "CALCULER"}
        </Button>

        {!canCalculate && (
          <p className="text-sm text-center text-muted-foreground">
            Remplissez tous les champs obligatoires pour activer le calcul
          </p>
        )}
      </div>

      {/* Navigation après calcul */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        
        {simulationCalculated && (
          <Button onClick={onNext} className="gap-2">
            Voir les offres
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {renderProgress()}
      {subStep === 1 && renderSubStep1()}
      {subStep === 2 && renderSubStep2()}
      {subStep === 3 && renderSubStep3()}
      {subStep === 4 && renderSubStep4()}
      {subStep === 5 && renderSubStep5()}
    </div>
  );
};
