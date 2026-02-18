import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CalcRule } from "@/components/admin/calc-rules/types";

interface CalcRulesTabProps {
  productId?: string;
}

interface LinkedRule {
  id: string;
  calc_rule_id: string;
  is_primary: boolean;
  rule?: CalcRule;
}

export function CalcRulesTab({ productId }: CalcRulesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const { data: allRules = [] } = useQuery({
    queryKey: ["calculation-rules-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculation_rules")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as unknown as CalcRule[];
    },
  });

  const { data: linkedRules = [], refetch } = useQuery({
    queryKey: ["product-calc-rules", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_calc_rules")
        .select("id, calc_rule_id, is_primary")
        .eq("product_id", productId);
      if (error) throw error;

      // Enrich with rule data
      const enriched: LinkedRule[] = [];
      for (const link of data) {
        const rule = allRules.find((r) => r.id === link.calc_rule_id);
        enriched.push({ ...link, rule: rule as CalcRule | undefined });
      }
      return enriched;
    },
    enabled: !!productId && allRules.length > 0,
  });

  const addMutation = useMutation({
    mutationFn: async (calcRuleId: string) => {
      const { error } = await supabase.from("product_calc_rules").insert({
        product_id: productId!,
        calc_rule_id: calcRuleId,
        is_primary: linkedRules.length === 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      setSelectedRuleId("");
      toast({ title: "Règle liée au produit" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("product_calc_rules").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Règle retirée" });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (linkId: string) => {
      // Unset all primaries
      await supabase
        .from("product_calc_rules")
        .update({ is_primary: false })
        .eq("product_id", productId!);
      // Set new primary
      const { error } = await supabase
        .from("product_calc_rules")
        .update({ is_primary: true })
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Règle principale mise à jour" });
    },
  });

  const availableRules = allRules.filter(
    (r) => !linkedRules.some((lr) => lr.calc_rule_id === r.id)
  );

  if (!productId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Enregistrez d'abord le produit pour pouvoir lier des règles de calcul.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Règles de calcul liées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add rule */}
          <div className="flex gap-2">
            <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sélectionner une règle à ajouter..." />
              </SelectTrigger>
              <SelectContent>
                {availableRules.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} ({r.usage_category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => selectedRuleId && addMutation.mutate(selectedRuleId)}
              disabled={!selectedRuleId || addMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-1" /> Lier
            </Button>
          </div>

          {/* Linked rules */}
          {linkedRules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune règle liée</p>
          ) : (
            <div className="space-y-3">
              {linkedRules.map((link) => (
                <div key={link.id} className="border rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPrimaryMutation.mutate(link.id)}
                        className={`p-1 rounded ${link.is_primary ? "text-amber-500" : "text-muted-foreground hover:text-amber-400"}`}
                        title={link.is_primary ? "Règle principale" : "Définir comme principale"}
                      >
                        <Star className={`h-4 w-4 ${link.is_primary ? "fill-current" : ""}`} />
                      </button>
                      <div>
                        <span className="font-medium text-sm">{link.rule?.name || "Règle inconnue"}</span>
                        {link.rule && (
                          <div className="flex gap-1 mt-0.5">
                            <Badge variant="outline" className="text-xs">{link.rule.type}</Badge>
                            <Badge variant="secondary" className="text-xs font-mono">{link.rule.usage_category}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedRule(expandedRule === link.id ? null : link.id)}
                      >
                        {expandedRule === link.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(link.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {expandedRule === link.id && link.rule && (
                    <div className="border-t px-3 py-3 bg-muted/30 text-sm space-y-2">
                      <div>
                        <span className="font-medium">Paramètres :</span>{" "}
                        {(link.rule.parameters as any[])?.map((p: any) => p.label || p.code).join(", ") || "Aucun"}
                      </div>
                      <div>
                        <span className="font-medium">Formules :</span>{" "}
                        {(link.rule.formulas as any[])?.map((f: any) => f.name || f.code).join(", ") || "Aucune"}
                      </div>
                      <div>
                        <span className="font-medium">Taxes :</span>{" "}
                        {(link.rule.taxes as any[])?.filter((t: any) => t.isActive).map((t: any) => `${t.name} (${t.rate}%)`).join(", ") || "Aucune"}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
