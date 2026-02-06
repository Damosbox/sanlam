import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { GeneralInfoTab } from "./tabs/GeneralInfoTab";
import { SubscriptionFieldsTab } from "./tabs/SubscriptionFieldsTab";
import { BeneficiariesTab } from "./tabs/BeneficiariesTab";
import { PaymentMethodsTab } from "./tabs/PaymentMethodsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { SalesTab } from "./tabs/SalesTab";
import { FaqsTab } from "./tabs/FaqsTab";
import { FormEditorDrawer } from "./FormEditorDrawer";
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
  coverages: any; // Json format for Supabase
  calculation_rules: any; // Json format for Supabase
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
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);

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

  const updateField = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (!formData.name.trim()) {
      toast({ title: "Le nom du produit est requis", variant: "destructive" });
      return;
    }
    saveMutation.mutate(formData);
  };

  const isLifeProduct = formData.category === "vie";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 h-auto p-1">
          <TabsTrigger value="general" className="text-xs sm:text-sm">Général</TabsTrigger>
          <TabsTrigger value="subscription" className="text-xs sm:text-sm">Souscription</TabsTrigger>
          {isLifeProduct && (
            <TabsTrigger value="beneficiaries" className="text-xs sm:text-sm">Bénéf.</TabsTrigger>
          )}
          <TabsTrigger value="payment" className="text-xs sm:text-sm">Paiement</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">Docs</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs sm:text-sm">Ventes</TabsTrigger>
          <TabsTrigger value="faqs" className="text-xs sm:text-sm">FAQs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralInfoTab formData={formData} updateField={updateField} />
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

      <FormEditorDrawer
        open={formDrawerOpen}
        onOpenChange={setFormDrawerOpen}
        formId={formData.subscription_form_id}
        productCategory={formData.category}
        productType={formData.product_type}
        productName={formData.name}
        onFormSaved={(formId) => {
          updateField("subscription_form_id", formId);
          setFormDrawerOpen(false);
          toast({ title: "Formulaire sauvegardé" });
          queryClient.invalidateQueries({ queryKey: ["form-templates"] });
        }}
      />
    </div>
  );
}
