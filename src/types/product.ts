/**
 * Product-related types with strict typing for coverages and calculation rules
 */

import type {
  CalculationRules,
  PricingCoefficient,
  TaxConfig,
  FeeConfig,
} from "@/components/admin/form-builder";

/**
 * Insurance product coverage configuration
 */
export interface ProductCoverage {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  minValue?: number;
  maxValue?: number;
  icon?: string;
}

/**
 * Product calculation rules aggregation
 */
export interface ProductCalculationRules {
  baseFormula?: string;
  coefficients?: PricingCoefficient[];
  taxes?: TaxConfig[];
  fees?: FeeConfig[];
}

/**
 * Insurance product configuration
 */
export interface InsuranceProduct {
  id: string;
  name: string;
  description?: string;
  category: "vie" | "non-vie";
  product_type: string;
  is_renewable: boolean;
  has_claims: boolean;
  is_active: boolean;
  image_url?: string;
  base_premium: number;
  coverages: ProductCoverage[];
  calculation_rules: ProductCalculationRules;
  beneficiaries_config?: unknown;
  payment_methods?: {
    cb?: boolean;
    wave?: boolean;
    orange_money?: boolean;
    mtn_momo?: boolean;
    bank_transfer?: boolean;
    agency?: boolean;
  };
  document_templates?: string[];
  optional_products?: string[];
  alternative_products?: string[];
  faqs?: unknown[];
  subscription_form_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Re-export calculation-related types for convenience
 */
export type {
  CalculationRules,
  PricingCoefficient,
  TaxConfig,
  FeeConfig,
} from "@/components/admin/form-builder";
