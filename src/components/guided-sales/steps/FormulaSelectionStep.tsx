import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, X, Star, Save, ChevronRight } from "lucide-react";
import { GuidedSalesState, PlanTier, ContractPeriodicity } from "../types";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface FormulaSelectionStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["coverage"]>) => void;
  onNeedsUpdate: (data: Partial<GuidedSalesState["needsAnalysis"]>) => void;
  onSaveQuote: () => void;
  onSubscribe: () => void;
}

const plans: { tier: PlanTier; name: string; description: string }[] = [
  { tier: "basic", name: "MINI", description: "Couverture essentielle" },
  { tier: "standard", name: "BASIC", description: "Protection équilibrée" },
  { tier: "premium", name: "TOUT RISQUE", description: "Protection maximale" },
];

// Garanties incluses par défaut (non modifiables)
const includedGuarantees = [
  { id: "rc", name: "Responsabilité Civile" },
  { id: "defense", name: "Défense" },
  { id: "recours", name: "Recours" },
  { id: "individuelle", name: "Individuelle Conducteur" },
];

const periodicityOptions: { id: ContractPeriodicity; name: string; months: number }[] = [
  { id: "1_month", name: "1 mois", months: 1 },
  { id: "3_months", name: "3 mois", months: 3 },
  { id: "6_months", name: "6 mois", months: 6 },
  { id: "1_year", name: "12 mois", months: 12 },
];

export const FormulaSelectionStep = ({ 
  state, 
  onUpdate, 
  onNeedsUpdate,
  onSaveQuote,
  onSubscribe 
}: FormulaSelectionStepProps) => {
  const { coverage, needsAnalysis, calculatedPremium } = state;
  const selectedPeriodicity = needsAnalysis.contractPeriodicity || "1_year";
  const effectiveDate = needsAnalysis.effectiveDate ? new Date(needsAnalysis.effectiveDate) : undefined;

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

  const handleSaveQuote = () => {
    onSaveQuote();
    toast.success("Devis sauvegardé avec succès");
  };

  const isValid = () => {
    return coverage.planTier && needsAnalysis.contractPeriodicity && needsAnalysis.effectiveDate;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Choix de la Formule</h1>
        <p className="text-muted-foreground mt-1">
          Personnalisez votre couverture d'assurance
        </p>
      </div>

      {/* Sélection de la formule */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isSelected = coverage.planTier === plan.tier;
          const isRecommended = plan.tier === "standard";
          
          return (
            <Card
              key={plan.tier}
              className={cn(
                "relative cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected && "ring-2 ring-primary border-primary",
                isRecommended && !isSelected && "ring-1 ring-emerald-500 border-emerald-500"
              )}
              onClick={() => handlePlanSelect(plan.tier)}
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
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                {isSelected && (
                  <div className="mt-4">
                    <Check className="h-6 w-6 text-primary mx-auto" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Garanties incluses */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Garanties incluses</h3>
          <div className="grid grid-cols-2 gap-3">
            {includedGuarantees.map((guarantee) => (
              <div key={guarantee.id} className="flex items-center gap-2">
                <Checkbox 
                  id={guarantee.id} 
                  checked 
                  disabled 
                  className="data-[state=checked]:bg-primary"
                />
                <Label 
                  htmlFor={guarantee.id} 
                  className="text-sm text-muted-foreground cursor-not-allowed"
                >
                  {guarantee.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

      {/* Résumé prix */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Prime totale estimée</p>
              <p className="text-3xl font-bold text-primary">
                {formatFCFA(calculatedPremium.totalAPayer)}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                {plans.find(p => p.tier === coverage.planTier)?.name || "BASIC"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {periodicityOptions.find(p => p.id === selectedPeriodicity)?.name || "12 mois"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={handleSaveQuote}
          className="gap-2 flex-1"
        >
          <Save className="h-4 w-4" />
          Sauvegarder le devis
        </Button>
        <Button 
          onClick={onSubscribe}
          disabled={!isValid()}
          className="gap-2 flex-1"
        >
          SOUSCRIRE
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
