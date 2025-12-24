import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { PlanTier, GuidedSalesState, SelectedProductType } from "./types";
import { formatFCFA } from "@/utils/formatCurrency";
import { cn } from "@/lib/utils";

interface OfferComparisonProps {
  state: GuidedSalesState;
  onSelectPlan: (plan: PlanTier) => void;
}

interface OfferLevel {
  id: PlanTier;
  name: string;
  stars: number;
  multiplier: number;
  highlights: string[];
  color: string;
}

const offerLevels: OfferLevel[] = [
  {
    id: "premium",
    name: "Premium",
    stars: 5,
    multiplier: 1.35,
    highlights: ["Tous risques", "0 franchise", "Véhicule de remplacement"],
    color: "bg-amber-500",
  },
  {
    id: "standard",
    name: "Standard",
    stars: 4,
    multiplier: 1,
    highlights: ["RC + Vol + Incendie", "Franchise 100K", "Assistance 24h"],
    color: "bg-primary",
  },
  {
    id: "basic",
    name: "Basic",
    stars: 3,
    multiplier: 0.7,
    highlights: ["RC obligatoire", "Franchise 250K"],
    color: "bg-slate-500",
  },
];

// Highlights par produit
const highlightsByProduct: Record<SelectedProductType, Record<PlanTier, string[]>> = {
  auto: {
    premium: ["Tous risques", "0 franchise", "Véhicule de remplacement"],
    standard: ["RC + Vol + Incendie", "Franchise 100K", "Assistance 24h"],
    basic: ["RC obligatoire", "Franchise 250K"],
  },
  molo_molo: {
    premium: ["Capital × 2 en cas de décès", "Rachat dès 2 ans", "Bonus fidélité 10%"],
    standard: ["Capital garanti", "Rachat dès 3 ans", "Bonus fidélité 5%"],
    basic: ["Capital garanti", "Rachat dès 5 ans"],
  },
  pack_obseques: {
    premium: ["Capital 5M FCFA", "Conjoint + 4 enfants", "2 ascendants inclus"],
    standard: ["Capital 3M FCFA", "Conjoint + 2 enfants", "1 ascendant inclus"],
    basic: ["Capital 1.5M FCFA", "Souscripteur seul"],
  },
  mrh: {
    premium: ["Bâtiment + Contenu", "Tous risques informatique", "RC familiale incluse"],
    standard: ["Bâtiment + Contenu", "Risques locatifs", "Vol inclus"],
    basic: ["Risques locatifs", "Incendie + Dégâts des eaux"],
  },
  assistance_voyage: {
    premium: ["Frais médicaux 100M", "Rapatriement illimité", "Annulation voyage"],
    standard: ["Frais médicaux 50M", "Rapatriement inclus", "Bagages couverts"],
    basic: ["Frais médicaux 20M", "Rapatriement basique"],
  },
};

export const OfferComparison = ({ state, onSelectPlan }: OfferComparisonProps) => {
  const currentPlan = state.coverage.planTier;
  const basePremium = state.calculatedPremium.totalAPayer;
  const productType = state.productSelection.selectedProduct;

  const getHighlights = (planId: PlanTier): string[] => {
    return highlightsByProduct[productType]?.[planId] || highlightsByProduct.auto[planId];
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Comparer les offres</h4>
      <div className="grid grid-cols-3 gap-2">
        {offerLevels.map((offer) => {
          const isSelected = currentPlan === offer.id;
          const estimatedPremium = Math.round(basePremium * offer.multiplier / (currentPlan === "standard" ? 1 : currentPlan === "premium" ? 1.35 : 0.7));
          const highlights = getHighlights(offer.id);

          return (
            <Card
              key={offer.id}
              className={cn(
                "p-3 transition-all cursor-pointer hover:shadow-md",
                isSelected && "ring-2 ring-primary border-primary"
              )}
              onClick={() => !isSelected && onSelectPlan(offer.id)}
            >
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-bold uppercase px-2 py-0.5 rounded text-white", offer.color)}>
                    {offer.name}
                  </span>
                  {isSelected && (
                    <Badge variant="outline" className="text-[10px] h-5 border-primary text-primary">
                      Actuel
                    </Badge>
                  )}
                </div>

                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: offer.stars }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Price */}
                <div className="text-center py-1">
                  <p className="text-lg font-bold text-foreground">{formatFCFA(estimatedPremium)}</p>
                  <p className="text-[10px] text-muted-foreground">/an</p>
                </div>

                {/* Highlights */}
                <div className="space-y-1">
                  {highlights.slice(0, 2).map((highlight, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-muted-foreground leading-tight">{highlight}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  variant={isSelected ? "secondary" : "outline"}
                  size="sm"
                  className="w-full h-7 text-xs"
                  disabled={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSelected) onSelectPlan(offer.id);
                  }}
                >
                  {isSelected ? "✓ Sélectionné" : "Choisir"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
