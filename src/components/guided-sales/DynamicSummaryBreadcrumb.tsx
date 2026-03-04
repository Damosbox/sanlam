import { Badge } from "@/components/ui/badge";
import { Car, User, Calendar, Banknote, Shield } from "lucide-react";
import { GuidedSalesState } from "./types";
import { formatFCFA } from "@/utils/formatCurrency";
import { getPeriodicPremium, calculatePackObsequesPremium } from "@/utils/packObsequesPremiumCalculator";

interface DynamicSummaryBreadcrumbProps {
  state: GuidedSalesState;
}

export const DynamicSummaryBreadcrumb = ({ state }: DynamicSummaryBreadcrumbProps) => {
  const { needsAnalysis, coverage, simulationCalculated, calculatedPremium, productSelection, packObsequesData } = state;

  const items: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (productSelection.selectedProduct === "pack_obseques" && packObsequesData) {
    // Pack Obsèques breadcrumb
    const formulaLabels: Record<string, string> = { bronze: "Bronze", argent: "Argent", or: "Or" };
    const adhesionLabels: Record<string, string> = { individuelle: "Individuelle", famille: "Famille", famille_ascendant: "Famille + Ascendant" };
    const periodicityLabels: Record<string, string> = { mensuelle: "Mensuelle", trimestrielle: "Trimestrielle", semestrielle: "Semestrielle", annuelle: "Annuelle" };

    items.push({
      icon: <Shield className="h-3 w-3" />,
      label: "Formule",
      value: formulaLabels[packObsequesData.formula] || packObsequesData.formula,
    });

    items.push({
      icon: null,
      label: "Adhésion",
      value: adhesionLabels[packObsequesData.adhesionType] || packObsequesData.adhesionType,
    });

    items.push({
      icon: null,
      label: "Périodicité",
      value: periodicityLabels[packObsequesData.periodicity] || packObsequesData.periodicity,
    });

    if (simulationCalculated) {
      const breakdown = calculatePackObsequesPremium(packObsequesData);
      const periodicPremium = getPeriodicPremium(breakdown.primeTotale, packObsequesData.periodicity);
      items.push({
        icon: <Banknote className="h-3 w-3" />,
        label: "Prime",
        value: formatFCFA(periodicPremium),
      });
    }

    if (packObsequesData.firstName || packObsequesData.lastName) {
      items.push({
        icon: <User className="h-3 w-3" />,
        label: "Assuré",
        value: `${packObsequesData.firstName} ${packObsequesData.lastName}`.trim(),
      });
    }
  } else {
    // Auto breadcrumb
    if (needsAnalysis.vehicleBrand) {
      items.push({
        icon: <Car className="h-3 w-3" />,
        label: "Véhicule",
        value: `${needsAnalysis.vehicleBrand} ${needsAnalysis.vehicleModel || ""}`.trim(),
      });
    }

    if (needsAnalysis.vehicleFiscalPower) {
      items.push({ icon: null, label: "CV", value: `${needsAnalysis.vehicleFiscalPower} CV` });
    }

    if (needsAnalysis.vehicleEnergy) {
      const energyLabels: Record<string, string> = { essence: "Essence", gasoil: "Gasoil", hybride: "Hybride", electrique: "Électrique" };
      items.push({ icon: null, label: "Énergie", value: energyLabels[needsAnalysis.vehicleEnergy] || needsAnalysis.vehicleEnergy });
    }

    if (needsAnalysis.vehicleVenalValue) {
      items.push({ icon: <Banknote className="h-3 w-3" />, label: "Valeur", value: formatFCFA(needsAnalysis.vehicleVenalValue) });
    }

    if (needsAnalysis.effectiveDate) {
      const date = new Date(needsAnalysis.effectiveDate);
      items.push({ icon: <Calendar className="h-3 w-3" />, label: "Effet", value: date.toLocaleDateString("fr-FR") });
    }

    if (simulationCalculated) {
      items.push({ icon: null, label: "Prime", value: formatFCFA(calculatedPremium.totalAPayer) });
    }
  }

  if (items.length === 0) return null;

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
