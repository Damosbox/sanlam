import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StepProgress } from "./StepProgress";
import { QuoteSummaryCard } from "./QuoteSummaryCard";
import { NeedsAnalysisStep } from "./steps/NeedsAnalysisStep";
import { QuickQuoteStep } from "./steps/QuickQuoteStep";
import { CoverageStep } from "./steps/CoverageStep";
import { UnderwritingStep } from "./steps/UnderwritingStep";
import { BindingStep } from "./steps/BindingStep";
import { IssuanceStep } from "./steps/IssuanceStep";
import { GuidedSalesState, initialState } from "./types";
const TOTAL_STEPS = 6;
const stepLabels = ["Générer Devis Rapide", "Valider Devis", "Passer à la Vérification", "Confirmer", "Émettre la police", "Terminer"];
export const GuidedSalesFlow = () => {
  const [state, setState] = useState<GuidedSalesState>(initialState);
  const updateNeedsAnalysis = (data: Partial<GuidedSalesState["needsAnalysis"]>) => {
    setState(prev => ({
      ...prev,
      needsAnalysis: {
        ...prev.needsAnalysis,
        ...data
      }
    }));
  };
  const updateQuickQuote = (data: Partial<GuidedSalesState["quickQuote"]>) => {
    setState(prev => ({
      ...prev,
      quickQuote: {
        ...prev.quickQuote,
        ...data
      }
    }));
    // Recalculate premium on quote changes
    recalculatePremium();
  };
  const updateCoverage = (data: Partial<GuidedSalesState["coverage"]>) => {
    setState(prev => ({
      ...prev,
      coverage: {
        ...prev.coverage,
        ...data
      }
    }));
  };
  const updateUnderwriting = (data: Partial<GuidedSalesState["underwriting"]>) => {
    setState(prev => ({
      ...prev,
      underwriting: {
        ...prev.underwriting,
        ...data
      }
    }));
  };
  const updateBinding = (data: Partial<GuidedSalesState["binding"]>) => {
    setState(prev => ({
      ...prev,
      binding: {
        ...prev.binding,
        ...data
      }
    }));
  };
  const updatePremium = (premium: GuidedSalesState["calculatedPremium"]) => {
    setState(prev => ({
      ...prev,
      calculatedPremium: premium
    }));
  };
  const recalculatePremium = () => {
    // Simple calculation based on franchise
    const basePremium = 450;
    const franchiseDiscount = state.quickQuote.franchise * 0.05;
    const total = Math.max(300, basePremium - franchiseDiscount);
    setState(prev => ({
      ...prev,
      calculatedPremium: {
        netPremium: total * 0.67,
        taxes: total * 0.33,
        fees: 0,
        total
      }
    }));
  };
  const nextStep = () => {
    if (state.currentStep < TOTAL_STEPS) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    }
  };
  const resetFlow = () => {
    setState(initialState);
  };
  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <NeedsAnalysisStep state={state} onUpdate={updateNeedsAnalysis} />;
      case 2:
        return <QuickQuoteStep state={state} onUpdate={updateQuickQuote} />;
      case 3:
        return <CoverageStep state={state} onUpdate={updateCoverage} onPremiumUpdate={updatePremium} />;
      case 4:
        return <UnderwritingStep state={state} onUpdate={updateUnderwriting} />;
      case 5:
        return <BindingStep state={state} onUpdate={updateBinding} />;
      case 6:
        return <IssuanceStep state={state} onReset={resetFlow} />;
      default:
        return null;
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            {renderStep()}
          </div>

          {/* Sticky Summary Card */}
          {state.currentStep < 6 && <div className="hidden lg:block">
              <QuoteSummaryCard state={state} onNext={nextStep} nextLabel={stepLabels[state.currentStep - 1]} />
            </div>}
        </div>

        {/* Mobile CTA */}
        {state.currentStep < 6 && <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
            <QuoteSummaryCard state={state} onNext={nextStep} nextLabel={stepLabels[state.currentStep - 1]} />
          </div>}
      </main>
    </div>;
};