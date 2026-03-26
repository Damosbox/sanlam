import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Check, Star, ChevronRight, AlertTriangle, Info } from "lucide-react";
import { GuidedSalesState, PlanTier, ContractPeriodicity } from "../types";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface FormulaSelectionStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["coverage"]>) => void;
  onNeedsUpdate: (data: Partial<GuidedSalesState["needsAnalysis"]>) => void;
  onNext: () => void;
}

// ── Définition des formules selon le barème Excel ──────────────────────
interface FormulaDefinition {
  tier: PlanTier;
  name: string;
  description: string;
  guarantees: string[];
  maxVehicleAge: number | null; // null = indéterminée
  minPeriodMonths: number;
  maxPeriodMonths: number;
  availableAssistances: string[];
  assistanceRules?: (vehicleAge: number) => string[];
}

const FORMULA_DEFINITIONS: FormulaDefinition[] = [
  {
    tier: "mini",
    name: "TIERS SIMPLE",
    description: "RC + Défense/Recours + Individuel Conducteur",
    guarantees: ["RC", "Défense/Recours", "Recours des tiers incendie", "Individuel conducteur", "Assistance Avantage"],
    maxVehicleAge: null,
    minPeriodMonths: 1,
    maxPeriodMonths: 12,
    availableAssistances: ["avantage", "confort", "relax", "liberte"],
  },
  {
    tier: "basic",
    name: "TIERS SIMPLE AMÉLIORÉ",
    description: "Tiers Simple + Avance sur Recours",
    guarantees: ["RC", "Défense/Recours", "Recours des tiers incendie", "Individuel conducteur", "Avance sur recours", "Assistance Avantage"],
    maxVehicleAge: null,
    minPeriodMonths: 3,
    maxPeriodMonths: 12,
    availableAssistances: ["avantage", "confort", "relax", "liberte"],
  },
  {
    tier: "medium",
    name: "TIERS COMPLET - TIERS AMÉLIORÉ",
    description: "Tiers Simple Amélioré + Incendie + Vol",
    guarantees: [
      "RC", "Défense/Recours", "Recours des tiers incendie", "Individuel conducteur",
      "Avance sur recours", "Incendie", "Vol", "Vol à mains armées",
      "Vol des accessoires",
    ],
    maxVehicleAge: null,
    minPeriodMonths: 3,
    maxPeriodMonths: 12,
    availableAssistances: ["avantage", "confort", "relax", "liberte"],
  },
  {
    tier: "medium_plus",
    name: "TIERS RISQUES",
    description: "Tierce complète + Incendie + Vol + Bris de glaces",
    guarantees: [
      "RC", "Défense/Recours", "Recours des tiers incendie", "Individuel conducteur",
      "Avance sur recours", "Incendie", "Vol", "Vol à mains armées",
      "Vol des accessoires", "Bris de glaces", "Tierce complète",
    ],
    maxVehicleAge: 5,
    minPeriodMonths: 6,
    maxPeriodMonths: 12,
    availableAssistances: ["avantage", "confort", "relax", "liberte"],
    assistanceRules: (vehicleAge: number) => {
      if (vehicleAge <= 3) return ["avantage", "confort", "relax", "liberte"];
      return ["avantage", "confort"];
    },
  },
  {
    tier: "evolution_plus",
    name: "TIERCE COLLISION",
    description: "Tiers Amélioré + Tierce Collision",
    guarantees: [
      "RC", "Défense/Recours", "Recours des tiers incendie", "Individuel conducteur",
      "Avance sur recours", "Incendie", "Vol", "Vol à mains armées",
      "Vol des accessoires", "Bris de glaces", "Tierce collision",
    ],
    maxVehicleAge: 7,
    minPeriodMonths: 6,
    maxPeriodMonths: 12,
    availableAssistances: ["avantage", "relax", "liberte"],
  },
];

const periodicityOptions: { id: ContractPeriodicity; name: string; months: number }[] = [
  { id: "1_month", name: "1 mois", months: 1 },
  { id: "3_months", name: "3 mois", months: 3 },
  { id: "6_months", name: "6 mois", months: 6 },
  { id: "1_year", name: "12 mois", months: 12 },
];

const PERIODICITY_MONTHS: Record<ContractPeriodicity, number> = {
  "1_month": 1,
  "3_months": 3,
  "6_months": 6,
  "1_year": 12,
};

// Calcul de l'âge du véhicule à partir de la date de 1ère circulation
const getVehicleAge = (firstCirculationDate?: string): number | null => {
  if (!firstCirculationDate) return null;
  const date = new Date(firstCirculationDate);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  const diff = now.getFullYear() - date.getFullYear();
  return diff;
};

export const FormulaSelectionStep = ({
  state,
  onUpdate,
  onNeedsUpdate,
  onNext,
}: FormulaSelectionStepProps) => {
  const { coverage, needsAnalysis } = state;
  const selectedPeriodicity = needsAnalysis.contractPeriodicity || "1_year";
  const effectiveDate = needsAnalysis.effectiveDate ? new Date(needsAnalysis.effectiveDate) : undefined;
  const vehicleAge = getVehicleAge(needsAnalysis.vehicleFirstCirculationDate);
  const hasPanoramicRoof = needsAnalysis.hasPanoramicRoof || false;
  const periodMonths = PERIODICITY_MONTHS[selectedPeriodicity];

  // ── Filtrage des formules disponibles ──
  const availableFormulas = useMemo(() => {
    return FORMULA_DEFINITIONS.filter((formula) => {
      // Vérifier la période minimum
      if (periodMonths < formula.minPeriodMonths) return false;
      if (periodMonths > formula.maxPeriodMonths) return false;

      // Vérifier l'âge du véhicule
      if (formula.maxVehicleAge !== null && vehicleAge !== null) {
        if (vehicleAge > formula.maxVehicleAge) return false;
      }

      // Règle Excel : Si 1 mois → seulement TIERS SIMPLE
      if (periodMonths === 1 && formula.tier !== "mini") return false;

      // Règle Excel TIERS COMPLET : Si 3 mois → seulement Medium+
      if (periodMonths === 3 && formula.tier === "medium_plus") return true;

      return true;
    });
  }, [periodMonths, vehicleAge]);

  // Assistances disponibles pour la formule sélectionnée
  const selectedFormulaDef = FORMULA_DEFINITIONS.find((f) => f.tier === coverage.planTier);
  const availableAssistances = useMemo(() => {
    if (!selectedFormulaDef) return ["avantage"];
    if (selectedFormulaDef.assistanceRules && vehicleAge !== null) {
      return selectedFormulaDef.assistanceRules(vehicleAge);
    }
    return selectedFormulaDef.availableAssistances;
  }, [selectedFormulaDef, vehicleAge]);

  // Garanties affichées (swap bris de glaces si toit panoramique)
  const displayedGuarantees = useMemo(() => {
    if (!selectedFormulaDef) return [];
    let guarantees = [...selectedFormulaDef.guarantees];
    if (hasPanoramicRoof) {
      guarantees = guarantees.map((g) =>
        g === "Bris de glaces" ? "Extension bris de glaces" : g
      );
    }
    return guarantees;
  }, [selectedFormulaDef, hasPanoramicRoof]);

  // Auto-select first available formula if current is not available
  const isCurrentPlanAvailable = availableFormulas.some((f) => f.tier === coverage.planTier);

  const handlePlanSelect = (tier: PlanTier) => {
    onUpdate({ planTier: tier });
  };

  const handlePeriodicityChange = (periodicity: ContractPeriodicity) => {
    onNeedsUpdate({ contractPeriodicity: periodicity });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onNeedsUpdate({ effectiveDate: date.toISOString() });
    }
  };

  const isValid = () => {
    return coverage.planTier && isCurrentPlanAvailable && needsAnalysis.contractPeriodicity && needsAnalysis.effectiveDate;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Choix de la Formule</h1>
        <p className="text-muted-foreground mt-1">
          Personnalisez votre couverture d'assurance
        </p>
      </div>

      {/* Info contextuelle */}
      {vehicleAge !== null && (
        <Alert className="bg-muted/50 border-muted">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Véhicule de <strong>{vehicleAge} an{vehicleAge > 1 ? "s" : ""}</strong> —
            Durée sélectionnée : <strong>{periodicityOptions.find((p) => p.id === selectedPeriodicity)?.name}</strong>
            {availableFormulas.length < FORMULA_DEFINITIONS.length && (
              <span className="text-muted-foreground">
                {" "}· Certaines formules ne sont pas disponibles pour ce profil.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Durée du contrat */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Durée du contrat *</h3>
          </div>
          <RadioGroup
            value={selectedPeriodicity}
            onValueChange={(v) => handlePeriodicityChange(v as ContractPeriodicity)}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {periodicityOptions.map((option) => (
              <div key={option.id}>
                <RadioGroupItem
                  value={option.id}
                  id={`periodicity-${option.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`periodicity-${option.id}`}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 cursor-pointer transition-all",
                    "hover:bg-accent hover:text-accent-foreground",
                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  )}
                >
                  <span className="font-semibold text-lg">{option.name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Sélection de la formule */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Formules disponibles</h3>
        {availableFormulas.length === 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Aucune formule n'est disponible pour cette combinaison (âge véhicule / durée de contrat).
              Veuillez modifier la durée du contrat.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {availableFormulas.map((formula) => {
              const isSelected = coverage.planTier === formula.tier;
              const isRecommended = formula.tier === "medium_plus";

              return (
                <Card
                  key={formula.tier}
                  className={cn(
                    "relative cursor-pointer transition-all duration-200 hover:shadow-md",
                    isSelected && "ring-2 ring-primary border-primary",
                    isRecommended && !isSelected && "ring-1 ring-emerald-500 border-emerald-500"
                  )}
                  onClick={() => handlePlanSelect(formula.tier)}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
                        <Star className="h-3 w-3" />
                        Recommandé
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-8 pb-6 text-center">
                    <h3 className="text-lg font-bold">{formula.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{formula.description}</p>
                    {formula.maxVehicleAge !== null && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Véhicule ≤ {formula.maxVehicleAge} ans
                      </p>
                    )}
                    {isSelected && (
                      <div className="mt-3">
                        <Check className="h-6 w-6 text-primary mx-auto" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Garanties incluses dans la formule sélectionnée */}
      {selectedFormulaDef && isCurrentPlanAvailable && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">
              Garanties incluses — {selectedFormulaDef.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayedGuarantees.map((guarantee, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Checkbox
                    id={`g-${idx}`}
                    checked
                    disabled
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label
                    htmlFor={`g-${idx}`}
                    className="text-sm text-muted-foreground cursor-not-allowed"
                  >
                    {guarantee}
                    {guarantee === "Extension bris de glaces" && (
                      <span className="text-xs ml-1 text-amber-600">(toit panoramique)</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avertissement si formule sélectionnée non dispo */}
      {!isCurrentPlanAvailable && coverage.planTier && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            La formule précédemment sélectionnée n'est plus disponible. Veuillez en choisir une autre.
          </AlertDescription>
        </Alert>
      )}

      {/* Date d'effet */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Date d'effet *</h3>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full max-w-xs justify-start text-left font-normal",
                  !effectiveDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {effectiveDate ? format(effectiveDate, "PPP", { locale: fr }) : "Choisir une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={effectiveDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Bouton Suivant */}
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!isValid()}
          className="gap-2"
          size="lg"
        >
          Voir le récapitulatif
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
