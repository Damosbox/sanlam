import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuoteSummaryCard } from "./QuoteSummaryCard";
import { NeedsAnalysisStep } from "./steps/NeedsAnalysisStep";
import { QuickQuoteStep } from "./steps/QuickQuoteStep";
import { CoverageStep } from "./steps/CoverageStep";
import { UnderwritingStep } from "./steps/UnderwritingStep";
import { BindingStep } from "./steps/BindingStep";
import { IssuanceStep } from "./steps/IssuanceStep";
import { GuidedSalesState, initialState } from "./types";
import { StepNavigation } from "./StepNavigation";
import { ChevronUp, ChevronLeft } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const TOTAL_STEPS = 6;
const stepLabels = ["Générer Devis Rapide", "Valider Devis", "Passer à la Vérification", "Confirmer", "Émettre la police", "Terminer"];
const stepNames = ["Analyse", "Devis", "Couverture", "Souscription", "Signature", "Émission"];

export const GuidedSalesFlow = () => {
  const [state, setState] = useState<GuidedSalesState>(initialState);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const goToStep = (step: number) => {
    if (step >= 1 && step <= state.currentStep) {
      setState(prev => ({
        ...prev,
        currentStep: step
      }));
    }
  };

  const nextStep = () => {
    if (state.currentStep < TOTAL_STEPS) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
      setDrawerOpen(false);
    }
  };

  const prevStep = () => {
    if (state.currentStep > 1) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
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

  return (
    <div className="min-h-screen bg-background">
      {/* Step Navigation - Desktop */}
      <div className="hidden lg:block border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <StepNavigation 
            currentStep={state.currentStep} 
            totalSteps={TOTAL_STEPS} 
            stepNames={stepNames}
            onStepClick={goToStep}
          />
        </div>
      </div>

      {/* Step Progress - Mobile */}
      <div className="lg:hidden px-4 py-3 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {state.currentStep > 1 && state.currentStep < 6 && (
            <Button variant="ghost" size="icon" onClick={prevStep} className="shrink-0 -ml-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <StepNavigation 
              currentStep={state.currentStep} 
              totalSteps={TOTAL_STEPS} 
              stepNames={stepNames}
              onStepClick={goToStep}
              compact
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2 animate-fade-in">
            {renderStep()}
          </div>

          {/* Desktop Summary Card */}
          {state.currentStep < 6 && (
            <div className="hidden lg:block">
              <QuoteSummaryCard 
                state={state} 
                onNext={nextStep} 
                onPrev={state.currentStep > 1 ? prevStep : undefined}
                nextLabel={stepLabels[state.currentStep - 1]} 
              />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Drawer */}
      {state.currentStep < 6 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                className="w-full rounded-none h-16 text-base font-medium gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
                size="lg"
              >
                <span className="flex flex-col items-center">
                  <ChevronUp className="h-4 w-4 mb-0.5" />
                  <span className="flex items-baseline gap-2">
                    <span>{Math.round(state.calculatedPremium.total)} €/an</span>
                    <span className="text-xs opacity-80">• {stepLabels[state.currentStep - 1]}</span>
                  </span>
                </span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Résumé du devis</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 overflow-auto">
                <QuoteSummaryCard 
                  state={state} 
                  onNext={nextStep} 
                  onPrev={state.currentStep > 1 ? prevStep : undefined}
                  nextLabel={stepLabels[state.currentStep - 1]} 
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )}
    </div>
  );
};