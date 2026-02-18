import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CalcRule, CalcRuleParameter, CalcRuleFormula, CalcRuleTax, CalcRuleFee, CalcRuleTableRef } from "@/components/admin/calc-rules/types";

export function useProductCalcRule(productType: string | undefined) {
  return useQuery({
    queryKey: ["product-calc-rule", productType],
    enabled: !!productType,
    queryFn: async (): Promise<CalcRule | null> => {
      // 1. Find the product by type
      const { data: products } = await supabase
        .from("products" as never)
        .select("id")
        .eq("type", productType!)
        .eq("is_active", true)
        .limit(1);

      if (!products?.length) return null;
      const productId = (products[0] as { id: string }).id;

      // 2. Find the primary calc rule link
      const { data: links } = await supabase
        .from("product_calc_rules" as never)
        .select("calc_rule_id")
        .eq("product_id", productId)
        .eq("is_primary", true)
        .limit(1);

      if (!links?.length) return null;

      // 3. Load the calc rule
      const { data: rule } = await supabase
        .from("calculation_rules")
        .select("*")
        .eq("id", (links[0] as { calc_rule_id: string }).calc_rule_id)
        .eq("is_active", true)
        .single();

      if (!rule) return null;

      return {
        ...rule,
        parameters: rule.parameters as unknown as CalcRuleParameter[],
        formulas: rule.formulas as unknown as CalcRuleFormula[],
        taxes: rule.taxes as unknown as CalcRuleTax[],
        fees: rule.fees as unknown as CalcRuleFee[],
        tables_ref: rule.tables_ref as unknown as CalcRuleTableRef[],
        rules: rule.rules as Record<string, unknown>,
      } as CalcRule;
    },
  });
}
