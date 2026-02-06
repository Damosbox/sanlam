import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Plus } from "lucide-react";
import { ProductFormData } from "../ProductForm";
import { CalculationRulesDisplay } from "../CalculationRulesDisplay";

interface CalculationRulesTabProps {
  formData: ProductFormData;
  onOpenFormBuilder?: () => void;
}

export function CalculationRulesTab({ formData, onOpenFormBuilder }: CalculationRulesTabProps) {
  const hasFormula = formData.calculation_rules && Object.keys(formData.calculation_rules).length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Règles de calcul</CardTitle>
          <CardDescription>
            Les règles de calcul sont définies dans le formulaire de souscription lié au produit.
            {!hasFormula && " Créez d'abord un formulaire avec des règles de calcul."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasFormula ? (
            <>
              <CalculationRulesDisplay 
                rules={formData.calculation_rules}
                onEdit={onOpenFormBuilder}
              />
            </>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Aucune règle de calcul configurée
              </p>
              <Button 
                onClick={onOpenFormBuilder}
                disabled={!onOpenFormBuilder}
                className="inline-flex"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un formulaire avec règles
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">💡 Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Les règles de calcul font partie intégrante du formulaire de souscription. Pour configurer ou modifier les règles :
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Accédez à l'onglet <strong>Souscription</strong></li>
            <li>Cliquez sur <strong>Modifier le formulaire</strong></li>
            <li>Dans la phase <strong>Cotation</strong>, éditez la sous-étape <strong>Règles de calcul</strong></li>
            <li>Configurez la formule, les coefficients, les taxes et frais</li>
            <li>Sauvegardez le formulaire</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
