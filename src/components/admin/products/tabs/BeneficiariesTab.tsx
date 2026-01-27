import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProductFormData } from "../ProductForm";

interface BeneficiariesTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

export function BeneficiariesTab({ formData, updateField }: BeneficiariesTabProps) {
  const config = formData.beneficiaries_config || {
    enabled: true,
    max_count: 5,
    require_100_percent: true,
    min_percentage: 5,
    allowed_relationships: ["conjoint", "enfant", "parent", "autre"],
  };

  const updateConfig = (key: string, value: any) => {
    updateField("beneficiaries_config", {
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration des bénéficiaires</CardTitle>
          <CardDescription>
            Définissez les règles pour la désignation des bénéficiaires du contrat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer la gestion des bénéficiaires</Label>
              <p className="text-sm text-muted-foreground">
                Permettre au souscripteur de désigner des bénéficiaires
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig("enabled", checked)}
            />
          </div>

          {config.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="max_count">Nombre maximum de bénéficiaires</Label>
                <Input
                  id="max_count"
                  type="number"
                  min={1}
                  max={10}
                  value={config.max_count}
                  onChange={(e) => updateConfig("max_count", parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Répartition obligatoire à 100%</Label>
                  <p className="text-sm text-muted-foreground">
                    La somme des pourcentages doit être égale à 100%
                  </p>
                </div>
                <Switch
                  checked={config.require_100_percent}
                  onCheckedChange={(checked) => updateConfig("require_100_percent", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_percentage">Pourcentage minimum par bénéficiaire (%)</Label>
                <Input
                  id="min_percentage"
                  type="number"
                  min={1}
                  max={100}
                  value={config.min_percentage}
                  onChange={(e) => updateConfig("min_percentage", parseInt(e.target.value) || 1)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {config.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Relations autorisées</CardTitle>
            <CardDescription>
              Types de relations acceptées pour les bénéficiaires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["conjoint", "enfant", "parent", "frère/soeur", "autre"].map((relation) => (
                <div key={relation} className="flex items-center justify-between">
                  <Label className="capitalize">{relation}</Label>
                  <Switch
                    checked={config.allowed_relationships?.includes(relation) ?? true}
                    onCheckedChange={(checked) => {
                      const relationships = config.allowed_relationships || [];
                      if (checked) {
                        updateConfig("allowed_relationships", [...relationships, relation]);
                      } else {
                        updateConfig(
                          "allowed_relationships",
                          relationships.filter((r: string) => r !== relation)
                        );
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
