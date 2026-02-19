import { z } from "zod";
import type { ProductCalculationRules } from "@/types/product";

// Schéma pour les coefficients avec tranches
const CoefficientBracketSchema = z.object({
  id: z.string(),
  min: z.number().min(0),
  max: z.number().min(0),
  value: z.number(),
  label: z.string().optional(),
});

const PricingCoefficientSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  brackets: z.array(CoefficientBracketSchema),
});

// Schéma pour les taxes
const TaxConfigSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  rate: z.number().min(0).max(100),
  isActive: z.boolean(),
});

// Schéma pour les frais
const FeeConfigSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().min(0),
  condition: z.string().optional(),
});

// Schéma pour les règles de calcul
export const CalculationRulesSchema = z.object({
  baseFormula: z.string().optional().default(""),
  coefficients: z.array(PricingCoefficientSchema).optional().default([]),
  taxes: z.array(TaxConfigSchema).optional().default([]),
  fees: z.array(FeeConfigSchema).optional().default([]),
  variables: z.array(z.string()).optional().default([]),
  testData: z.record(z.unknown()).optional(),
});

// Schéma pour les couvertures
export const ProductCoverageSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
});

// Schéma pour les méthodes de paiement
const PaymentMethodsSchema = z.object({
  cb: z.boolean().optional(),
  wave: z.boolean().optional(),
  orange_money: z.boolean().optional(),
  mtn_momo: z.boolean().optional(),
  bank_transfer: z.boolean().optional(),
  agency: z.boolean().optional(),
});

// Schéma principal pour ProductFormData
export const ProductFormSchema = z.object({
  productId: z.string().optional(),
  name: z
    .string()
    .min(1, "Le nom du produit est requis")
    .max(100, "Le nom ne doit pas dépasser 100 caractères"),
  description: z.string().optional().default(""),
  category: z.enum(["vie", "non-vie"], {
    errorMap: () => ({ message: "La catégorie doit être 'vie' ou 'non-vie'" }),
  }),
  product_type: z.string().min(1, "Le type de produit est requis"),
  is_renewable: z.boolean().optional().default(false),
  has_claims: z.boolean().optional().default(true),
  is_active: z.boolean().optional().default(false),
  image_url: z.string().url().optional().or(z.literal("")),
  base_premium: z.number().optional().default(0),
  coverages: z.any().optional(), // Json format
  calculation_rules: z.any().optional(), // Json format
  beneficiaries_config: z.any().optional(),
  payment_methods: PaymentMethodsSchema.optional(),
  document_templates: z.array(z.any()).optional().default([]),
  optional_products: z.array(z.string()).optional().default([]),
  alternative_products: z.array(z.string()).optional().default([]),
  faqs: z.array(z.any()).optional().default([]),
  subscription_form_id: z.string().uuid().nullable().optional().default(null),
});

export type ProductFormSchemaType = z.infer<typeof ProductFormSchema>;
