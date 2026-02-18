import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calculator, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { CalcRuleParameter, CalcRuleTax, CalcRuleFee, CalcRuleFormula } from "./types";
import type { CalcRuleTableRef } from "./types";
import { formatFCFA } from "@/utils/formatCurrency";

interface CalcRuleSimulatorProps {
  ruleId?: string;
  parameters: CalcRuleParameter[];
  formulas: CalcRuleFormula[];
  taxes: CalcRuleTax[];
  fees: CalcRuleFee[];
  tablesRef: CalcRuleTableRef[];
  baseFormula: string;
}

interface SimulationResult {
  primeNette: number;
  taxes: Array<{ code: string; name: string; rate: number; amount: number }>;
  fees: Array<{ code: string; name: string; amount: number }>;
  totalTaxes: number;
  totalFees: number;
  primeTTC: number;
  totalAPayer: number;
}

export function CalcRuleSimulator({
  ruleId,
  parameters,
  formulas,
  taxes,
  fees,
  tablesRef,
  baseFormula,
}: CalcRuleSimulatorProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedFormula, setSelectedFormula] = useState<string>("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateValue = (code: string, value: string) => {
    setValues(prev => ({ ...prev, [code]: value }));
  };

  const handleSimulate = async () => {
    if (!ruleId) {
      setError("Veuillez d'abord sauvegarder la règle avant de tester.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("execute-calc-rule", {
        body: {
          calc_rule_id: ruleId,
          parameters: values,
          selected_formula_code: selectedFormula || undefined,
        },
      });

      if (fnError) {
        setError(fnError.message || "Erreur lors de l'appel");
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      setResult(data as SimulationResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (param: CalcRuleParameter) => {
    const value = values[param.code] || "";

    switch (param.type) {
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateValue(param.code, e.target.value)}
            placeholder="0"
          />
        );
      case "select":
        return (
          <Select value={value} onValueChange={(v) => updateValue(param.code, v)}>
            <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
            <SelectContent>
              {(param.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "boolean":
        return (
          <div className="flex items-center gap-2 pt-1">
            <Switch
              checked={value === "1"}
              onCheckedChange={(v) => updateValue(param.code, v ? "1" : "0")}
            />
            <span className="text-sm text-muted-foreground">{value === "1" ? "Oui" : "Non"}</span>
          </div>
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateValue(param.code, e.target.value)}
            placeholder={param.label}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Renseignez les valeurs des paramètres puis testez le calcul en temps réel.
      </p>

      {/* Formula selector */}
      {formulas.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs">Formule / Pack</Label>
          <Select value={selectedFormula} onValueChange={setSelectedFormula}>
            <SelectTrigger><SelectValue placeholder="Formule de base" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Formule de base</SelectItem>
              {formulas.map((f) => (
                <SelectItem key={f.code} value={f.code}>{f.name || f.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Dynamic parameter fields */}
      <div className="grid grid-cols-2 gap-3">
        {parameters.map((param) => (
          <div key={param.id} className="space-y-1">
            <Label className="text-xs">{param.label || param.code}</Label>
            {renderField(param)}
          </div>
        ))}
      </div>

      {parameters.length === 0 && (
        <p className="text-sm text-muted-foreground italic">Aucun paramètre défini.</p>
      )}

      <Button onClick={handleSimulate} disabled={isLoading || !ruleId} className="w-full gap-2">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
        Tester le calcul
      </Button>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Résultat du calcul</span>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Prime nette</span>
                <span className="font-mono">{formatFCFA(result.primeNette)}</span>
              </div>

              {result.taxes.map((t) => (
                <div key={t.code} className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {t.name} <Badge variant="outline" className="text-[10px] px-1">{t.rate}%</Badge>
                  </span>
                  <span className="font-mono">{formatFCFA(t.amount)}</span>
                </div>
              ))}

              {result.fees.map((f) => (
                <div key={f.code} className="flex justify-between text-muted-foreground">
                  <span>{f.name}</span>
                  <span className="font-mono">{formatFCFA(f.amount)}</span>
                </div>
              ))}

              <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                <span>Total à payer</span>
                <span className="font-mono text-primary">{formatFCFA(result.totalAPayer)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
