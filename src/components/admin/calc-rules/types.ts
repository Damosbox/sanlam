export interface CalcRuleParameter {
  id: string;
  code: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "boolean";
  options?: string[];
  required?: boolean;
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
  tables_ref: unknown[];
  base_formula: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
