import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, FileText, Shield } from "lucide-react";
import { GuidedSalesState } from "../types";

interface UnderwritingStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["underwriting"]>) => void;
}

export const UnderwritingStep = ({ state, onUpdate }: UnderwritingStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-12 w-12 mx-auto rounded-lg bg-muted flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Vérification Technique (Underwriting)</h1>
        <p className="text-muted-foreground mt-1">
          Analyse automatique des risques en cours...
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Success Check */}
          <Alert className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <AlertTitle className="text-emerald-800 dark:text-emerald-300 font-semibold">
              Historique Sinistres
            </AlertTitle>
            <AlertDescription className="text-emerald-700 dark:text-emerald-400">
              Aucun sinistre responsable détecté sur les 36 derniers mois.
            </AlertDescription>
          </Alert>

          {/* Optional Check */}
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-muted-foreground">Score Crédit (Optionnel)</p>
              <p className="text-sm text-muted-foreground/70">
                Vérification ignorée pour ce produit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="secondary" size="lg" className="px-8">
          Valider le Risque
        </Button>
      </div>
    </div>
  );
};
