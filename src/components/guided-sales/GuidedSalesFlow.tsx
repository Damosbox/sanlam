import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QuoteSummaryCard } from "./QuoteSummaryCard";
import { ClientIdentificationStep } from "./steps/ClientIdentificationStep";
import { NeedsAnalysisStep } from "./steps/NeedsAnalysisStep";
import { QuickQuoteStep } from "./steps/QuickQuoteStep";
import { CoverageStep } from "./steps/CoverageStep";
import { UnderwritingStep } from "./steps/UnderwritingStep";
import { BindingStep } from "./steps/BindingStep";
import { IssuanceStep } from "./steps/IssuanceStep";
import { GuidedSalesState, initialState, PlanTier } from "./types";
import { StepNavigation } from "./StepNavigation";
import { ChevronUp, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import { calculateAutoPremium, convertToCalculatedPremium } from "@/utils/autoPremiumCalculator";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const TOTAL_STEPS = 7;
const stepLabels = ["Identifier le client", "Générer Devis Rapide", "Valider Devis", "Passer à la Vérification", "Confirmer", "Émettre la police", "Terminer"];
const stepNames = ["Identification", "Besoin", "Devis", "Couverture", "Vérification", "Signature", "Émission"];

// Type pour les recommandations IA
interface AIRecommendation {
  id: string;
  text: string;
  savingsPercent: number;
  action: string;
}

export const GuidedSalesFlow = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<GuidedSalesState>(initialState);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const prevStepRef = useRef(state.currentStep);

  // Load contact data from query params
  useEffect(() => {
    const contactId = searchParams.get("contactId");
    const contactType = searchParams.get("type") as "prospect" | "client" | null;

    if (contactId && contactType && !isInitialized) {
      loadContactData(contactId, contactType);
    }
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  const loadContactData = async (contactId: string, contactType: "prospect" | "client") => {
    if (contactType === "prospect") {
      const { data: lead } = await supabase
        .from("leads")
        .select("*")
        .eq("id", contactId)
        .single();

      if (lead) {
        setState(prev => ({
          ...prev,
          clientIdentification: {
            ...prev.clientIdentification,
            firstName: lead.first_name,
            lastName: lead.last_name,
            phone: lead.phone || "",
            email: lead.email || "",
            linkedContactId: lead.id,
            linkedContactType: "prospect",
          },
        }));
      }
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", contactId)
        .single();

      if (profile) {
        const nameParts = (profile.display_name || "").split(" ");
        setState(prev => ({
          ...prev,
          clientIdentification: {
            ...prev.clientIdentification,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            phone: profile.phone || "",
            email: profile.email || "",
            linkedContactId: profile.id,
            linkedContactType: "client",
          },
        }));
      }
    }
  };

  useEffect(() => {
    if (prevStepRef.current !== state.currentStep) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      prevStepRef.current = state.currentStep;
      return () => clearTimeout(timer);
    }
  }, [state.currentStep]);

  const updateClientIdentification = (data: Partial<GuidedSalesState["clientIdentification"]>) => {
    setState(prev => ({
      ...prev,
      clientIdentification: {
        ...prev.clientIdentification,
        ...data
      }
    }));
  };

  const updateNeedsAnalysis = (data: Partial<GuidedSalesState["needsAnalysis"]>) => {
    setState(prev => {
      const newState = {
        ...prev,
        needsAnalysis: {
          ...prev.needsAnalysis,
          ...data
        }
      };
      // Recalcul dynamique avec le nouvel état
      const breakdown = calculateAutoPremium(newState);
      const premium = convertToCalculatedPremium(breakdown);
      return {
        ...newState,
        calculatedPremium: premium
      };
    });
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
    setState(prev => {
      const newState = {
        ...prev,
        coverage: {
          ...prev.coverage,
          ...data
        }
      };
      // Recalcul dynamique avec le nouvel état
      const breakdown = calculateAutoPremium(newState);
      const premium = convertToCalculatedPremium(breakdown);
      return {
        ...newState,
        calculatedPremium: premium
      };
    });
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
    // Utilise le calculateur de prime Auto CIMA
    const breakdown = calculateAutoPremium(state);
    const premium = convertToCalculatedPremium(breakdown);
    setState(prev => ({
      ...prev,
      calculatedPremium: premium
    }));
  };

  // Handler pour appliquer les suggestions IA
  const handleApplySuggestion = useCallback((suggestion: AIRecommendation) => {
    setState(prev => {
      let newState = { ...prev };

      switch (suggestion.action) {
        case "increase_franchise":
          // Appliquer bonus 20% si ce n'est pas déjà le cas
          if (!prev.needsAnalysis.bonusMalus?.startsWith("bonus_2")) {
            newState = {
              ...newState,
              needsAnalysis: {
                ...newState.needsAnalysis,
                bonusMalus: "bonus_20"
              }
            };
          }
          break;

        case "downgrade_to_standard":
          // Passer au plan Standard
          newState = {
            ...newState,
            coverage: {
              ...newState.coverage,
              planTier: "standard" as PlanTier
            }
          };
          break;

        case "add_avantage_assistance":
          // Ajouter l'assistance Avantage
          newState = {
            ...newState,
            coverage: {
              ...newState.coverage,
              assistanceLevel: "avantage"
            }
          };
          break;

        case "check_bns":
          // Suggérer un bonus de 20%
          newState = {
            ...newState,
            needsAnalysis: {
              ...newState.needsAnalysis,
              bonusMalus: "bonus_20"
            }
          };
          break;

        default:
          break;
      }

      // Recalculer la prime avec le nouvel état
      const breakdown = calculateAutoPremium(newState);
      const premium = convertToCalculatedPremium(breakdown);
      
      return {
        ...newState,
        calculatedPremium: premium
      };
    });
  }, []);

  const goToStep = (step: number) => {
    if (step >= 0 && step <= state.currentStep) {
      setDirection(step < state.currentStep ? "backward" : "forward");
      setState(prev => ({
        ...prev,
        currentStep: step
      }));
    }
  };

  const nextStep = () => {
    if (state.currentStep < TOTAL_STEPS - 1) {
      setDirection("forward");
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
      setDrawerOpen(false);
    }
  };

  const prevStep = () => {
    if (state.currentStep > 0) {
      setDirection("backward");
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  };

  const resetFlow = () => {
    setDirection("forward");
    setState(initialState);
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <ClientIdentificationStep state={state} onUpdate={updateClientIdentification} onNext={nextStep} />;
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
            onPrev={prevStep}
          />
        </div>
      </div>

      {/* Step Progress - Mobile */}
      <div className="lg:hidden px-4 py-3 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {state.currentStep > 0 && state.currentStep < 6 && (
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-24 lg:pb-8 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Form Area with Slide Animation */}
          <div className="lg:col-span-2">
            <div
              key={state.currentStep}
              className={cn(
                "transition-all duration-300 ease-out",
                isAnimating && direction === "forward" && "animate-slide-in-right",
                isAnimating && direction === "backward" && "animate-slide-in-left"
              )}
            >
              {renderStep()}
            </div>
          </div>

          {/* Desktop Summary Card - only show from step 4 onwards */}
          {state.currentStep > 3 && state.currentStep < 6 && (
            <div className="hidden lg:block">
              <QuoteSummaryCard 
                state={state} 
                onNext={nextStep} 
                nextLabel={stepLabels[state.currentStep]}
                onApplySuggestion={handleApplySuggestion}
              />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Drawer - only show from step 4 onwards */}
      {state.currentStep > 3 && state.currentStep < 6 && (
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
                    <span>{formatFCFA(state.calculatedPremium.total)}/an</span>
                    <span className="text-xs opacity-80">• {stepLabels[state.currentStep]}</span>
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
                  nextLabel={stepLabels[state.currentStep]}
                  onApplySuggestion={handleApplySuggestion}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )}

      {/* Mobile Next Button for steps 0-3 */}
      {state.currentStep >= 0 && state.currentStep <= 3 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t">
          <Button onClick={nextStep} className="w-full" size="lg">
            {stepLabels[state.currentStep]}
          </Button>
        </div>
      )}

      {/* Desktop Next Button for steps 1-3 (no summary card visible) */}
      {state.currentStep >= 1 && state.currentStep <= 3 && (
        <div className="hidden lg:block fixed bottom-6 right-6 z-50">
          <Button onClick={nextStep} size="lg" className="shadow-lg">
            {stepLabels[state.currentStep]}
          </Button>
        </div>
      )}
    </div>
  );
};