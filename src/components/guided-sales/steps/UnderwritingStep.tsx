import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle, Shield, Upload } from "lucide-react";
import { GuidedSalesState } from "../types";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
interface UnderwritingStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["underwriting"]>) => void;
  onNext: () => void;
}
type RuleStatus = "green" | "yellow" | "red";
interface UnderwritingRule {
  id: string;
  label: string;
  status: RuleStatus;
  message: string;
  requiresDocument?: boolean;
  requiresEscalation?: boolean;
}
const evaluateUnderwritingRules = (state: GuidedSalesState): UnderwritingRule[] => {
  const rules: UnderwritingRule[] = [];
  const {
    needsAnalysis,
    coverage
  } = state;

  // Règle 1: Historique sinistres
  if (needsAnalysis.hasClaimHistory) {
    rules.push({
      id: "claims_history",
      label: "Historique Sinistres",
      status: "yellow",
      message: "Sinistre(s) déclaré(s). Justificatif requis (attestation assureur précédent).",
      requiresDocument: true
    });
  } else {
    rules.push({
      id: "claims_history",
      label: "Historique Sinistres",
      status: "green",
      message: "Aucun sinistre responsable détecté sur les 36 derniers mois."
    });
  }

  // Règle 2: Valeur véhicule (blocage si > 50M FCFA)
  const vehicleVenalValue = needsAnalysis.vehicleVenalValue || 0;
  const vehicleNewValue = needsAnalysis.vehicleNewValue || 0;
  const maxValue = Math.max(vehicleVenalValue, vehicleNewValue);
  if (maxValue > 50000000) {
    rules.push({
      id: "vehicle_value",
      label: "Valeur Véhicule",
      status: "red",
      message: `Valeur ${(maxValue / 1000000).toFixed(0)}M FCFA dépasse le seuil (50M). Escalade manager requise.`,
      requiresEscalation: true
    });
  } else if (maxValue > 30000000) {
    rules.push({
      id: "vehicle_value",
      label: "Valeur Véhicule",
      status: "yellow",
      message: `Valeur ${(maxValue / 1000000).toFixed(0)}M FCFA. Photos du véhicule et carte grise requis.`,
      requiresDocument: true
    });
  } else {
    rules.push({
      id: "vehicle_value",
      label: "Valeur Véhicule",
      status: "green",
      message: "Valeur dans les limites acceptables."
    });
  }

  // Règle 3: Bonus/Malus
  const bns = needsAnalysis.bonusMalus || "";
  if (bns.startsWith("malus")) {
    const malusPercent = parseInt(bns.replace("malus_", "")) || 0;
    if (malusPercent >= 50) {
      rules.push({
        id: "bonus_malus",
        label: "Coefficient Bonus/Malus",
        status: "red",
        message: `Malus ${malusPercent}% trop élevé. Escalade manager requise.`,
        requiresEscalation: true
      });
    } else {
      rules.push({
        id: "bonus_malus",
        label: "Coefficient Bonus/Malus",
        status: "yellow",
        message: `Malus ${malusPercent}% appliqué. Relevé d'information requis.`,
        requiresDocument: true
      });
    }
  } else {
    rules.push({
      id: "bonus_malus",
      label: "Coefficient Bonus/Malus",
      status: "green",
      message: "Bonus applicable, profil favorable."
    });
  }

  // Règle 4: Usage professionnel
  if (needsAnalysis.vehicleUsage === "professionnel") {
    rules.push({
      id: "professional_usage",
      label: "Usage Professionnel",
      status: "yellow",
      message: "Usage professionnel déclaré. Justificatif d'activité requis.",
      requiresDocument: true
    });
  }

  // Règle 5: Plan Premium avec véhicule ancien (> 10 ans)
  if (coverage.planTier === "premium" && needsAnalysis.vehicleFirstCirculationDate) {
    const circDate = new Date(needsAnalysis.vehicleFirstCirculationDate);
    const vehicleAge = new Date().getFullYear() - circDate.getFullYear();
    if (vehicleAge > 10) {
      rules.push({
        id: "premium_old_vehicle",
        label: "Plan Premium / Âge Véhicule",
        status: "yellow",
        message: `Véhicule de ${vehicleAge} ans avec plan Premium. Expertise préalable recommandée.`,
        requiresDocument: true
      });
    }
  }
  return rules;
};
export const UnderwritingStep = ({
  state,
  onUpdate,
  onNext
}: UnderwritingStepProps) => {
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const rules = evaluateUnderwritingRules(state);
  const hasBlockingRule = rules.some(r => r.status === "red");
  const hasVigilanceRule = rules.some(r => r.status === "yellow");
  const pendingDocuments = rules.filter(r => r.requiresDocument && !uploadedDocs[r.id]);
  const canValidate = !hasBlockingRule && pendingDocuments.length === 0;
  const handleDocumentUpload = (ruleId: string) => {
    setUploadedDocs(prev => ({
      ...prev,
      [ruleId]: true
    }));
  };
  const getStatusIcon = (status: RuleStatus) => {
    switch (status) {
      case "green":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "yellow":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "red":
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };
  const getStatusStyles = (status: RuleStatus) => {
    switch (status) {
      case "green":
        return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800";
      case "yellow":
        return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
      case "red":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
    }
  };
  const getTitleStyles = (status: RuleStatus) => {
    switch (status) {
      case "green":
        return "text-emerald-800 dark:text-emerald-300";
      case "yellow":
        return "text-amber-800 dark:text-amber-300";
      case "red":
        return "text-red-800 dark:text-red-300";
    }
  };
  const getDescStyles = (status: RuleStatus) => {
    switch (status) {
      case "green":
        return "text-emerald-700 dark:text-emerald-400";
      case "yellow":
        return "text-amber-700 dark:text-amber-400";
      case "red":
        return "text-red-700 dark:text-red-400";
    }
  };
  return <div className="space-y-6">
      <div className="text-center">
        <div className="h-12 w-12 mx-auto rounded-lg bg-muted flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Analyse de risques</h1>
        <p className="text-muted-foreground mt-1">
          Analyse automatique des risques basée sur les informations saisies.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {rules.map(rule => <Alert key={rule.id} className={getStatusStyles(rule.status)}>
              {getStatusIcon(rule.status)}
              <AlertTitle className={`${getTitleStyles(rule.status)} font-semibold`}>
                {rule.label}
              </AlertTitle>
              <AlertDescription className={getDescStyles(rule.status)}>
                {rule.message}
                
                {rule.requiresDocument && !uploadedDocs[rule.id] && <div className="mt-3 flex items-center gap-2">
                    <Label htmlFor={`doc-${rule.id}`} className="sr-only">
                      Télécharger justificatif
                    </Label>
                    <Input id={`doc-${rule.id}`} type="file" className="max-w-xs text-xs h-8" onChange={() => handleDocumentUpload(rule.id)} />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>}
                
                {rule.requiresDocument && uploadedDocs[rule.id] && <div className="mt-2 flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Document téléchargé</span>
                  </div>}

                {rule.requiresEscalation && <div className="mt-3">
                    <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                      Demander validation manager
                    </Button>
                  </div>}
              </AlertDescription>
            </Alert>)}
        </CardContent>
      </Card>

      {/* Résumé de validation */}
      <Card className={cn("border-2", canValidate ? "border-emerald-300 bg-emerald-50/50" : hasBlockingRule ? "border-red-300 bg-red-50/50" : "border-amber-300 bg-amber-50/50")}>
        <CardContent className="pt-4 pb-4">
          {canValidate ? <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-800">Feu Vert - Passage automatique</p>
                <p className="text-sm text-emerald-700">Toutes les vérifications sont validées.</p>
              </div>
            </div> : hasBlockingRule ? <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">Blocage - Escalade requise</p>
                <p className="text-sm text-red-700">Une validation manager est nécessaire pour continuer.</p>
              </div>
            </div> : <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">Vigilance - Documents requis</p>
                <p className="text-sm text-amber-700">{pendingDocuments.length} justificatif(s) à fournir.</p>
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} size="lg" disabled={hasBlockingRule}>
          {canValidate ? "Continuer vers la signature" : hasBlockingRule ? "En attente manager" : "Continuer avec vigilance"}
        </Button>
      </div>
    </div>;
};