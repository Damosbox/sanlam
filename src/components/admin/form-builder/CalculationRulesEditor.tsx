import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Calculator,
  Variable,
  Percent,
  DollarSign,
  Play,
  Info,
} from "lucide-react";
import {
  CalculationRules,
  PricingCoefficient,
  CoefficientBracket,
  TaxConfig,
  FeeConfig,
} from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalculationRulesEditorProps {
  rules: CalculationRules;
  onChange: (rules: CalculationRules) => void;
  availableVariables?: string[];
}

export function CalculationRulesEditor({
  rules,
  onChange,
  availableVariables = [],
}: CalculationRulesEditorProps) {
  const [expandedCoefficients, setExpandedCoefficients] = useState<Set<string>>(new Set());
  const [simulationResult, setSimulationResult] = useState<number | null>(null);

  // Helper pour mettre à jour les règles
  const updateRules = (updates: Partial<CalculationRules>) => {
    onChange({ ...rules, ...updates });
  };

  // Gestion des coefficients
  const addCoefficient = () => {
    const newCoef: PricingCoefficient = {
      id: `coef_${Date.now()}`,
      code: `COEF_${rules.coefficients.length + 1}`,
      name: "Nouveau coefficient",
      brackets: [
        { id: `bracket_${Date.now()}`, min: 0, max: 100, value: 1.0 },
      ],
    };
    updateRules({ coefficients: [...rules.coefficients, newCoef] });
    setExpandedCoefficients(new Set([...expandedCoefficients, newCoef.id]));
  };

  const updateCoefficient = (coefId: string, updates: Partial<PricingCoefficient>) => {
    updateRules({
      coefficients: rules.coefficients.map((c) =>
        c.id === coefId ? { ...c, ...updates } : c
      ),
    });
  };

  const removeCoefficient = (coefId: string) => {
    updateRules({
      coefficients: rules.coefficients.filter((c) => c.id !== coefId),
    });
  };

  const addBracket = (coefId: string) => {
    const coef = rules.coefficients.find((c) => c.id === coefId);
    if (!coef) return;

    const lastBracket = coef.brackets[coef.brackets.length - 1];
    const newBracket: CoefficientBracket = {
      id: `bracket_${Date.now()}`,
      min: lastBracket ? lastBracket.max : 0,
      max: lastBracket ? lastBracket.max + 100 : 100,
      value: 1.0,
    };

    updateCoefficient(coefId, {
      brackets: [...coef.brackets, newBracket],
    });
  };

  const updateBracket = (
    coefId: string,
    bracketId: string,
    updates: Partial<CoefficientBracket>
  ) => {
    const coef = rules.coefficients.find((c) => c.id === coefId);
    if (!coef) return;

    updateCoefficient(coefId, {
      brackets: coef.brackets.map((b) =>
        b.id === bracketId ? { ...b, ...updates } : b
      ),
    });
  };

  const removeBracket = (coefId: string, bracketId: string) => {
    const coef = rules.coefficients.find((c) => c.id === coefId);
    if (!coef || coef.brackets.length <= 1) return;

    updateCoefficient(coefId, {
      brackets: coef.brackets.filter((b) => b.id !== bracketId),
    });
  };

  // Gestion des taxes
  const addTax = () => {
    const newTax: TaxConfig = {
      id: `tax_${Date.now()}`,
      code: `TAX_${rules.taxes.length + 1}`,
      name: "Nouvelle taxe",
      rate: 0,
      isActive: true,
    };
    updateRules({ taxes: [...rules.taxes, newTax] });
  };

  const updateTax = (taxId: string, updates: Partial<TaxConfig>) => {
    updateRules({
      taxes: rules.taxes.map((t) =>
        t.id === taxId ? { ...t, ...updates } : t
      ),
    });
  };

  const removeTax = (taxId: string) => {
    updateRules({
      taxes: rules.taxes.filter((t) => t.id !== taxId),
    });
  };

  // Gestion des frais
  const addFee = () => {
    const newFee: FeeConfig = {
      id: `fee_${Date.now()}`,
      code: `FEE_${rules.fees.length + 1}`,
      name: "Nouveaux frais",
      amount: 0,
    };
    updateRules({ fees: [...rules.fees, newFee] });
  };

  const updateFee = (feeId: string, updates: Partial<FeeConfig>) => {
    updateRules({
      fees: rules.fees.map((f) =>
        f.id === feeId ? { ...f, ...updates } : f
      ),
    });
  };

  const removeFee = (feeId: string) => {
    updateRules({
      fees: rules.fees.filter((f) => f.id !== feeId),
    });
  };

  // Simulation basique
  const runSimulation = () => {
    try {
      // Simulation très basique - juste pour la démo
      const baseValue = 100000; // Valeur de base fictive
      let result = baseValue;

      // Appliquer les taxes
      const totalTaxRate = rules.taxes
        .filter((t) => t.isActive)
        .reduce((sum, t) => sum + t.rate, 0);
      result = result * (1 + totalTaxRate / 100);

      // Ajouter les frais
      const totalFees = rules.fees.reduce((sum, f) => sum + f.amount, 0);
      result = result + totalFees;

      setSimulationResult(Math.round(result));
    } catch (error) {
      console.error("Simulation error:", error);
      setSimulationResult(null);
    }
  };

  const toggleCoefficient = (coefId: string) => {
    const newSet = new Set(expandedCoefficients);
    if (newSet.has(coefId)) {
      newSet.delete(coefId);
    } else {
      newSet.add(coefId);
    }
    setExpandedCoefficients(newSet);
  };

  return (
    <div className="space-y-6">
      {/* Formule de base */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" />
            Formule de calcul
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Écrivez la formule de calcul de la prime. Utilisez les
                    variables disponibles et les opérateurs mathématiques (+, -,
                    *, /).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="baseFormula">Expression de calcul</Label>
            <Textarea
              id="baseFormula"
              value={rules.baseFormula}
              onChange={(e) => updateRules({ baseFormula: e.target.value })}
              placeholder="Ex: valeurVenale * TAUX_BASE * bonusMalus + fraisAccessoires"
              className="font-mono text-sm"
              rows={3}
            />
          </div>

          {/* Variables disponibles */}
          {availableVariables.length > 0 && (
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Variable className="h-4 w-4" />
                Variables disponibles
              </Label>
              <div className="flex flex-wrap gap-1">
                {availableVariables.map((v) => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => {
                      updateRules({
                        baseFormula: rules.baseFormula
                          ? `${rules.baseFormula} ${v}`
                          : v,
                      });
                    }}
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coefficients */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-4 w-4" />
              Coefficients ({rules.coefficients.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addCoefficient}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.coefficients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun coefficient. Cliquez sur "Ajouter" pour créer un coefficient
              avec tranches.
            </p>
          ) : (
            rules.coefficients.map((coef) => (
              <Collapsible
                key={coef.id}
                open={expandedCoefficients.has(coef.id)}
                onOpenChange={() => toggleCoefficient(coef.id)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        {expandedCoefficients.has(coef.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{coef.name}</span>
                        <Badge variant="outline" className="font-mono">
                          {coef.code}
                        </Badge>
                        <Badge variant="secondary">
                          {coef.brackets.length} tranches
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCoefficient(coef.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 pt-0 space-y-4 border-t">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Nom</Label>
                          <Input
                            value={coef.name}
                            onChange={(e) =>
                              updateCoefficient(coef.id, { name: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Code</Label>
                          <Input
                            value={coef.code}
                            onChange={(e) =>
                              updateCoefficient(coef.id, {
                                code: e.target.value.toUpperCase(),
                              })
                            }
                            className="font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Tranches</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addBracket(coef.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Tranche
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {coef.brackets.map((bracket, idx) => (
                            <div
                              key={bracket.id}
                              className="flex items-center gap-2 bg-muted/30 p-2 rounded"
                            >
                              <span className="text-xs text-muted-foreground w-4">
                                {idx + 1}
                              </span>
                              <Input
                                type="number"
                                value={bracket.min}
                                onChange={(e) =>
                                  updateBracket(coef.id, bracket.id, {
                                    min: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-20 h-8 text-sm"
                                placeholder="Min"
                              />
                              <span className="text-muted-foreground">→</span>
                              <Input
                                type="number"
                                value={bracket.max}
                                onChange={(e) =>
                                  updateBracket(coef.id, bracket.id, {
                                    max: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-20 h-8 text-sm"
                                placeholder="Max"
                              />
                              <span className="text-muted-foreground">=</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={bracket.value}
                                onChange={(e) =>
                                  updateBracket(coef.id, bracket.id, {
                                    value: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-20 h-8 text-sm font-mono"
                                placeholder="Valeur"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => removeBracket(coef.id, bracket.id)}
                                disabled={coef.brackets.length <= 1}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>

      {/* Taxes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-4 w-4" />
              Taxes ({rules.taxes.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addTax}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.taxes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune taxe configurée.
            </p>
          ) : (
            <div className="space-y-2">
              {rules.taxes.map((tax) => (
                <div
                  key={tax.id}
                  className="flex items-center gap-3 p-2 border rounded"
                >
                  <Switch
                    checked={tax.isActive}
                    onCheckedChange={(checked) =>
                      updateTax(tax.id, { isActive: checked })
                    }
                  />
                  <Input
                    value={tax.name}
                    onChange={(e) => updateTax(tax.id, { name: e.target.value })}
                    className="flex-1 h-8"
                    placeholder="Nom de la taxe"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={tax.rate}
                      onChange={(e) =>
                        updateTax(tax.id, {
                          rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 h-8 text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => removeTax(tax.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frais fixes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Frais fixes ({rules.fees.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addFee}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.fees.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun frais fixe configuré.
            </p>
          ) : (
            <div className="space-y-2">
              {rules.fees.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center gap-3 p-2 border rounded"
                >
                  <Input
                    value={fee.name}
                    onChange={(e) => updateFee(fee.id, { name: e.target.value })}
                    className="flex-1 h-8"
                    placeholder="Nom des frais"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={fee.amount}
                      onChange={(e) =>
                        updateFee(fee.id, {
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-28 h-8 text-right"
                    />
                    <span className="text-muted-foreground text-sm">FCFA</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => removeFee(fee.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulateur */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Play className="h-4 w-4" />
            Simulateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={runSimulation}>
              <Play className="h-4 w-4 mr-2" />
              Tester le calcul
            </Button>
            {simulationResult !== null && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Résultat :</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {simulationResult.toLocaleString("fr-FR")} FCFA
                </Badge>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Simulation avec une valeur de base de 100 000 FCFA. Pour un test
            complet, utilisez le formulaire de cotation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
