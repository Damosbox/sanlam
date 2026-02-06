import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import type { ProductCalculationRules } from "@/types/product";

interface CalculationRulesDisplayProps {
  rules: ProductCalculationRules | null | undefined;
  onEdit?: () => void;
}

export function CalculationRulesDisplay({ rules, onEdit }: CalculationRulesDisplayProps) {
  if (!rules || Object.keys(rules).length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Aucune règle de calcul configurée</p>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="mt-4">
              <Edit2 className="h-4 w-4 mr-2" />
              Ajouter des règles
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formule de base */}
      {rules.baseFormula && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formule de base</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="block bg-muted p-3 rounded text-xs overflow-x-auto border border-border">
              {rules.baseFormula}
            </code>
          </CardContent>
        </Card>
      )}

      {/* Coefficients */}
      {rules.coefficients && rules.coefficients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coefficients ({rules.coefficients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rules.coefficients.map((coeff) => (
                <li key={coeff.id} className="text-sm border-l-2 border-primary pl-3">
                  <div className="font-medium">{coeff.name}</div>
                  {coeff.description && (
                    <div className="text-xs text-muted-foreground">{coeff.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {coeff.brackets.length} tranches
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Taxes */}
      {rules.taxes && rules.taxes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {rules.taxes.map((tax) => (
                <Badge key={tax.id} variant="secondary">
                  {tax.name}: {tax.rate.toFixed(1)}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frais */}
      {rules.fees && rules.fees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Frais ({rules.fees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rules.fees.map((fee) => (
                <li key={fee.id} className="text-sm flex items-center justify-between">
                  <span className="font-medium">{fee.name}</span>
                  <Badge variant="outline">{fee.amount}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {onEdit && (
        <Button onClick={onEdit} className="w-full">
          <Edit2 className="h-4 w-4 mr-2" />
          Éditer les règles
        </Button>
      )}
    </div>
  );
}
