import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { GuidedSalesState, ProductType } from "./types";
import { useEffect, useState } from "react";

interface QuoteSummaryCardProps {
  state: GuidedSalesState;
  onNext: () => void;
  nextLabel: string;
  disabled?: boolean;
}

const productLabels: Record<ProductType, string> = {
  auto: "Assurance Auto",
  habitation: "Multirisque Habitation",
  sante: "Complémentaire Santé",
  vie: "Prévoyance Vie",
};

export const QuoteSummaryCard = ({ state, onNext, nextLabel, disabled }: QuoteSummaryCardProps) => {
  const [displayTotal, setDisplayTotal] = useState(state.calculatedPremium.total);

  // Animate number changes
  useEffect(() => {
    const target = state.calculatedPremium.total;
    const diff = target - displayTotal;
    if (Math.abs(diff) < 1) {
      setDisplayTotal(target);
      return;
    }
    const step = diff / 10;
    const timer = setTimeout(() => {
      setDisplayTotal(prev => prev + step);
    }, 20);
    return () => clearTimeout(timer);
  }, [state.calculatedPremium.total, displayTotal]);

  return (
    <Card className="sticky top-4 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
        <p className="text-xs uppercase tracking-wider text-slate-300 mb-1">Devis en cours</p>
        <h3 className="text-xl font-semibold">{productLabels[state.needsAnalysis.productType]}</h3>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Prime Annuelle</span>
          <span className="text-3xl font-bold text-foreground">
            {Math.round(displayTotal)}
            <span className="text-lg font-normal text-muted-foreground ml-1">€</span>
          </span>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cotisation Nette</span>
            <span>{state.calculatedPremium.netPremium.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxes Fiscales (33%)</span>
            <span>{state.calculatedPremium.taxes.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-primary">Frais de Gestion</span>
            <span className="text-primary">Inclus</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Taxes & Frais (estimés)</span>
          <span>{state.calculatedPremium.taxes.toFixed(2)} €</span>
        </div>

        {/* Smart Default Badge */}
        <div className="bg-slate-800 text-white rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Smart Default Activé</p>
            <p className="text-xs text-slate-300">Basé sur le profil "Famille Urbaine"</p>
          </div>
        </div>

        <Button 
          onClick={onNext} 
          className="w-full gap-2" 
          size="lg"
          disabled={disabled}
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
