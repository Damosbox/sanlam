import { useMemo } from "react";
import { ProductFormSchema } from "@/schemas/product";
import type { ProductFormData } from "@/components/admin/products/ProductForm";

export interface TabError {
  tab: string;
  fields: string[];
  messages: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  tabErrors: TabError[];
}

const fieldToTab: Record<string, string> = {
  name: "general",
  description: "general",
  category: "general",
  product_type: "general",
  base_premium: "general",
  is_renewable: "general",
  has_claims: "general",
  is_active: "general",
  image_url: "general",
  subscription_form_id: "subscription",
  coverages: "subscription",
  calculation_rules: "subscription",
  beneficiaries_config: "beneficiaries",
  payment_methods: "payment",
  document_templates: "documents",
  optional_products: "sales",
  alternative_products: "sales",
  faqs: "faqs",
};

export function useProductValidation(formData: ProductFormData): ValidationResult {
  return useMemo(() => {
    const result = ProductFormSchema.safeParse(formData);

    if (result.success) {
      return { isValid: true, errors: {}, tabErrors: [] };
    }

    const errors: Record<string, string[]> = {};
    const tabErrorsMap: Record<string, TabError> = {};

    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString() || "unknown";
      if (!errors[field]) errors[field] = [];
      errors[field].push(issue.message);

      const tab = fieldToTab[field] || "general";
      if (!tabErrorsMap[tab]) {
        tabErrorsMap[tab] = { tab, fields: [], messages: [] };
      }
      if (!tabErrorsMap[tab].fields.includes(field)) {
        tabErrorsMap[tab].fields.push(field);
      }
      tabErrorsMap[tab].messages.push(issue.message);
    }

    return {
      isValid: false,
      errors,
      tabErrors: Object.values(tabErrorsMap),
    };
  }, [formData]);
}
