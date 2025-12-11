import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { GuidedSalesState, PlanTier } from "../types";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";

interface CoverageStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["coverage"]>) => void;
  onPremiumUpdate: (premium: GuidedSalesState["calculatedPremium"]) => void;
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

const additionalOptions = [
  { id: "bris_glace", name: "Bris de Glace Sans Franchise", description: "Pare-brise, vitres latérales et optiques", price: 29500 },
  { id: "assistance", name: "Assistance 0km + Véhicule Relais", description: "Dépannage même en bas de chez vous", price: 21000 },
];

export const CoverageStep = ({ state, onUpdate, onPremiumUpdate }: CoverageStepProps) => {
  const { coverage } = state;
  const selectedPlan = plans.find(p => p.tier === coverage.planTier) || plans[1];

  const handlePlanSelect = (tier: PlanTier) => {
    const plan = plans.find(p => p.tier === tier);
    if (plan) {
      onUpdate({ planTier: tier });
      const optionsTotal = coverage.additionalOptions.reduce((sum, optId) => {
        const opt = additionalOptions.find(o => o.id === optId);
        return sum + (opt?.price || 0);
      }, 0);
      const total = plan.price + optionsTotal;
      onPremiumUpdate({
        netPremium: total * 0.67,
        taxes: total * 0.33,
        fees: 0,
        total,
      });
    }
  };

  const handleOptionToggle = (optionId: string, checked: boolean) => {
    const newOptions = checked
      ? [...coverage.additionalOptions, optionId]
      : coverage.additionalOptions.filter(id => id !== optionId);
    onUpdate({ additionalOptions: newOptions });

    const optionsTotal = newOptions.reduce((sum, optId) => {
      const opt = additionalOptions.find(o => o.id === optId);
      return sum + (opt?.price || 0);
    }, 0);
    const total = selectedPlan.price + optionsTotal;
    onPremiumUpdate({
      netPremium: total * 0.67,
      taxes: total * 0.33,
      fees: 0,
      total,
    });
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
        {plans.map((plan) => (
          <Card
            key={plan.tier}
            className={cn(
              "relative cursor-pointer transition-all duration-200 hover:shadow-md",
              coverage.planTier === plan.tier && "ring-2 ring-primary border-primary"
            )}
            onClick={() => handlePlanSelect(plan.tier)}
          >
            {coverage.planTier === plan.tier && (
              <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <CardContent className="pt-6 space-y-4">
              <h3 className={cn(
                "text-lg font-semibold",
                coverage.planTier === plan.tier && "text-primary"
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
        ))}
      </div>

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
    </div>
  );
};
