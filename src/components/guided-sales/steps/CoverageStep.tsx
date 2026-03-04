import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, X, Star, Calendar } from "lucide-react";
import { GuidedSalesState, PlanTier, ContractPeriodicity, SelectedProductType } from "../types";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import { Label } from "@/components/ui/label";
import { MobileCoverageStickyBar } from "../MobileCoverageStickyBar";

interface CoverageStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["coverage"]>) => void;
  onNeedsUpdate: (data: Partial<GuidedSalesState["needsAnalysis"]>) => void;
  onPremiumUpdate: (premium: GuidedSalesState["calculatedPremium"]) => void;
  onNext: () => void;
}

// 7 packs Auto selon le tarificateur CSV
const AUTO_PLANS: { tier: PlanTier; name: string; description: string; assistance: string; assistancePrice: number; coverages: { name: string; included: boolean }[] }[] = [
  {
    tier: "mini", name: "MINI", description: "Couverture essentielle", assistance: "Avantage", assistancePrice: 0,
    coverages: [
      { name: "Responsabilité Civile", included: true },
      { name: "Recours Tiers Incendie", included: true },
      { name: "Défense Recours", included: true },
      { name: "IC / IPT", included: true },
      { name: "Avance sur recours", included: false },
      { name: "Incendie", included: false },
      { name: "Vol", included: false },
      { name: "Tierce", included: false },
    ],
  },
  {
    tier: "basic", name: "BASIC", description: "RC + Avance recours", assistance: "Avantage", assistancePrice: 0,
    coverages: [
      { name: "Responsabilité Civile", included: true },
      { name: "Recours Tiers Incendie", included: true },
      { name: "Défense Recours", included: true },
      { name: "IC / IPT", included: true },
      { name: "Avance sur recours", included: true },
      { name: "Incendie", included: false },
      { name: "Vol", included: false },
      { name: "Tierce", included: false },
    ],
  },
  {
    tier: "medium", name: "MEDIUM", description: "Incendie + Bris de glaces", assistance: "Confort", assistancePrice: 38000,
    coverages: [
      { name: "Responsabilité Civile", included: true },
      { name: "Recours Tiers Incendie", included: true },
      { name: "Défense Recours", included: true },
      { name: "IC / IPT", included: true },
      { name: "Avance sur recours", included: true },
      { name: "Incendie", included: true },
      { name: "Vol accessoires", included: true },
      { name: "Bris de glaces", included: true },
      { name: "Vol", included: false },
      { name: "Tierce", included: false },
    ],
  },
  {
    tier: "medium_plus", name: "MEDIUM+", description: "Vol + Vol à main armée", assistance: "Confort", assistancePrice: 38000,
    coverages: [
      { name: "Responsabilité Civile", included: true },
      { name: "Recours Tiers Incendie", included: true },
      { name: "Défense Recours", included: true },
      { name: "IC / IPT", included: true },
      { name: "Avance sur recours", included: true },
      { name: "Incendie", included: true },
      { name: "Vol", included: true },
      { name: "Vol à main armée", included: true },
      { name: "Vol accessoires", included: true },
      { name: "Bris de glaces", included: true },
      { name: "Tierce", included: false },
    ],
  },
  {
    tier: "evolution", name: "EVOLUTION", description: "Tierce complète plafonnée", assistance: "Relax", assistancePrice: 55000,
    coverages: [
      { name: "Responsabilité Civile", included: true },
      { name: "Recours Tiers Incendie", included: true },
      { name: "Défense Recours", included: true },
      { name: "IC / IPT", included: true },
      { name: "Avance sur recours", included: true },
      { name: "Incendie", included: true },
      { name: "Vol", included: true },
      { name: "Vol accessoires", included: true },
      { name: "Bris de glaces", included: true },
      { name: "Tierce complète plafonnée", included: true },
    ],
  },
  {
    tier: "evolution_plus", name: "EVOLUTION+", description: "Tierce collision plafonnée", assistance: "Relax", assistancePrice: 55000,
    coverages: [
      { name: "Responsabilité Civile", included: true },
      { name: "Recours Tiers Incendie", included: true },
      { name: "Défense Recours", included: true },
      { name: "IC / IPT", included: true },
      { name: "Avance sur recours", included: true },
      { name: "Incendie", included: true },
      { name: "Vol", included: true },
      { name: "Vol accessoires", included: true },
      { name: "Bris de glaces", included: true },
      { name: "Tierce collision plafonnée", included: true },
    ],
  },
  {
    tier: "supreme", name: "SUPRÊME", description: "Protection maximale", assistance: "Relax", assistancePrice: 55000,
    coverages: [
      { name: "Responsabilité Civile", included: true },
      { name: "Recours Tiers Incendie", included: true },
      { name: "Défense Recours", included: true },
      { name: "IC / IPT", included: true },
      { name: "Avance sur recours (gratuit)", included: true },
      { name: "Incendie", included: true },
      { name: "Vol", included: true },
      { name: "Vol accessoires", included: true },
      { name: "Bris de glaces (gratuit)", included: true },
      { name: "Tierce complète (non plafonnée)", included: true },
    ],
  },
];

const OBSEQUES_PLANS: { tier: PlanTier; name: string; description: string; price: number; coverages: { name: string; included: boolean }[] }[] = [
  {
    tier: "mini", name: "Essentiel", description: "Couverture individuelle", price: 15000,
    coverages: [
      { name: "Capital obsèques assuré", included: true },
      { name: "Rapatriement du corps", included: true },
      { name: "Conjoint couvert", included: false },
      { name: "Enfants couverts", included: false },
      { name: "Ascendants couverts", included: false },
    ],
  },
  {
    tier: "basic", name: "Famille", description: "Couverture familiale", price: 25000,
    coverages: [
      { name: "Capital obsèques assuré", included: true },
      { name: "Rapatriement du corps", included: true },
      { name: "Conjoint couvert", included: true },
      { name: "Enfants couverts", included: true },
      { name: "Ascendants couverts", included: false },
    ],
  },
  {
    tier: "medium", name: "Élargi", description: "Couverture étendue", price: 40000,
    coverages: [
      { name: "Capital obsèques assuré", included: true },
      { name: "Rapatriement du corps", included: true },
      { name: "Conjoint couvert", included: true },
      { name: "Enfants couverts", included: true },
      { name: "Ascendants couverts", included: true },
    ],
  },
];

const periodicityOptions: { id: ContractPeriodicity; name: string; months: number; discount: number }[] = [
  { id: "1_month", name: "1 mois", months: 1, discount: 0 },
  { id: "3_months", name: "3 mois", months: 3, discount: 0 },
  { id: "6_months", name: "6 mois", months: 6, discount: 0.05 },
  { id: "1_year", name: "12 mois", months: 12, discount: 0.10 },
];

const getRecommendedPlan = (productType: SelectedProductType, state: GuidedSalesState): PlanTier => {
  if (productType === "auto") {
    const vehicleDate = state.needsAnalysis.vehicleFirstCirculationDate;
    if (!vehicleDate) return "medium_plus";
    const vehicleAge = new Date().getFullYear() - new Date(vehicleDate).getFullYear();
    if (vehicleAge <= 3) return "evolution";
    if (vehicleAge <= 7) return "medium_plus";
    return "basic";
  }
  return "mini";
};

export const CoverageStep = ({ state, onUpdate, onNeedsUpdate, onPremiumUpdate, onNext }: CoverageStepProps) => {
  const { coverage, needsAnalysis } = state;
  const productType = state.productSelection.selectedProduct || "auto";
  const isAuto = productType === "auto";

  const plans = isAuto ? AUTO_PLANS : OBSEQUES_PLANS;
  const selectedPeriodicity = needsAnalysis.contractPeriodicity || "1_year";
  const recommendedPlan = getRecommendedPlan(productType, state);

  const handlePlanSelect = (tier: PlanTier) => {
    // For auto, set assistance level based on pack
    if (isAuto) {
      const autoPlan = AUTO_PLANS.find(p => p.tier === tier);
      if (autoPlan) {
        onUpdate({ planTier: tier, assistanceLevel: autoPlan.assistance.toLowerCase() });
        return;
      }
    }
    onUpdate({ planTier: tier });
  };

  const handlePeriodicityChange = (periodicity: ContractPeriodicity) => {
    onNeedsUpdate({ contractPeriodicity: periodicity });
  };

  const getPeriodicityLabel = (periodicity: ContractPeriodicity) => {
    const option = periodicityOptions.find(p => p.id === periodicity);
    if (!option) return "/an";
    if (option.months === 1) return "/mois";
    if (option.months === 3) return "/trim.";
    if (option.months === 6) return "/sem.";
    return "/an";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isAuto ? "Packs Auto" : "Niveaux de Couverture Pack Obsèques"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAuto ? "7 formules selon le tarificateur — l'assistance est incluse dans chaque pack." : "Choisissez le pack adapté aux besoins de protection."}
        </p>
      </div>

      {/* Periodicity */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Durée du contrat</h3>
          </div>
          <RadioGroup
            value={selectedPeriodicity}
            onValueChange={(v) => handlePeriodicityChange(v as ContractPeriodicity)}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {periodicityOptions.map((option) => (
              <div key={option.id}>
                <RadioGroupItem value={option.id} id={`periodicity-${option.id}`} className="peer sr-only" />
                <Label
                  htmlFor={`periodicity-${option.id}`}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 cursor-pointer transition-all",
                    "hover:bg-accent hover:text-accent-foreground",
                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  )}
                >
                  <span className="font-semibold text-lg">{option.name}</span>
                  {option.discount > 0 && (
                    <Badge variant="secondary" className="mt-2 text-xs bg-emerald-100 text-emerald-700">
                      -{option.discount * 100}% réduction
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div className={cn(
        "grid grid-cols-1 gap-4",
        isAuto ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "sm:grid-cols-3"
      )}>
        {plans.map((plan) => {
          const isRecommended = plan.tier === recommendedPlan;
          const isSelected = coverage.planTier === plan.tier;
          const autoPlan = isAuto ? AUTO_PLANS.find(p => p.tier === plan.tier) : null;

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
                    <Star className="h-3 w-3 fill-current" />
                    Recommandée
                  </Badge>
                </div>
              )}
              {isSelected && (
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center z-10">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <CardContent className={cn("pt-6 space-y-3", isRecommended && "pt-8")}>
                <div>
                  <h3 className={cn("text-lg font-semibold", isSelected && "text-primary", isRecommended && !isSelected && "text-emerald-600")}>
                    {plan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>

                <div className="space-y-1.5">
                  {plan.coverages.map((cov) => (
                    <div key={cov.name} className="flex items-center gap-1.5 text-xs">
                      {cov.included ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={cn(!cov.included && "text-muted-foreground/50")}>{cov.name}</span>
                    </div>
                  ))}
                </div>

                {autoPlan && (
                  <div className="pt-2 border-t">
                    <Badge variant="outline" className="text-xs">
                      Assistance {autoPlan.assistance}
                      {autoPlan.assistancePrice > 0 && ` (${formatFCFA(autoPlan.assistancePrice)})`}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Next Button */}
      <div className="hidden sm:flex justify-end pt-4 pb-4">
        <Button onClick={onNext} size="lg">
          Passer à la vérification
        </Button>
      </div>

      <MobileCoverageStickyBar
        state={state}
        onNext={onNext}
        nextLabel="Passer à la vérification"
        onPlanChange={handlePlanSelect}
      />
    </div>
  );
};
