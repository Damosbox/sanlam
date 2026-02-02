import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, X, Star, Calendar } from "lucide-react";
import { GuidedSalesState, PlanTier, ContractPeriodicity, SelectedProductType } from "../types";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import { MobileCoverageStickyBar } from "../MobileCoverageStickyBar";

interface CoverageStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["coverage"]>) => void;
  onNeedsUpdate: (data: Partial<GuidedSalesState["needsAnalysis"]>) => void;
  onPremiumUpdate: (premium: GuidedSalesState["calculatedPremium"]) => void;
  onNext: () => void;
}

// Garanties incluses par défaut pour Auto (non modifiables)
const AUTO_INCLUDED_GUARANTEES = [
  { id: "rc", name: "Responsabilité Civile", included: true },
  { id: "defense_recours", name: "Défense/Recours", included: true },
  { id: "recours_tiers_incendie", name: "Recours des Tiers Incendie", included: true },
  { id: "individuel_conducteur", name: "Individuel Conducteur", included: true },
];

// Configuration des plans par type de produit
const productPlansConfig: Record<SelectedProductType, {
  plans: { tier: PlanTier; name: string; price: number; coverages: { name: string; included: boolean }[] }[];
  assistanceOptions?: { id: string; name: string; description: string; price: number }[];
  additionalOptions: { id: string; name: string; description: string; price: number }[];
}> = {
  auto: {
    plans: [
      {
        tier: "basic",
        name: "MINI",
        price: 236000,
        coverages: [
          { name: "Responsabilité Civile", included: true },
          { name: "Défense/Recours", included: true },
          { name: "Recours des Tiers Incendie", included: true },
          { name: "Individuel Conducteur", included: true },
          { name: "Vol & Incendie", included: false },
          { name: "Dommages Tous Accidents", included: false },
        ],
      },
      {
        tier: "standard",
        name: "BASIC",
        price: 295000,
        coverages: [
          { name: "Responsabilité Civile", included: true },
          { name: "Défense/Recours", included: true },
          { name: "Recours des Tiers Incendie", included: true },
          { name: "Individuel Conducteur", included: true },
          { name: "Vol & Incendie", included: true },
          { name: "Dommages Tous Accidents", included: false },
        ],
      },
      {
        tier: "premium",
        name: "MEDIUM+",
        price: 413000,
        coverages: [
          { name: "Responsabilité Civile", included: true },
          { name: "Défense/Recours", included: true },
          { name: "Recours des Tiers Incendie", included: true },
          { name: "Individuel Conducteur", included: true },
          { name: "Vol & Incendie", included: true },
          { name: "Dommages Tous Accidents", included: true },
        ],
      },
    ],
    // Assistance limitée à Avantage uniquement
    assistanceOptions: [
      { id: "avantage", name: "Avantage", description: "Assistance de base incluse", price: 0 },
    ],
    additionalOptions: [],
  },
  molo_molo: {
    plans: [
      {
        tier: "basic",
        name: "Essentiel",
        price: 10000,
        coverages: [
          { name: "Épargne garantie", included: true },
          { name: "Capital décès", included: true },
          { name: "Participation aux bénéfices", included: false },
          { name: "Garantie invalidité", included: false },
          { name: "Avance sur contrat", included: false },
        ],
      },
      {
        tier: "standard",
        name: "Confort",
        price: 25000,
        coverages: [
          { name: "Épargne garantie", included: true },
          { name: "Capital décès", included: true },
          { name: "Participation aux bénéfices", included: true },
          { name: "Garantie invalidité", included: true },
          { name: "Avance sur contrat", included: false },
        ],
      },
      {
        tier: "premium",
        name: "Premium",
        price: 50000,
        coverages: [
          { name: "Épargne garantie", included: true },
          { name: "Capital décès", included: true },
          { name: "Participation aux bénéfices", included: true },
          { name: "Garantie invalidité", included: true },
          { name: "Avance sur contrat", included: true },
        ],
      },
    ],
    additionalOptions: [
      { id: "exoneration_primes", name: "Exonération des Primes", description: "En cas d'invalidité", price: 5000 },
      { id: "double_capital", name: "Double Capital Accident", description: "En cas de décès accidentel", price: 8000 },
    ],
  },
  pack_obseques: {
    plans: [
      {
        tier: "basic",
        name: "Essentiel",
        price: 15000,
        coverages: [
          { name: "Capital obsèques assuré", included: true },
          { name: "Rapatriement du corps", included: true },
          { name: "Conjoint couvert", included: false },
          { name: "Enfants couverts", included: false },
          { name: "Ascendants couverts", included: false },
        ],
      },
      {
        tier: "standard",
        name: "Famille",
        price: 25000,
        coverages: [
          { name: "Capital obsèques assuré", included: true },
          { name: "Rapatriement du corps", included: true },
          { name: "Conjoint couvert", included: true },
          { name: "Enfants couverts", included: true },
          { name: "Ascendants couverts", included: false },
        ],
      },
      {
        tier: "premium",
        name: "Élargi",
        price: 40000,
        coverages: [
          { name: "Capital obsèques assuré", included: true },
          { name: "Rapatriement du corps", included: true },
          { name: "Conjoint couvert", included: true },
          { name: "Enfants couverts", included: true },
          { name: "Ascendants couverts", included: true },
        ],
      },
    ],
    additionalOptions: [
      { id: "ceremonie", name: "Frais de Cérémonie", description: "Prise en charge des frais funéraires", price: 10000 },
      { id: "soutien_famille", name: "Soutien Familial", description: "Accompagnement psychologique", price: 5000 },
    ],
  },
  mrh: {
    plans: [
      {
        tier: "basic",
        name: "Essentiel",
        price: 85000,
        coverages: [
          { name: "Incendie & Explosion", included: true },
          { name: "Dégât des eaux", included: true },
          { name: "Vol & Vandalisme", included: false },
          { name: "Bris de glace", included: false },
          { name: "RC Vie Privée", included: false },
        ],
      },
      {
        tier: "standard",
        name: "Confort",
        price: 135000,
        coverages: [
          { name: "Incendie & Explosion", included: true },
          { name: "Dégât des eaux", included: true },
          { name: "Vol & Vandalisme", included: true },
          { name: "Bris de glace", included: true },
          { name: "RC Vie Privée", included: false },
        ],
      },
      {
        tier: "premium",
        name: "Premium",
        price: 195000,
        coverages: [
          { name: "Incendie & Explosion", included: true },
          { name: "Dégât des eaux", included: true },
          { name: "Vol & Vandalisme", included: true },
          { name: "Bris de glace", included: true },
          { name: "RC Vie Privée", included: true },
        ],
      },
    ],
    additionalOptions: [
      { id: "piscine", name: "Piscine", description: "Couverture piscine et équipements", price: 25000 },
      { id: "dependances", name: "Dépendances", description: "Garage, cave, abri de jardin", price: 18000 },
      { id: "objets_valeur", name: "Objets de Valeur", description: "Bijoux, œuvres d'art, collections", price: 45000 },
    ],
  },
  assistance_voyage: {
    plans: [
      {
        tier: "basic",
        name: "Essentiel",
        price: 45000,
        coverages: [
          { name: "Rapatriement sanitaire", included: true },
          { name: "Frais médicaux urgents", included: true },
          { name: "Perte de bagages", included: false },
          { name: "Annulation voyage", included: false },
          { name: "Assistance juridique", included: false },
        ],
      },
      {
        tier: "standard",
        name: "Confort",
        price: 85000,
        coverages: [
          { name: "Rapatriement sanitaire", included: true },
          { name: "Frais médicaux urgents", included: true },
          { name: "Perte de bagages", included: true },
          { name: "Annulation voyage", included: true },
          { name: "Assistance juridique", included: false },
        ],
      },
      {
        tier: "premium",
        name: "Premium",
        price: 135000,
        coverages: [
          { name: "Rapatriement sanitaire", included: true },
          { name: "Frais médicaux urgents", included: true },
          { name: "Perte de bagages", included: true },
          { name: "Annulation voyage", included: true },
          { name: "Assistance juridique", included: true },
        ],
      },
    ],
    additionalOptions: [
      { id: "sports_hiver", name: "Sports d'Hiver", description: "Ski et sports de montagne", price: 25000 },
      { id: "sports_extreme", name: "Sports Extrêmes", description: "Parachutisme, plongée, etc.", price: 35000 },
      { id: "prolongation", name: "Prolongation Séjour", description: "Hébergement supplémentaire", price: 15000 },
    ],
  },
};

const periodicityOptions: { id: ContractPeriodicity; name: string; months: number; discount: number }[] = [
  { id: "1_month", name: "1 mois", months: 1, discount: 0 },
  { id: "3_months", name: "3 mois", months: 3, discount: 0 },
  { id: "6_months", name: "6 mois", months: 6, discount: 0.05 },
  { id: "1_year", name: "12 mois", months: 12, discount: 0.10 },
];

// Determine recommended plan based on product type and context
const getRecommendedPlan = (productType: SelectedProductType, state: GuidedSalesState): PlanTier => {
  switch (productType) {
    case "auto": {
      const vehicleDate = state.needsAnalysis.vehicleFirstCirculationDate;
      if (!vehicleDate) return "standard";
      const vehicleYear = new Date(vehicleDate).getFullYear();
      const currentYear = new Date().getFullYear();
      const vehicleAge = currentYear - vehicleYear;
      if (vehicleAge <= 3) return "premium";
      if (vehicleAge <= 7) return "standard";
      return "basic";
    }
    case "molo_molo":
    case "pack_obseques": {
      // Pour produits vie : recommandation basée sur le nombre de bénéficiaires
      const beneficiaries = state.needsAnalysis.beneficiaryCount || 1;
      if (beneficiaries >= 4) return "premium";
      if (beneficiaries >= 2) return "standard";
      return "basic";
    }
    case "mrh": {
      // Pour MRH : basé sur la surface
      const surface = state.needsAnalysis.surface || 0;
      if (surface >= 150) return "premium";
      if (surface >= 80) return "standard";
      return "basic";
    }
    case "assistance_voyage":
      return "standard";
    default:
      return "standard";
  }
};

export const CoverageStep = ({ state, onUpdate, onNeedsUpdate, onPremiumUpdate, onNext }: CoverageStepProps) => {
  const { coverage, needsAnalysis } = state;
  const productType = state.productSelection.selectedProduct || "auto";
  
  // Récupérer la configuration du produit
  const productConfig = productPlansConfig[productType] || productPlansConfig.auto;
  const { plans, assistanceOptions, additionalOptions } = productConfig;
  
  const selectedPlan = plans.find(p => p.tier === coverage.planTier) || plans[1];
  const selectedPeriodicity = needsAnalysis.contractPeriodicity || "1_year";
  
  // Get recommended plan based on product type and context
  const recommendedPlan = getRecommendedPlan(productType, state);

  // Calculate price based on periodicity
  const calculatePeriodicityPrice = (annualPrice: number, periodicity: ContractPeriodicity) => {
    const option = periodicityOptions.find(p => p.id === periodicity);
    if (!option) return annualPrice;
    const monthlyPrice = annualPrice / 12;
    const basePrice = monthlyPrice * option.months;
    const discount = basePrice * option.discount;
    return Math.round(basePrice - discount);
  };

  const calculateTotal = (planPrice: number, options: string[], assistanceId?: string, periodicity: ContractPeriodicity = "1_year") => {
    const optionsTotal = options.reduce((sum, optId) => {
      const opt = additionalOptions.find(o => o.id === optId);
      return sum + (opt?.price || 0);
    }, 0);
    const assistancePrice = assistanceOptions?.find(a => a.id === assistanceId)?.price || 0;
    const annualTotal = planPrice + optionsTotal + assistancePrice;
    return calculatePeriodicityPrice(annualTotal, periodicity);
  };

  const handlePeriodicityChange = (periodicity: ContractPeriodicity) => {
    onNeedsUpdate({ contractPeriodicity: periodicity });
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

  // Get label for periodicity
  const getPeriodicityLabel = (periodicity: ContractPeriodicity) => {
    const option = periodicityOptions.find(p => p.id === periodicity);
    if (!option) return "/an";
    if (option.months === 1) return "/mois";
    if (option.months === 3) return "/trim.";
    if (option.months === 6) return "/sem.";
    return "/an";
  };

  // Titre dynamique selon le produit
  const getProductTitle = () => {
    switch (productType) {
      case "auto": return "Niveaux de Couverture Auto";
      case "molo_molo": return "Niveaux de Couverture Molo Molo";
      case "pack_obseques": return "Niveaux de Couverture Pack Obsèques";
      case "mrh": return "Niveaux de Couverture MRH";
      case "assistance_voyage": return "Niveaux de Couverture Voyage";
      default: return "Niveaux de Couverture";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{getProductTitle()}</h1>
        <p className="text-muted-foreground mt-1">
          Choisissez le pack adapté aux besoins de protection.
        </p>
      </div>

      {/* Periodicity Selection */}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isRecommended = plan.tier === recommendedPlan;
          const isSelected = coverage.planTier === plan.tier;
          const periodicPrice = calculatePeriodicityPrice(plan.price, selectedPeriodicity);
          
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
                  <span className="text-xl font-bold">{formatFCFA(periodicPrice)}</span>
                  <span className="text-muted-foreground text-sm">{getPeriodicityLabel(selectedPeriodicity)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assistance Block - Only for Auto */}
      {assistanceOptions && assistanceOptions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">
              {productType === "auto" ? "Assistance Auto" : "Options d'Assistance"}
            </h3>
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
      )}

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

      {/* Desktop Next Button - Hidden on mobile */}
      <div className="hidden sm:flex justify-end pt-4 pb-4">
        <Button onClick={onNext} size="lg">
          Passer à la vérification
        </Button>
      </div>

      {/* Mobile Sticky Bar */}
      <MobileCoverageStickyBar
        state={state}
        onNext={onNext}
        nextLabel="Passer à la vérification"
        onPlanChange={handlePlanSelect}
      />
    </div>
  );
};
