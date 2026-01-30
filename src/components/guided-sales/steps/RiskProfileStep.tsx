import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Shield, User, AlertTriangle, MapPin } from "lucide-react";
import { GuidedSalesState, GenderType, EmploymentType } from "../types";
import { formatFCFA } from "@/utils/formatCurrency";

interface RiskProfileStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["needsAnalysis"]>) => void;
  onCalculate: () => void;
  isCalculating?: boolean;
}

const employmentOptions: { value: EmploymentType; label: string }[] = [
  { value: "fonctionnaire", label: "Fonctionnaire" },
  { value: "salarie", label: "Salarié" },
  { value: "exploitant_agricole", label: "Exploitant agricole" },
  { value: "artisan", label: "Artisan" },
  { value: "religieux", label: "Religieux" },
  { value: "retraite", label: "Retraité" },
  { value: "sans_profession", label: "Sans profession" },
  { value: "agent_commercial", label: "Agent commercial" },
  { value: "autres", label: "Autres catégories socioprofessionnelles" },
];

export const RiskProfileStep = ({ 
  state, 
  onUpdate, 
  onCalculate,
  isCalculating = false 
}: RiskProfileStepProps) => {
  const { needsAnalysis, simulationCalculated, calculatedPremium } = state;

  const isValid = () => {
    return (
      needsAnalysis.gender &&
      needsAnalysis.employmentType &&
      needsAnalysis.hasAccident36Months !== undefined &&
      needsAnalysis.hasGPSProtection !== undefined
    );
  };

  // Verify Phase 1 (Vehicle) is complete
  const isPhase1VehicleComplete = () => {
    return (
      needsAnalysis.quoteType &&
      needsAnalysis.isVTC !== undefined &&
      needsAnalysis.belongsToCompany !== undefined &&
      needsAnalysis.vehicleBrand &&
      needsAnalysis.vehicleModel &&
      needsAnalysis.vehicleEnergy &&
      needsAnalysis.vehicleFiscalPower &&
      needsAnalysis.vehicleSeats &&
      needsAnalysis.vehicleNewValue &&
      needsAnalysis.vehicleVenalValue
    );
  };

  const canCalculate = isValid() && isPhase1VehicleComplete();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil Risque</h1>
        <p className="text-muted-foreground mt-1">
          Informations sur le conducteur et les antécédents
        </p>
      </div>

      {/* Genre et Emploi */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Informations personnelles</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Sexe */}
            <div>
              <Label className="text-sm font-medium">Sexe *</Label>
              <Select
                value={needsAnalysis.gender || ""}
                onValueChange={(v) => onUpdate({ gender: v as GenderType })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feminin">Féminin</SelectItem>
                  <SelectItem value="masculin">Masculin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type d'emploi */}
            <div>
              <Label className="text-sm font-medium">Type d'emploi *</Label>
              <Select
                value={needsAnalysis.employmentType || ""}
                onValueChange={(v) => onUpdate({ employmentType: v as EmploymentType })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {employmentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Antécédents */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Antécédents</h3>
          </div>
          
          <div>
            <Label className="text-sm font-medium">
              Sinistres au cours des 24 derniers mois ? *
            </Label>
            <Select
              value={needsAnalysis.hasAccident36Months === undefined ? "" : needsAnalysis.hasAccident36Months ? "oui" : "non"}
              onValueChange={(v) => onUpdate({ hasAccident36Months: v === "oui" })}
            >
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oui">Oui</SelectItem>
                <SelectItem value="non">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Équipements */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Équipements</h3>
          </div>
          
          <div>
            <Label className="text-sm font-medium">
              Véhicule équipé d'un GPS/Tracker ? *
            </Label>
            <Select
              value={needsAnalysis.hasGPSProtection === undefined ? "" : needsAnalysis.hasGPSProtection ? "oui" : "non"}
              onValueChange={(v) => onUpdate({ hasGPSProtection: v === "oui" })}
            >
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oui">Oui</SelectItem>
                <SelectItem value="non">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Résultat simulation si calculé */}
      {simulationCalculated && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-lg">Estimation de prime</h3>
            </div>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-primary">
                {formatFCFA(calculatedPremium.totalAPayer)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Prime annuelle estimée
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton Calculer */}
      <div className="flex justify-center">
        <Button 
          onClick={onCalculate} 
          disabled={!canCalculate || isCalculating}
          size="lg"
          className="gap-2 px-8"
        >
          <Calculator className="h-5 w-5" />
          {isCalculating ? "Calcul en cours..." : simulationCalculated ? "Recalculer" : "CALCULER"}
        </Button>
      </div>

      {!canCalculate && (
        <p className="text-sm text-center text-muted-foreground">
          Remplissez tous les champs obligatoires pour activer le calcul
        </p>
      )}
    </div>
  );
};
