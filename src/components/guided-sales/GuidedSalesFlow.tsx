import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductSelectionStep } from "./steps/ProductSelectionStep";
import { SimulationStep } from "./steps/SimulationStep";
import { FormulaSelectionStep } from "./steps/FormulaSelectionStep";
import { SubscriptionFlow } from "./steps/SubscriptionFlow";
import { MobilePaymentStep } from "./steps/MobilePaymentStep";
import { SignatureEmissionStep } from "./steps/SignatureEmissionStep";
import { MoloMoloNeedsStep } from "./steps/MoloMoloNeedsStep";
import { PackObsequesSimulationStep } from "./steps/PackObsequesSimulationStep";
import { PackObsequesSubscriptionFlow } from "./steps/PackObsequesSubscriptionFlow";
import { PhaseNavigation } from "./PhaseNavigation";
import { DynamicSummaryBreadcrumb } from "./DynamicSummaryBreadcrumb";
import { SalesAssistant } from "./SalesAssistant";
import { MobileCoverageStickyBar } from "./MobileCoverageStickyBar";
import { 
  GuidedSalesState, 
  initialState, 
  SalesPhase, 
  ProductCategory, 
  SelectedProductType, 
  MoloMoloData, 
  PackObsequesData,
  PlanTier
} from "./types";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateAutoPremium, convertToCalculatedPremium } from "@/utils/autoPremiumCalculator";
import { calculateMoloMoloPremium, convertMoloMoloToCalculatedPremium } from "@/utils/moloMoloPremiumCalculator";
import { calculatePackObsequesPremium, convertPackObsequesToCalculatedPremium } from "@/utils/packObsequesPremiumCalculator";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// Step mapping per phase
const PHASE_STEPS: Record<SalesPhase, number[]> = {
  preparation: [0, 1],     // Product Selection, Simulation (with sub-steps)
  construction: [2],       // Formula Selection
  souscription: [3],       // Subscription Flow (with sub-steps)
  finalisation: [4, 5],    // Mobile Payment, Signature & Emission
};

const getPhaseFromStep = (step: number): SalesPhase => {
  if (step <= 1) return "preparation";
  if (step === 2) return "construction";
  if (step === 3) return "souscription";
  return "finalisation";
};

const getFirstStepOfPhase = (phase: SalesPhase): number => {
  return PHASE_STEPS[phase][0];
};

export const GuidedSalesFlow = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<GuidedSalesState>(initialState);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const isMobile = useIsMobile();

  // Update phase based on current step
  useEffect(() => {
    const phase = getPhaseFromStep(state.currentStep);
    if (phase !== state.currentPhase) {
      setState(prev => ({ ...prev, currentPhase: phase }));
    }
  }, [state.currentStep, state.currentPhase]);

  // Animation effect
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [state.currentStep]);

  const updateProductSelection = (data: { category: ProductCategory; selectedProduct: SelectedProductType }) => {
    setState(prev => ({
      ...prev,
      productSelection: {
        ...prev.productSelection,
        ...data
      }
    }));
  };

  const updateNeedsAnalysis = useCallback((data: Partial<GuidedSalesState["needsAnalysis"]>) => {
    setState(prev => {
      const newState = {
        ...prev,
        needsAnalysis: {
          ...prev.needsAnalysis,
          ...data
        }
      };
      return newState;
    });
  }, []);

  const updateCoverage = useCallback((data: Partial<GuidedSalesState["coverage"]>) => {
    setState(prev => {
      const newState = {
        ...prev,
        coverage: {
          ...prev.coverage,
          ...data
        }
      };
      // Recalculate premium for auto
      if (prev.productSelection.selectedProduct === "auto" && prev.simulationCalculated) {
        const breakdown = calculateAutoPremium(newState);
        const premium = convertToCalculatedPremium(breakdown);
        return { ...newState, calculatedPremium: premium };
      }
      return newState;
    });
  }, []);

  const updateSubscription = useCallback((data: Partial<GuidedSalesState["subscription"]>) => {
    setState(prev => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        ...data
      }
    }));
  }, []);

  const updateMobilePayment = useCallback((data: Partial<GuidedSalesState["mobilePayment"]>) => {
    setState(prev => ({
      ...prev,
      mobilePayment: {
        ...prev.mobilePayment,
        ...data
      }
    }));
  }, []);

  const updateBinding = useCallback((data: Partial<GuidedSalesState["binding"]>) => {
    setState(prev => ({
      ...prev,
      binding: {
        ...prev.binding,
        ...data
      }
    }));
  }, []);

  const updateMoloMoloData = useCallback((data: Partial<MoloMoloData>) => {
    setState(prev => {
      const newMoloMoloData = {
        ...prev.moloMoloData!,
        ...data
      };
      const breakdown = calculateMoloMoloPremium(newMoloMoloData);
      const premium = convertMoloMoloToCalculatedPremium(breakdown);
      return {
        ...prev,
        moloMoloData: newMoloMoloData,
        calculatedPremium: premium,
        simulationCalculated: true
      };
    });
  }, []);

  const updatePackObsequesData = useCallback((data: Partial<PackObsequesData>) => {
    setState(prev => {
      const newPackObsequesData = {
        ...prev.packObsequesData!,
        ...data
      };
      const breakdown = calculatePackObsequesPremium(newPackObsequesData);
      const premium = convertPackObsequesToCalculatedPremium(breakdown);
      return {
        ...prev,
        packObsequesData: newPackObsequesData,
        calculatedPremium: premium,
        simulationCalculated: true
      };
    });
  }, []);

  const handleCalculate = useCallback(() => {
    setIsCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      setState(prev => {
        const breakdown = calculateAutoPremium(prev);
        const premium = convertToCalculatedPremium(breakdown);
        return {
          ...prev,
          calculatedPremium: premium,
          simulationCalculated: true
        };
      });
      setIsCalculating(false);
      toast.success("Tarif calculé avec succès !");
    }, 1000);
  }, []);

  const handlePackObsequesCalculate = useCallback(() => {
    setIsCalculating(true);
    
    setTimeout(() => {
      setState(prev => {
        const breakdown = calculatePackObsequesPremium(prev.packObsequesData!);
        const premium = convertPackObsequesToCalculatedPremium(breakdown);
        return {
          ...prev,
          calculatedPremium: premium,
          simulationCalculated: true
        };
      });
      setIsCalculating(false);
      toast.success("Tarif calculé avec succès !");
    }, 1000);
  }, []);

  const handleSaveQuote = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Veuillez vous connecter");
        return;
      }

      const product = state.productSelection.selectedProduct;
      const productNames: Record<string, string> = {
        auto: "Assurance Auto",
        mrh: "Assurance Habitation",
        sante: "Assurance Santé",
        vie: "Assurance Vie",
        molo_molo: "Molo Molo",
        pack_obseques: "Pack Obsèques"
      };

      // Map periodicity to frequency
      const mapPeriodicity = (periodicity?: string): string => {
        switch (periodicity) {
          case "1_month": return "mensuel";
          case "3_months": return "trimestriel";
          case "6_months": return "semestriel";
          case "1_year":
          default: return "annuel";
        }
      };

      const quotationData = {
        broker_id: user.id,
        lead_id: state.clientIdentification.linkedContactId || null,
        product_type: String(product || "auto"),
        product_name: productNames[product || "auto"] || "Assurance Auto",
        premium_amount: state.calculatedPremium.totalAPayer || 0,
        premium_frequency: mapPeriodicity(state.needsAnalysis.contractPeriodicity),
        payment_status: "pending_payment",
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        coverage_details: JSON.parse(JSON.stringify({
          planTier: state.coverage.planTier,
          vehicleInfo: state.needsAnalysis,
          clientInfo: state.clientIdentification,
          options: state.coverage.additionalOptions,
          moloMoloData: state.moloMoloData,
          packObsequesData: state.packObsequesData,
        }))
      };

      const { error } = await supabase.from("quotations").insert([quotationData]);
      
      if (error) {
        console.error("Error saving quote:", error);
        toast.error("Erreur lors de la sauvegarde du devis");
        return;
      }

      toast.success("Devis sauvegardé", {
        description: "Retrouvez-le dans Polices → Cotations",
        action: {
          label: "Voir",
          onClick: () => navigate("/b2b/policies?tab=quotations")
        }
      });
    } catch (err) {
      console.error("Unexpected error saving quote:", err);
      toast.error("Erreur inattendue lors de la sauvegarde");
    }
  }, [state, navigate]);

  const goToPhase = (phase: SalesPhase) => {
    const targetStep = getFirstStepOfPhase(phase);
    if (targetStep <= state.currentStep) {
      setDirection(targetStep < state.currentStep ? "backward" : "forward");
      setState(prev => ({
        ...prev,
        currentStep: targetStep,
        currentPhase: phase
      }));
    }
  };

  const nextStep = () => {
    setDirection("forward");
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1
    }));
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

  const goToStep = (step: number) => {
    if (step >= 0 && step <= state.currentStep) {
      setDirection(step < state.currentStep ? "backward" : "forward");
      setState(prev => ({
        ...prev,
        currentStep: step
      }));
    }
  };

  const handleEdit = (section: "vehicle" | "driver" | "payment") => {
    switch (section) {
      case "vehicle":
        goToStep(1); // SimulationStep
        break;
      case "driver":
        goToStep(3); // SubscriptionFlow
        break;
      case "payment":
        goToStep(4); // MobilePaymentStep
        break;
    }
  };

  const handleEmit = () => {
    // Final emission handled in SignatureEmissionStep
  };

  const handlePlanChange = useCallback((plan: PlanTier) => {
    setState(prev => ({
      ...prev,
      coverage: {
        ...prev.coverage,
        planTier: plan
      }
    }));
  }, []);

  const resetFlow = () => {
    setDirection("forward");
    setState(initialState);
  };

  // Determine if SalesAssistant should be shown (after simulation is calculated)
  const showSalesAssistant = state.simulationCalculated && state.currentStep >= 1;

  const renderStep = () => {
    const product = state.productSelection.selectedProduct;

    switch (state.currentStep) {
      case 0:
        // Step 0: Product Selection
        return <ProductSelectionStep state={state} onUpdate={updateProductSelection} onNext={nextStep} />;
      
      case 1:
        // Step 1: Simulation (17 fields in 5 sub-steps) OR Vie products
        if (product === "molo_molo") {
          return <MoloMoloNeedsStep state={state} onUpdate={updateMoloMoloData} onNext={nextStep} />;
        } else if (product === "pack_obseques") {
          return (
            <PackObsequesSimulationStep 
              state={state} 
              onUpdate={updatePackObsequesData} 
              onNext={nextStep}
              onCalculate={handlePackObsequesCalculate}
              isCalculating={isCalculating}
            />
          );
        }
        return (
          <SimulationStep 
            state={state} 
            onUpdate={updateNeedsAnalysis} 
            onCalculate={handleCalculate}
            onNext={nextStep}
            isCalculating={isCalculating}
          />
        );
      
      case 2:
        // Step 2: Formula Selection
        return (
          <FormulaSelectionStep 
            state={state} 
            onUpdate={updateCoverage}
            onNeedsUpdate={updateNeedsAnalysis}
            onSaveQuote={handleSaveQuote}
            onSubscribe={nextStep}
          />
        );
      
      case 3:
        // Step 3: Subscription Flow (6 sub-steps) - or Pack Obsèques specific
        if (product === "pack_obseques") {
          return <PackObsequesSubscriptionFlow state={state} onUpdate={updatePackObsequesData} onNext={nextStep} />;
        }
        return <SubscriptionFlow state={state} onUpdate={updateSubscription} onNext={nextStep} />;
      
      case 4:
        // Step 4: Mobile Payment
        return <MobilePaymentStep state={state} onUpdate={updateMobilePayment} onNext={nextStep} />;
      
      case 5:
        // Step 5: Signature & Emission
        return (
          <SignatureEmissionStep 
            state={state} 
            onUpdateBinding={updateBinding}
            onEdit={handleEdit}
            onEmit={handleEmit}
          />
        );
      
      default:
        return null;
    }
  };

  // Determine if we should show the breadcrumb
  const showBreadcrumb = state.currentStep > 1 && state.productSelection.selectedProduct === "auto";

  // Get the next button label based on current step
  const getNextLabel = () => {
    if (state.currentStep === 1 && state.simulationCalculated) return "Voir les offres";
    if (state.currentStep === 2) return "Souscrire";
    if (state.currentStep === 3) return "Paiement";
    if (state.currentStep === 4) return "Signature";
    return "Suivant";
  };

  // Handle next button from SalesAssistant
  const handleSalesAssistantNext = () => {
    nextStep();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Phase Navigation - Desktop */}
      {state.currentStep > 0 && (
        <div className="hidden lg:block border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <PhaseNavigation 
              currentPhase={state.currentPhase}
              currentStep={state.currentStep}
              onPhaseClick={goToPhase}
              onPrev={state.currentStep > 0 ? prevStep : undefined}
            />
          </div>
        </div>
      )}

      {/* Phase Navigation - Mobile */}
      {state.currentStep > 0 && (
        <div className="lg:hidden px-4 py-3 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {state.currentStep > 0 && (
              <Button variant="ghost" size="icon" onClick={prevStep} className="shrink-0 -ml-2">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">
              <PhaseNavigation 
                currentPhase={state.currentPhase}
                currentStep={state.currentStep}
                onPhaseClick={goToPhase}
                compact
              />
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Summary Breadcrumb */}
      {showBreadcrumb && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <DynamicSummaryBreadcrumb state={state} />
        </div>
      )}

      {/* Main Content with Sales Assistant Sidebar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
        <div className={cn(
          "flex gap-6",
          showSalesAssistant && !isMobile ? "flex-row" : "flex-col"
        )}>
          {/* Main Step Content */}
          <div className={cn(
            "flex-1 min-w-0",
            showSalesAssistant && !isMobile && "lg:max-w-[65%]"
          )}>
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

            {/* Navigation hint for Phase 1 → Phase 2 transition (when no assistant) */}
            {state.currentStep === 1 && state.simulationCalculated && state.productSelection.selectedProduct === "auto" && !showSalesAssistant && (
              <div className="mt-6 flex justify-center">
                <Button onClick={nextStep} size="lg" className="gap-2">
                  Voir les offres
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            )}
          </div>

          {/* Sales Assistant Sidebar - Desktop */}
          {showSalesAssistant && !isMobile && (
            <div className="hidden lg:block lg:w-[35%] shrink-0">
              <SalesAssistant
                state={state}
                onNext={handleSalesAssistantNext}
                nextLabel={getNextLabel()}
                disabled={state.currentStep === 1 && !state.simulationCalculated}
                onPlanChange={handlePlanChange}
              />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sticky Bar with Sales Assistant */}
      {showSalesAssistant && isMobile && (
        <MobileCoverageStickyBar
          state={state}
          onNext={handleSalesAssistantNext}
          nextLabel={getNextLabel()}
          disabled={state.currentStep === 1 && !state.simulationCalculated}
          onPlanChange={handlePlanChange}
        />
      )}
    </div>
  );
};
