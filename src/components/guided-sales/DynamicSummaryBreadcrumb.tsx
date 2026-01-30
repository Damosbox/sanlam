import { Badge } from "@/components/ui/badge";
import { Car, User, Calendar, Banknote } from "lucide-react";
import { GuidedSalesState } from "./types";
import { formatFCFA } from "@/utils/formatCurrency";

interface DynamicSummaryBreadcrumbProps {
  state: GuidedSalesState;
}

export const DynamicSummaryBreadcrumb = ({ state }: DynamicSummaryBreadcrumbProps) => {
  const { needsAnalysis, coverage, simulationCalculated, calculatedPremium } = state;

  const items: { icon: React.ReactNode; label: string; value: string }[] = [];

  // Véhicule
  if (needsAnalysis.vehicleBrand) {
    items.push({
      icon: <Car className="h-3 w-3" />,
      label: "Véhicule",
      value: `${needsAnalysis.vehicleBrand} ${needsAnalysis.vehicleModel || ""}`.trim(),
    });
  }

  // Puissance fiscale
  if (needsAnalysis.vehicleFiscalPower) {
    items.push({
      icon: null,
      label: "CV",
      value: `${needsAnalysis.vehicleFiscalPower} CV`,
    });
  }

  // Énergie
  if (needsAnalysis.vehicleEnergy) {
    const energyLabels: Record<string, string> = {
      essence: "Essence",
      gasoil: "Gasoil",
      hybride: "Hybride",
      electrique: "Électrique",
    };
    items.push({
      icon: null,
      label: "Énergie",
      value: energyLabels[needsAnalysis.vehicleEnergy] || needsAnalysis.vehicleEnergy,
    });
  }

  // Valeur vénale
  if (needsAnalysis.vehicleVenalValue) {
    items.push({
      icon: <Banknote className="h-3 w-3" />,
      label: "Valeur",
      value: formatFCFA(needsAnalysis.vehicleVenalValue),
    });
  }

  // Date d'effet
  if (needsAnalysis.effectiveDate) {
    const date = new Date(needsAnalysis.effectiveDate);
    items.push({
      icon: <Calendar className="h-3 w-3" />,
      label: "Effet",
      value: date.toLocaleDateString("fr-FR"),
    });
  }

  // Prime (si calculée)
  if (simulationCalculated) {
    items.push({
      icon: null,
      label: "Prime",
      value: formatFCFA(calculatedPremium.totalAPayer),
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap py-2 px-4 bg-muted/50 rounded-lg border">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <Badge variant="secondary" className="gap-1 text-xs font-normal">
            {item.icon}
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-medium">{item.value}</span>
          </Badge>
          {index < items.length - 1 && (
            <span className="text-muted-foreground">•</span>
          )}
        </div>
      ))}
    </div>
  );
};
