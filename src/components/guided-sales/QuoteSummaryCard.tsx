import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { GuidedSalesState, ProductType } from "./types";
import { useEffect, useState } from "react";
import { formatFCFA, formatFCFADecimal } from "@/utils/formatCurrency";

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
  const [displayTotal, setDisplayTotal] = useState(state.calculatedPremium.totalAPayer);

  // Animate number changes
  useEffect(() => {
    const target = state.calculatedPremium.totalAPayer;
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
  }, [state.calculatedPremium.totalAPayer, displayTotal]);

  const premium = state.calculatedPremium;

  return (
    <Card className="sticky top-20 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 sm:p-6">
        <p className="text-xs uppercase tracking-wider text-slate-300 mb-1">Devis en cours</p>
        <h3 className="text-lg sm:text-xl font-semibold">{productLabels[state.needsAnalysis.productType]}</h3>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Prime Totale à payer - En haut et en gras */}
        <div className="flex items-baseline justify-between bg-primary/10 rounded-lg p-3 -mx-1">
          <span className="text-sm font-semibold text-foreground">Prime Totale à payer</span>
          <span className="text-xl sm:text-2xl font-bold text-primary">
            {formatFCFA(displayTotal)}
          </span>
        </div>

        <Separator />

        {/* Décompte détaillé */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prime Nette</span>
            <span>{formatFCFADecimal(premium.primeNette)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frais d'accessoires</span>
            <span>{formatFCFADecimal(premium.fraisAccessoires)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxes (14%)</span>
            <span>{formatFCFADecimal(premium.taxes)}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-medium">
            <span className="text-foreground">Prime TTC</span>
            <span>{formatFCFADecimal(premium.primeTTC)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">FGA (Fond de Garantie Auto)</span>
            <span>{formatFCFADecimal(premium.fga)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Carte Brune CEDEAO</span>
            <span>{formatFCFADecimal(premium.cedeao)}</span>
          </div>
        </div>

        <Separator />

        {/* Smart Default Badge */}
        <div className="bg-slate-800 text-white rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Smart Default Activé</p>
            <p className="text-xs text-slate-300">Basé sur le profil "Famille Urbaine"</p>
          </div>
        </div>

        {/* CTA Button - Full Width */}
        <Button 
          onClick={onNext} 
          className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200" 
          size="lg"
          disabled={disabled}
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Button>
      </div>
    </Card>
  );
};
