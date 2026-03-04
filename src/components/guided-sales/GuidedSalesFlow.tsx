import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductSelectionStep } from "./steps/ProductSelectionStep";
import { SimulationStep } from "./steps/SimulationStep";
import { FormulaSelectionStep } from "./steps/FormulaSelectionStep";
import { RecapStep } from "./steps/RecapStep";
import { SubscriptionFlow } from "./steps/SubscriptionFlow";
import { MobilePaymentStep } from "./steps/MobilePaymentStep";
import { SignatureEmissionStep } from "./steps/SignatureEmissionStep";
import { IssuanceStep } from "./steps/IssuanceStep";

import { PackObsequesSimulationStep } from "./steps/PackObsequesSimulationStep";
import { PackObsequesSubscriptionFlow } from "./steps/PackObsequesSubscriptionFlow";
import { PhaseNavigation } from "./PhaseNavigation";
import { QuotationSaveDialog } from "./QuotationSaveDialog";
import { DynamicSummaryBreadcrumb } from "./DynamicSummaryBreadcrumb";
import { SalesAssistant } from "./SalesAssistant";
import { MobileCoverageStickyBar } from "./MobileCoverageStickyBar";
import { 
  GuidedSalesState, 
  initialState, 
  SalesPhase, 
  ProductCategory, 
  SelectedProductType, 
  PackObsequesData,
  PlanTier
} from "./types";
import { ChevronLeft, Save, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateAutoPremium, convertToCalculatedPremium } from "@/utils/autoPremiumCalculator";
import { useProductCalcRule } from "@/hooks/useProductCalcRule";

import { calculatePackObsequesPremium, convertPackObsequesToCalculatedPremium } from "@/utils/packObsequesPremiumCalculator";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// Step mapping per phase
const PHASE_STEPS: Record<SalesPhase, number[]> = {
  preparation: [0, 1],     // Product Selection, Simulation (with sub-steps)
  construction: [2, 3],    // Formula Selection, Recap
  souscription: [4],       // Subscription Flow (with sub-steps)
  finalisation: [5, 6, 7], // Signature & Recap, Mobile Payment, Issuance
};

const getPhaseFromStep = (step: number, product?: SelectedProductType): SalesPhase => {
  if (product === "pack_obseques") {
    if (step <= 1) return "preparation";
    if (step === 4) return "souscription";
    return "finalisation"; // step >= 7
  }
  if (step <= 1) return "preparation";
  if (step <= 3) return "construction";
  if (step === 4) return "souscription";
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
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saveAndQuitDialogOpen, setSaveAndQuitDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Ref for sub-step back handler from child components
  const stepBackHandlerRef = useRef<(() => boolean) | null>(null);
  
  const registerBackHandler = useCallback((handler: (() => boolean) | null) => {
    stepBackHandlerRef.current = handler;
  }, []);

  // Load dynamic calc rule for current product
  const productType = state.productSelection.selectedProduct === "auto" ? "auto" : undefined;
  const { data: calcRule } = useProductCalcRule(productType);

  // Restore draft on mount if draftId is in URL
  useEffect(() => {
    const draftIdParam = searchParams.get("draftId");
    if (draftIdParam) {
      (async () => {
        const { data, error } = await supabase
          .from("quotations")
          .select("*")
          .eq("id", draftIdParam)
          .eq("is_draft", true)
          .single();
        
        if (!error && data?.draft_state) {
          const restoredState = data.draft_state as unknown as GuidedSalesState;
          setState(restoredState);
          setDraftId(draftIdParam);
          toast.success("Brouillon restauré", { description: "Reprenez votre devis là où vous l'avez laissé" });
        }
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update phase based on current step
  useEffect(() => {
    const phase = getPhaseFromStep(state.currentStep, state.productSelection.selectedProduct);
    if (phase !== state.currentPhase) {
      setState(prev => ({ ...prev, currentPhase: phase }));
    }
  }, [state.currentStep, state.currentPhase, state.productSelection.selectedProduct]);

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


  const updatePackObsequesData = useCallback((data: Partial<PackObsequesData>) => {
    setState(prev => {
      const newPackObsequesData = {
        ...prev.packObsequesData!,
        ...data
      };
      return {
        ...prev,
        packObsequesData: newPackObsequesData,
      };
    });
  }, []);

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);

    // Try dynamic engine first if a calc rule is linked
    if (calcRule?.id) {
      try {
        const params: Record<string, unknown> = {};
        // Map needs analysis fields to calc rule parameters
        const na = state.needsAnalysis as unknown as Record<string, unknown>;
        for (const p of calcRule.parameters) {
          const val = na[p.code];
          if (val !== undefined) params[p.code] = val;
        }
        // Also include any dynamicParameters
        if (state.dynamicParameters) {
          Object.assign(params, state.dynamicParameters);
        }

        const { data, error } = await supabase.functions.invoke("execute-calc-rule", {
          body: {
            calc_rule_id: calcRule.id,
            parameters: params,
            selected_formula_code: state.coverage.planTier,
          },
        });

        if (!error && data && !data.error) {
          setState(prev => ({
            ...prev,
            calcRuleId: calcRule.id,
            calculatedPremium: {
              primeNette: data.primeNette,
              fraisAccessoires: data.totalFees,
              taxes: data.totalTaxes,
              primeTTC: data.primeTTC,
              fga: 0,
              cedeao: 0,
              totalAPayer: data.totalAPayer,
              netPremium: data.primeNette,
              fees: data.totalFees,
              total: data.totalAPayer,
            },
            simulationCalculated: true,
          }));
          setIsCalculating(false);
          toast.success("Tarif calculé avec succès !");
          return;
        }
        // Fallback to static calculator on error
        console.warn("Dynamic calc failed, falling back to static:", data?.error || error);
      } catch (e) {
        console.warn("Dynamic calc error, falling back:", e);
      }
    }

    // Fallback: static calculator
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
  }, [calcRule, state.needsAnalysis, state.dynamicParameters, state.coverage.planTier]);

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

  const handleSaveQuote = useCallback(async (clientInfo?: { firstName: string; lastName: string; email: string }) => {
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
          clientInfo: {
            ...state.clientIdentification,
            ...(clientInfo ? { firstName: clientInfo.firstName, lastName: clientInfo.lastName, email: clientInfo.email } : {})
          },
          options: state.coverage.additionalOptions,
          packObsequesData: state.packObsequesData,
        })),
        is_draft: false,
        draft_state: null,
      };

      let error;
      if (draftId) {
        // Convert draft to finalized quotation
        ({ error } = await supabase.from("quotations").update(quotationData).eq("id", draftId));
        setDraftId(null);
      } else {
        ({ error } = await supabase.from("quotations").insert([quotationData]));
      }
      
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
    let targetStep = getFirstStepOfPhase(phase);
    
    // Step 0 is product selection — once past it, never navigate back to it
    if (targetStep === 0 && state.currentStep > 0) {
      targetStep = 1;
    }
    
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
    setState(prev => {
      const product = prev.productSelection.selectedProduct;
      const isLifeProduct = product === "pack_obseques";
      // Skip FormulaSelectionStep + Recap (steps 2-3) for life products
      if (prev.currentStep === 1 && isLifeProduct) {
        return { ...prev, currentStep: 4 };
      }
      // For pack_obseques, step 4 → step 7 (IssuanceStep) after internal subscription flow completes
      if (prev.currentStep === 4 && isLifeProduct) {
        return { ...prev, currentStep: 7 };
      }
      return { ...prev, currentStep: prev.currentStep + 1 };
    });
  };

  const prevStep = () => {
    // First try to go back within the current step's sub-steps
    if (stepBackHandlerRef.current && stepBackHandlerRef.current()) {
      return; // Handled internally by the child component
    }
    if (state.currentStep > 0) {
      setDirection("backward");
      setState(prev => {
        const product = prev.productSelection.selectedProduct;
        const isLifeProduct = product === "pack_obseques";
        // Skip steps 2-3 for life products (reverse of nextStep logic)
        if (prev.currentStep === 4 && isLifeProduct) {
          return { ...prev, currentStep: 1 };
        }
        // From IssuanceStep back to subscription for pack_obseques
        if (prev.currentStep === 7 && isLifeProduct) {
          return { ...prev, currentStep: 4 };
        }
        return { ...prev, currentStep: prev.currentStep - 1 };
      });
    }
  };

  const handleSaveAndQuit = async (clientInfo?: { firstName: string; lastName: string; email: string; gender?: string; birthDate?: string; phone?: string; employmentType?: string }) => {
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

      // Merge client info into state if provided
      const finalState = clientInfo
        ? {
            ...state,
            clientIdentification: {
              ...state.clientIdentification,
              firstName: clientInfo.firstName,
              lastName: clientInfo.lastName,
              email: clientInfo.email,
              ...(clientInfo.phone ? { phone: clientInfo.phone } : {}),
            },
            needsAnalysis: {
              ...state.needsAnalysis,
              ...(clientInfo.gender ? { gender: clientInfo.gender } : {}),
              ...(clientInfo.employmentType ? { employmentType: clientInfo.employmentType } : {}),
            },
          }
        : state;

      const draftData = {
        broker_id: user.id,
        lead_id: finalState.clientIdentification.linkedContactId || null,
        product_type: String(product || "auto"),
        product_name: productNames[product || "auto"] || "Assurance Auto",
        premium_amount: finalState.calculatedPremium.totalAPayer || 0,
        premium_frequency: "annuel",
        payment_status: "pending_payment",
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        coverage_details: JSON.parse(JSON.stringify({
          planTier: finalState.coverage.planTier,
          vehicleInfo: finalState.needsAnalysis,
          clientInfo: clientInfo ? {
            firstName: clientInfo.firstName,
            lastName: clientInfo.lastName,
            email: clientInfo.email,
          } : undefined,
        })),
        is_draft: true,
        current_step: finalState.currentStep,
        draft_state: JSON.parse(JSON.stringify(finalState)),
      };

      let error;
      if (draftId) {
        ({ error } = await supabase.from("quotations").update(draftData).eq("id", draftId));
      } else {
        ({ error } = await supabase.from("quotations").insert([draftData]));
      }

      if (error) {
        console.error("Error saving draft:", error);
        toast.error("Erreur lors de la sauvegarde du brouillon");
        return;
      }

      toast.success("Brouillon sauvegardé", {
        description: "Retrouvez-le dans Polices → Cotations",
      });
      navigate("/b2b/policies?tab=quotations");
    } catch (err) {
      console.error("Unexpected error saving draft:", err);
      toast.error("Erreur inattendue");
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
        goToStep(4); // SubscriptionFlow
        break;
      case "payment":
        goToStep(6); // MobilePaymentStep
        break;
    }
  };

  const handleEmit = () => {
    // Emission now handled in IssuanceStep after payment
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

  // Determine if SalesAssistant should be shown
  const isPackObseques = state.productSelection.selectedProduct === "pack_obseques";
  const showSalesAssistant = state.simulationCalculated && state.currentStep >= 1;

  const renderStep = () => {
    const product = state.productSelection.selectedProduct;

    switch (state.currentStep) {
      case 0:
        // Step 0: Product Selection
        return <ProductSelectionStep state={state} onUpdate={updateProductSelection} onNext={nextStep} />;
      
      case 1:
        // Step 1: Simulation (17 fields in 5 sub-steps) OR Vie products
        if (product === "pack_obseques") {
          return (
            <PackObsequesSimulationStep 
              state={state} 
              onUpdate={updatePackObsequesData} 
              onNext={nextStep}
              onCalculate={handlePackObsequesCalculate}
              onSaveQuote={handleSaveQuote}
              isCalculating={isCalculating}
              onRegisterBackHandler={registerBackHandler}
              initialSubStep={state.simulationSubStep}
              onSubStepChange={(s) => setState(prev => ({ ...prev, simulationSubStep: s as 1 | 2 | 3 | 4 | 5 }))}
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
            onRegisterBackHandler={registerBackHandler}
            initialSubStep={state.simulationSubStep}
            onSubStepChange={(s) => setState(prev => ({ ...prev, simulationSubStep: s as 1 | 2 | 3 | 4 | 5 }))}
          />
        );
      
      case 2:
        // Step 2: Formula Selection
        return (
          <FormulaSelectionStep 
            state={state} 
            onUpdate={updateCoverage}
            onNeedsUpdate={updateNeedsAnalysis}
            onNext={nextStep}
          />
        );
      
      case 3:
        // Step 3: Recap
        return (
          <RecapStep
            state={state}
            onSaveQuote={handleSaveQuote}
            onSubscribe={nextStep}
            onEditStep={goToStep}
          />
        );
      
      case 4:
        // Step 4: Subscription Flow (5 sub-steps) - or Pack Obsèques specific
        if (product === "pack_obseques") {
          return <PackObsequesSubscriptionFlow state={state} onUpdate={updatePackObsequesData} onNext={nextStep} initialSubStep={state.subscriptionSubStep} onSubStepChange={(s) => setState(prev => ({ ...prev, subscriptionSubStep: s as 1 | 2 | 3 | 4 | 5 | 6 }))} />;
        }
        return <SubscriptionFlow state={state} onUpdate={updateSubscription} onNext={nextStep} initialSubStep={state.subscriptionSubStep} onSubStepChange={(s) => setState(prev => ({ ...prev, subscriptionSubStep: s as 1 | 2 | 3 | 4 | 5 }))} />;
      
      case 5:
        // Step 5: Signature & Recap global
        return (
          <SignatureEmissionStep 
            state={state} 
            onUpdateBinding={updateBinding}
            onEdit={handleEdit}
            onNext={nextStep}
            onEditStep={goToStep}
          />
        );
      
      case 6:
        // Step 6: Mobile Payment
        return <MobilePaymentStep state={state} onUpdate={updateMobilePayment} onNext={nextStep} />;
      
      case 7:
        // Step 7: Issuance (documents + cross-sell)
        return <IssuanceStep state={state} onReset={resetFlow} />;
      
      default:
        return null;
    }
  };

  // Determine if we should show the breadcrumb
  const showBreadcrumb = (state.currentStep > 1 && state.productSelection.selectedProduct === "auto") || (isPackObseques && state.currentStep >= 4 && state.simulationCalculated);

  // Get the next button label based on current step
  const getNextLabel = () => {
    // Step 1: Simulation
    if (state.currentStep === 1) {
      if (isPackObseques) {
        if (state.simulationSubStep < 4) return "Suivant";
        if (state.simulationSubStep === 4) return "Calculer la prime";
        return "Souscrire"; // sub 5
      }
      // Auto
      if (state.simulationSubStep === 5) return "Voir les offres";
      return "Suivant";
    }
    // Step 4: Souscription
    if (state.currentStep === 4) {
      if (isPackObseques) {
        return state.subscriptionSubStep === 7 ? "Payer" : "Suivant";
      }
      return state.subscriptionSubStep === 5 ? "Continuer vers Signature" : "Suivant";
    }
    if (state.currentStep === 2) return "Récapitulatif";
    if (state.currentStep === 3) return "Souscrire";
    if (state.currentStep === 5) return "Paiement";
    if (state.currentStep === 6) return "Émission";
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
              productType={state.productSelection.selectedProduct}
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
                productType={state.productSelection.selectedProduct}
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

            {/* Enregistrer et quitter */}
            {state.currentStep > 0 && (
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setSaveAndQuitDialogOpen(true)}
                  className="gap-2 text-muted-foreground"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer et quitter
                </Button>
              </div>
            )}
          </div>

          {/* Save & Quit Dialog (non-blocking) */}
          <QuotationSaveDialog
            open={saveAndQuitDialogOpen}
            onOpenChange={setSaveAndQuitDialogOpen}
            mode="save"
            optional
            defaultValues={{
              lastName: state.clientIdentification.lastName || "",
              firstName: state.clientIdentification.firstName || "",
              email: state.clientIdentification.email || "",
              gender: state.needsAnalysis.gender || "",
              birthDate: "",
              phone: state.clientIdentification.phone || "",
              employmentType: state.needsAnalysis.employmentType || "",
            }}
            onConfirm={(info) => {
              handleSaveAndQuit({
                firstName: info.firstName,
                lastName: info.lastName,
                email: info.email,
                gender: info.gender,
                birthDate: info.birthDate,
                phone: info.phone,
                employmentType: info.employmentType,
              });
            }}
            onDismiss={() => {
              handleSaveAndQuit();
            }}
          />

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
