import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductFormData } from "../ProductForm";

interface CalculationRulesTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

export function CalculationRulesTab({ formData, updateField }: CalculationRulesTabProps) {
  const rules = formData.calculation_rules || {};

  const updateRules = (key: string, value: any) => {
    updateField("calculation_rules", {
      ...rules,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formule de base</CardTitle>
          <CardDescription>
            Définissez la formule de calcul de la prime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base_formula">Formule</Label>
            <Textarea
              id="base_formula"
              value={rules.base_formula || "base_premium * coefficient"}
              onChange={(e) => updateRules("base_formula", e.target.value)}
              placeholder="base_premium * coefficient"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles: base_premium, age_factor, bns_factor, duration_factor
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxes et frais</CardTitle>
          <CardDescription>
            Configurez les taxes et frais additionnels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Taux de taxe (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                value={rules.taxes?.rate ? rules.taxes.rate * 100 : 14.5}
                onChange={(e) =>
                  updateRules("taxes", {
                    ...rules.taxes,
                    rate: parseFloat(e.target.value) / 100 || 0,
                    name: rules.taxes?.name || "TVA",
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_name">Nom de la taxe</Label>
              <Input
                id="tax_name"
                value={rules.taxes?.name || "TVA"}
                onChange={(e) =>
                  updateRules("taxes", {
                    ...rules.taxes,
                    name: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accessories">Frais d'accessoires (FCFA)</Label>
              <Input
                id="accessories"
                type="number"
                value={rules.fees?.accessories || 5000}
                onChange={(e) =>
                  updateRules("fees", {
                    ...rules.fees,
                    accessories: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fga_rate">Taux FGA (%)</Label>
              <Input
                id="fga_rate"
                type="number"
                step="0.01"
                value={rules.fees?.fga ? rules.fees.fga * 100 : 2}
                onChange={(e) =>
                  updateRules("fees", {
                    ...rules.fees,
                    fga: parseFloat(e.target.value) / 100 || 0,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variables de calcul</CardTitle>
          <CardDescription>
            Définissez les coefficients et facteurs de calcul.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les variables de calcul complexes (facteurs d'âge, BNS, durée) seront configurables 
            dans une version future avec un éditeur visuel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
