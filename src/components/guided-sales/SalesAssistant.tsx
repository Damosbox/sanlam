import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import { GuidedSalesState, PlanTier, SelectedProductType } from "./types";
import { formatFCFA } from "@/utils/formatCurrency";
import { SalesAIChat } from "./SalesAIChat";
import { ThematicButtons } from "./ThematicButtons";
import { OfferComparison } from "./OfferComparison";

interface SalesAssistantProps {
  state: GuidedSalesState;
  onNext: () => void;
  nextLabel: string;
  disabled?: boolean;
  onPlanChange: (plan: PlanTier) => void;
}

const productLabels: Record<SelectedProductType, string> = {
  auto: "Assurance Auto",
  molo_molo: "Épargne Molo Molo",
  pack_obseques: "Pack Obsèques",
};

export const SalesAssistant = ({ 
  state, 
  onNext, 
  nextLabel, 
  disabled,
  onPlanChange 
}: SalesAssistantProps) => {
  const [activeTopic, setActiveTopic] = useState<string | undefined>();
  const totalAPayer = state.calculatedPremium.totalAPayer;
  const monthlyEquivalent = Math.round(totalAPayer / 12);

  const handleTopicClick = useCallback((topicId: string, description: string) => {
    setActiveTopic(description);
  }, []);

  const handleClearTopic = useCallback(() => {
    setActiveTopic(undefined);
  }, []);

  const handlePlanSelect = useCallback((plan: PlanTier) => {
    onPlanChange(plan);
  }, [onPlanChange]);

  return (
    <Card className="sticky top-20 overflow-hidden">
      {/* Header with Total Premium */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 sm:p-6">
        <p className="text-xs uppercase tracking-wider text-primary-foreground/80 mb-1">
          {productLabels[state.productSelection.selectedProduct]}
        </p>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-bold">{formatFCFA(totalAPayer)}</span>
            <span className="text-sm text-primary-foreground/80 ml-2">/an</span>
          </div>
        </div>
        <p className="text-xs text-primary-foreground/70 mt-1">
          soit {formatFCFA(monthlyEquivalent)}/mois
        </p>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* AI Chat Section */}
        <SalesAIChat 
          state={state} 
          activeTopic={activeTopic}
          onClearTopic={handleClearTopic}
        />

        <Separator />

        {/* Thematic Buttons */}
        <ThematicButtons 
          productType={state.productSelection.selectedProduct}
          onTopicClick={handleTopicClick}
        />

        <Separator />

        {/* Offer Comparison */}
        <OfferComparison 
          state={state}
          onSelectPlan={handlePlanSelect}
        />

        <Separator />

        {/* CTA Button */}
        <Button 
          onClick={onNext} 
          className="w-full gap-2 shadow-md hover:shadow-lg transition-all duration-200" 
          size="lg"
          disabled={disabled}
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Button>
      </div>
    </Card>
  );
};
