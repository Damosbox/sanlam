import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save, Loader2, AlertTriangle } from "lucide-react";
import { GeneralInfoTab } from "./tabs/GeneralInfoTab";
import { SubscriptionFieldsTab } from "./tabs/SubscriptionFieldsTab";
import { BeneficiariesTab } from "./tabs/BeneficiariesTab";
import { PaymentMethodsTab } from "./tabs/PaymentMethodsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { SalesTab } from "./tabs/SalesTab";
import { FaqsTab } from "./tabs/FaqsTab";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useProductValidation } from "@/hooks/useProductValidation";
import { ProductFormSchema } from "@/schemas/product";
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
import type { ProductCalculationRules } from "@/types/product";

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
};

export function ProductForm({ product, isNew }: ProductFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [validationTriggered, setValidationTriggered] = useState(false);

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
      };
    }
    return defaultFormData;
  });

  const { isDirty, checkDirty, markClean } = useUnsavedChanges(formData);
  const validation = useProductValidation(formData);

  const updateField = useCallback(<K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Defer dirty check
      setTimeout(() => checkDirty(next), 0);
      return next;
    });
  }, [checkDirty]);

  // Intercept browser back / route changes
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
      };

      if (isNew) {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      markClean();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: isNew ? "Produit créé" : "Produit mis à jour" });
      navigate("/admin/products");
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    },
  });

  const handleSave = () => {
    setValidationTriggered(true);
    const result = ProductFormSchema.safeParse(formData);
    if (!result.success) {
      const firstTab = validation.tabErrors[0]?.tab;
      const messages = result.error.issues.map((i) => i.message).slice(0, 3);
      toast({
        title: "Formulaire incomplet",
        description: messages.join(" • "),
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const isLifeProduct = formData.category === "vie";

  // Tab completion indicators
  const getTabStatus = (tab: string): "complete" | "warning" | "error" | null => {
    if (validationTriggered) {
      const tabErr = validation.tabErrors.find((t) => t.tab === tab);
      if (tabErr) return "error";
    }
    switch (tab) {
      case "general":
        return formData.name && formData.product_type && formData.base_premium > 0 ? "complete" : "warning";
      case "subscription":
        return formData.subscription_form_id ? "complete" : "warning";
      case "payment":
        return "complete";
      case "documents":
        return formData.document_templates?.length > 0 ? "complete" : null;
      case "faqs":
        return formData.faqs?.length > 0 ? "complete" : null;
      case "sales":
        return (formData.optional_products?.length > 0 || formData.alternative_products?.length > 0) ? "complete" : null;
      default:
        return null;
    }
  };

  const statusDot = (tab: string) => {
    const status = getTabStatus(tab);
    if (!status) return null;
    const colors: Record<string, string> = {
      complete: "bg-emerald-500",
      warning: "bg-amber-500",
      error: "bg-destructive",
    };
    return <span className={`inline-block w-2 h-2 rounded-full ml-1.5 ${colors[status]}`} />;
  };

  return (
    <div className="space-y-6">
      {/* Sticky save bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-3 pt-1 -mx-1 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Modifications non enregistrées
              </span>
            )}
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 h-auto p-1">
          <TabsTrigger value="general" className="text-xs sm:text-sm">
            Général{statusDot("general")}
          </TabsTrigger>
          <TabsTrigger value="subscription" className="text-xs sm:text-sm">
            Souscription{statusDot("subscription")}
          </TabsTrigger>
          {isLifeProduct && (
            <TabsTrigger value="beneficiaries" className="text-xs sm:text-sm">Bénéf.</TabsTrigger>
          )}
          <TabsTrigger value="payment" className="text-xs sm:text-sm">
            Paiement{statusDot("payment")}
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">
            Docs{statusDot("documents")}
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs sm:text-sm">
            Ventes{statusDot("sales")}
          </TabsTrigger>
          <TabsTrigger value="faqs" className="text-xs sm:text-sm">
            FAQs{statusDot("faqs")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralInfoTab
            formData={formData}
            updateField={updateField}
            errors={validationTriggered ? validation.errors : {}}
          />
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <SubscriptionFieldsTab formData={formData} updateField={updateField} />
        </TabsContent>

        {isLifeProduct && (
          <TabsContent value="beneficiaries" className="mt-6">
            <BeneficiariesTab formData={formData} updateField={updateField} />
          </TabsContent>
        )}

        <TabsContent value="payment" className="mt-6">
          <PaymentMethodsTab formData={formData} updateField={updateField} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab formData={formData} updateField={updateField} />
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <SalesTab formData={formData} updateField={updateField} />
        </TabsContent>

        <TabsContent value="faqs" className="mt-6">
          <FaqsTab formData={formData} updateField={updateField} />
        </TabsContent>
      </Tabs>

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
