import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, X, Star } from "lucide-react";
import { GuidedSalesState, PlanTier } from "../types";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";

interface CoverageStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["coverage"]>) => void;
  onPremiumUpdate: (premium: GuidedSalesState["calculatedPremium"]) => void;
  onNext: () => void;
}

const plans: { tier: PlanTier; name: string; price: number; coverages: { name: string; included: boolean }[] }[] = [
  {
    tier: "basic",
    name: "Basic",
    price: 236000,
    coverages: [
      { name: "Responsabilité Civile", included: true },
      { name: "Défense Pénale", included: true },
      { name: "Vol & Incendie", included: false },
      { name: "Dommages Tous Accidents", included: false },
      { name: "Véhicule de Remplacement", included: false },
    ],
  },
  {
    tier: "standard",
    name: "Standard",
    price: 295000,
    coverages: [
      { name: "Responsabilité Civile", included: true },
      { name: "Défense Pénale", included: true },
      { name: "Vol & Incendie", included: true },
      { name: "Dommages Tous Accidents", included: false },
      { name: "Véhicule de Remplacement", included: false },
    ],
  },
  {
    tier: "premium",
    name: "Premium",
    price: 413000,
    coverages: [
      { name: "Responsabilité Civile", included: true },
      { name: "Défense Pénale", included: true },
      { name: "Vol & Incendie", included: true },
      { name: "Dommages Tous Accidents", included: true },
      { name: "Véhicule de Remplacement", included: true },
    ],
  },
];

const assistanceOptions = [
  { id: "avantage", name: "Avantage", description: "Assistance de base", price: 0 },
  { id: "confort", name: "Confort", description: "Assistance étendue + dépannage", price: 43510 },
  { id: "relax", name: "Relax", description: "Assistance premium + véhicule relais", price: 62975 },
  { id: "liberte", name: "Liberté", description: "Assistance tout inclus 0km", price: 91600 },
];

const additionalOptions = [
  { id: "bris_glace", name: "Bris de Glace Sans Franchise", description: "Pare-brise, vitres latérales et optiques", price: 29500 },
];

// Determine recommended plan based on vehicle age
const getRecommendedPlan = (vehicleDate?: string): PlanTier => {
  if (!vehicleDate) return "standard";
  
  const vehicleYear = new Date(vehicleDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicleYear;
  
  if (vehicleAge <= 3) return "premium"; // New vehicles: full coverage
  if (vehicleAge <= 7) return "standard"; // Medium age: balanced
  return "basic"; // Older vehicles: basic coverage
};

export const CoverageStep = ({ state, onUpdate, onPremiumUpdate, onNext }: CoverageStepProps) => {
  const { coverage } = state;
  const selectedPlan = plans.find(p => p.tier === coverage.planTier) || plans[1];
  
  // Get recommended plan based on vehicle first circulation date
  const recommendedPlan = getRecommendedPlan(state.needsAnalysis.vehicleFirstCirculationDate);

  const calculateTotal = (planPrice: number, options: string[], assistanceId?: string) => {
    const optionsTotal = options.reduce((sum, optId) => {
      const opt = additionalOptions.find(o => o.id === optId);
      return sum + (opt?.price || 0);
    }, 0);
    const assistancePrice = assistanceOptions.find(a => a.id === assistanceId)?.price || 0;
    return planPrice + optionsTotal + assistancePrice;
  };

  const handlePlanSelect = (tier: PlanTier) => {
    onUpdate({ planTier: tier });
  };

  const handleOptionToggle = (optionId: string, checked: boolean) => {
    const newOptions = checked
      ? [...coverage.additionalOptions, optionId]
      : coverage.additionalOptions.filter(id => id !== optionId);
    onUpdate({ additionalOptions: newOptions });
  };

  const handleAssistanceChange = (assistanceId: string) => {
    onUpdate({ assistanceLevel: assistanceId });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Niveaux de Couverture</h1>
        <p className="text-muted-foreground mt-1">
          Choisissez le pack adapté aux besoins de protection.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isRecommended = plan.tier === recommendedPlan;
          const isSelected = coverage.planTier === plan.tier;
          
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
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Recommandée
                  </Badge>
                </div>
              )}
              
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center z-10">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              
              <CardContent className={cn("pt-6 space-y-4", isRecommended && "pt-8")}>
                <h3 className={cn(
                  "text-lg font-semibold",
                  isSelected && "text-primary",
                  isRecommended && !isSelected && "text-emerald-600"
                )}>
                  {plan.name}
                </h3>
                
                <div className="space-y-2">
                  {plan.coverages.map((cov) => (
                    <div key={cov.name} className="flex items-center gap-2 text-sm">
                      {cov.included ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={cn(!cov.included && "text-muted-foreground/60")}>
                        {cov.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <span className="text-xl font-bold">{formatFCFA(plan.price)}</span>
                  <span className="text-muted-foreground text-sm">/an</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assistance Auto Block */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Assistance Auto</h3>
          <RadioGroup
            value={coverage.assistanceLevel || ""}
            onValueChange={handleAssistanceChange}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {assistanceOptions.map((option) => (
              <div key={option.id}>
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.id}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 cursor-pointer transition-all",
                    "hover:bg-accent hover:text-accent-foreground",
                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  )}
                >
                  <span className="font-medium">{option.name}</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">{option.description}</span>
                  <span className="text-sm font-semibold text-primary mt-2">
                    {option.price === 0 ? "Gratuit" : `+${formatFCFA(option.price)}`}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Additional Options */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Options Additionnelles</h3>
          <div className="space-y-4">
            {additionalOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-start justify-between py-3 border-b last:border-0"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={option.id}
                    checked={coverage.additionalOptions.includes(option.id)}
                    onCheckedChange={(checked) => handleOptionToggle(option.id, checked as boolean)}
                  />
                  <div>
                    <Label htmlFor={option.id} className="font-medium cursor-pointer">
                      {option.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <span className="text-primary font-medium">+{formatFCFA(option.price)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} size="lg">
          Passer à la vérification
        </Button>
      </div>
    </div>
  );
};
