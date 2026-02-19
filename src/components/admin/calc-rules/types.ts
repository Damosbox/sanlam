export interface CalcRuleParameter {
  id: string;
  code: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "boolean";
  options?: string[];
  required?: boolean;
  source?: "manual" | "catalogue";
  variable_id?: string;
  category?: string;
  value?: string;
  valueType?: number;
}

export interface CalcRuleGuarantee {
  id: string;
  code: string;
  label: string;
  limit?: number;
  waitingPeriodDays?: number;
  isRequired?: boolean;
}

export interface CalcRuleFormula {
  id: string;
  code: string;
  name: string;
  guarantees: CalcRuleGuarantee[];
  formula?: string;
}

export interface CalcRuleTax {
  id: string;
  code: string;
  name: string;
  rate: number;
  isActive: boolean;
}

export interface CalcRuleFee {
  id: string;
  code: string;
  name: string;
  amount: number;
  condition?: string;
}

export interface CalcRuleTableRef {
  id: string;
  code: string;
  name: string;
  type: "key_value" | "brackets";
  data: Record<string, number> | Array<{ min: number; max: number; value: number }>;
}

export interface CalcRuleOption {
  id: string;
  code: string;
  name: string;
  description: string;
  parameters: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CalcRulePackage {
  id: string;
  code: string;
  name: string;
  description: string;
  configuration: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CalcRuleCharge {
  id: string;
  code: string;
  name: string;
  description: string;
  value: string;
  category: string;
  displayOrder: number;
}

export interface CalcRule {
  id: string;
  name: string;
  description: string | null;
  type: string;
  usage_category: string;
  usage_category_label: string | null;
  parameters: CalcRuleParameter[];
  formulas: CalcRuleFormula[];
  rules: Record<string, unknown>;
  taxes: CalcRuleTax[];
  fees: CalcRuleFee[];
  tables_ref: CalcRuleTableRef[];
  base_formula: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  options: CalcRuleOption[];
  packages: CalcRulePackage[];
  charges: CalcRuleCharge[];
}
