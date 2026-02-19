import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Save, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { GeneralInfoTab } from "./tabs/GeneralInfoTab";
import { FormsTab } from "./tabs/FormsTab";
import { BeneficiariesTab } from "./tabs/BeneficiariesTab";
import { PaymentMethodsTab } from "./tabs/PaymentMethodsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { SalesTab } from "./tabs/SalesTab";
import { FaqsTab } from "./tabs/FaqsTab";
import { DiscountsTab } from "./tabs/DiscountsTab";
import { QuestionnairesTab } from "./tabs/QuestionnairesTab";
import { ClaimsConfigTab } from "./tabs/ClaimsConfigTab";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { ProductFormSchema } from "@/schemas/product";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductFormProps {
  product: any | null;
  isNew: boolean;
}

export interface ProductFormData {
  productId?: string;
  name: string;
  description: string;
  category: string;
  product_type: string;
  is_renewable: boolean;
  has_claims: boolean;
  is_active: boolean;
  image_url: string;
  base_premium: number;
  coverages: any;
  calculation_rules: any;
  beneficiaries_config: any;
  payment_methods: any;
  document_templates: any[];
  optional_products: string[];
  alternative_products: string[];
  faqs: any[];
  subscription_form_id: string | null;
  channels: { b2b: boolean; b2c: boolean };
  periodicity: string[];
  discounts_enabled: boolean;
  medical_questionnaire_enabled: boolean;
  beneficiaries_enabled: boolean;
  claims_config: any;
  discounts: any[];
  questionnaires: any[];
}

const defaultFormData: ProductFormData = {
  productId: undefined,
  name: "",
  description: "",
  category: "non-vie",
  product_type: "",
  is_renewable: false,
  has_claims: true,
  is_active: false,
  image_url: "",
  base_premium: 0,
  coverages: [],
  calculation_rules: {},
  beneficiaries_config: null,
  payment_methods: {
    cb: true,
    wave: true,
    orange_money: true,
    mtn_momo: true,
    bank_transfer: true,
    agency: true,
  },
  document_templates: [],
  optional_products: [],
  alternative_products: [],
  faqs: [],
  subscription_form_id: null,
  channels: { b2b: true, b2c: false },
  periodicity: [],
  discounts_enabled: false,
  medical_questionnaire_enabled: false,
  beneficiaries_enabled: false,
  claims_config: {},
  discounts: [],
  questionnaires: [],
};

interface StepDef {
  id: string;
  label: string;
  condition?: (data: ProductFormData) => boolean;
}

const ALL_STEPS: StepDef[] = [
  { id: "general", label: "Informations" },
  { id: "forms", label: "Formulaires" },
  { id: "payment", label: "Paiement" },
  { id: "documents", label: "Documents" },
  { id: "sales", label: "Ventes croisées" },
  { id: "faqs", label: "FAQs" },
  { id: "discounts", label: "Réductions", condition: (d) => d.discounts_enabled },
  { id: "questionnaires", label: "Questionnaires", condition: (d) => d.medical_questionnaire_enabled },
  { id: "claims-config", label: "Sinistres", condition: (d) => d.has_claims },
  { id: "beneficiaries", label: "Bénéficiaires", condition: (d) => d.category === "vie" },
];

export function ProductForm({ product, isNew }: ProductFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (product) {
      return {
        productId: product.id,
        name: product.name || "",
        description: product.description || "",
        category: product.category || "non-vie",
        product_type: product.product_type || "",
        is_renewable: product.is_renewable || false,
        has_claims: product.has_claims ?? true,
        is_active: product.is_active ?? false,
        image_url: product.image_url || "",
        base_premium: product.base_premium || 0,
        coverages: product.coverages || {},
        calculation_rules: product.calculation_rules || {},
        beneficiaries_config: product.beneficiaries_config,
        payment_methods: product.payment_methods || defaultFormData.payment_methods,
        document_templates: product.document_templates || [],
        optional_products: product.optional_products || [],
        alternative_products: product.alternative_products || [],
        faqs: product.faqs || [],
        subscription_form_id: product.subscription_form_id,
        channels: product.channels || { b2b: true, b2c: false },
        periodicity: product.periodicity || [],
        discounts_enabled: product.discounts_enabled ?? false,
        medical_questionnaire_enabled: product.medical_questionnaire_enabled ?? false,
        beneficiaries_enabled: product.beneficiaries_enabled ?? false,
        claims_config: product.claims_config || {},
        discounts: product.discounts || [],
        questionnaires: product.questionnaires || [],
      };
    }
    return defaultFormData;
  });

  const { isDirty, checkDirty, markClean } = useUnsavedChanges(formData);

  const activeSteps = ALL_STEPS.filter((s) => !s.condition || s.condition(formData));

  const updateField = useCallback(<K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      setTimeout(() => checkDirty(next), 0);
      return next;
    });
  }, [checkDirty]);

  // Intercept browser back
  useEffect(() => {
    if (!isDirty) return;
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
      setShowLeaveDialog(true);
      setPendingNavigation("back");
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  const handleLeaveConfirm = () => {
    markClean();
    setShowLeaveDialog(false);
    if (pendingNavigation === "back") {
      navigate(-1);
    } else if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = {
        name: data.name,
        description: data.description,
        category: data.category,
        product_type: data.product_type,
        is_renewable: data.is_renewable,
        has_claims: data.has_claims,
        is_active: data.is_active,
        image_url: data.image_url || null,
        base_premium: data.base_premium,
        coverages: data.coverages,
        calculation_rules: data.calculation_rules,
        beneficiaries_config: data.beneficiaries_config,
        payment_methods: data.payment_methods,
        document_templates: data.document_templates,
        optional_products: data.optional_products,
        alternative_products: data.alternative_products,
        faqs: data.faqs,
        subscription_form_id: data.subscription_form_id,
        channels: data.channels,
        periodicity: data.periodicity,
        discounts_enabled: data.discounts_enabled,
        medical_questionnaire_enabled: data.medical_questionnaire_enabled,
        beneficiaries_enabled: data.beneficiaries_enabled,
        claims_config: data.claims_config,
        discounts: data.discounts,
        questionnaires: data.questionnaires,
      };

      if (!data.productId) {
        const { data: inserted, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        return inserted.id as string;
      } else {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", data.productId);
        if (error) throw error;
        return data.productId;
      }
    },
    onSuccess: (productId) => {
      markClean();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });

      // Update local state with productId if it was a creation
      if (!formData.productId) {
        setFormData((prev) => ({ ...prev, productId }));
      }

      const isLastStep = currentStep === activeSteps.length - 1;
      if (isLastStep) {
        toast({ title: "Produit enregistré avec succès !" });
        navigate("/admin/products");
      } else {
        toast({ title: "Étape enregistrée" });
        setCurrentStep((s) => s + 1);
      }
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    },
  });

  const handleSaveStep = () => {
    // For step 0 (general), validate required fields
    if (currentStep === 0) {
      if (!formData.name || !formData.product_type) {
        toast({
          title: "Formulaire incomplet",
          description: "Le nom et le type de produit sont requis.",
          variant: "destructive",
        });
        return;
      }
    }
    saveMutation.mutate(formData);
  };

  const canGoToStep = (stepIndex: number) => {
    // Can always go back
    if (stepIndex < currentStep) return true;
    // Must have productId to go beyond step 0
    if (stepIndex > 0 && !formData.productId) return false;
    return true;
  };

  const currentStepDef = activeSteps[currentStep];
  const isLastStep = currentStep === activeSteps.length - 1;

  const renderStepContent = () => {
    switch (currentStepDef?.id) {
      case "general":
        return <GeneralInfoTab formData={formData} updateField={updateField} errors={{}} />;
      case "forms":
        return (
          <FormsTab
            productId={formData.productId}
            productCategory={formData.category}
            productType={formData.product_type}
            productName={formData.name}
          />
        );
      case "payment":
        return <PaymentMethodsTab formData={formData} updateField={updateField} />;
      case "documents":
        return <DocumentsTab formData={formData} updateField={updateField} />;
      case "sales":
        return <SalesTab formData={formData} updateField={updateField} />;
      case "faqs":
        return <FaqsTab formData={formData} updateField={updateField} />;
      case "discounts":
        return <DiscountsTab formData={formData} updateField={updateField} />;
      case "questionnaires":
        return <QuestionnairesTab formData={formData} updateField={updateField} />;
      case "claims-config":
        return <ClaimsConfigTab formData={formData} updateField={updateField} />;
      case "beneficiaries":
        return <BeneficiariesTab formData={formData} updateField={updateField} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper navigation */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 pt-2 -mx-1 px-1">
        {/* Step indicators */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {activeSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isClickable = canGoToStep(index);

            return (
              <button
                key={step.id}
                onClick={() => isClickable && setCurrentStep(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-primary/10 text-primary",
                  !isActive && !isCompleted && isClickable && "text-muted-foreground hover:bg-muted",
                  !isClickable && "text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                    isActive && "bg-primary-foreground text-primary",
                    isCompleted && "bg-primary text-primary-foreground",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {step.label}
              </button>
            );
          })}
        </div>

        {/* Unsaved indicator */}
        {isDirty && (
          <span className="text-xs text-amber-600 flex items-center gap-1 mt-1">
            <AlertTriangle className="h-3 w-3" />
            Modifications non enregistrées
          </span>
        )}
      </div>

      {/* Step content */}
      <div className="mt-4">
        {renderStepContent()}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>

        <Button onClick={handleSaveStep} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLastStep ? "Enregistrer & Terminer" : "Enregistrer & Continuer"}
          {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>

      {/* Unsaved changes dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter sans sauvegarder ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rester</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Quitter sans sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
