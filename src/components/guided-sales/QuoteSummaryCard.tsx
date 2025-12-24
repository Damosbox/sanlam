import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, CheckCircle2, HelpCircle, Lightbulb } from "lucide-react";
import { GuidedSalesState, ProductType } from "./types";
import { useEffect, useState, useMemo } from "react";
import { formatFCFA, formatFCFADecimal } from "@/utils/formatCurrency";
import { toast } from "@/hooks/use-toast";

interface QuoteSummaryCardProps {
  state: GuidedSalesState;
  onNext: () => void;
  nextLabel: string;
  disabled?: boolean;
  onApplySuggestion?: (suggestion: AIRecommendation) => void;
}

const productLabels: Record<ProductType, string> = {
  auto: "Assurance Auto",
  habitation: "Multirisque Habitation",
  sante: "Complémentaire Santé",
  vie: "Prévoyance Vie",
  mrh: "Multirisque Habitation",
  assistance_voyage: "Assistance Voyage",
};

// Définitions des termes techniques pour les infobulles
const tooltips = {
  primeNette: "Prime de base calculée selon la puissance fiscale, l'usage du véhicule, le nombre de places et les garanties sélectionnées. Le coefficient bonus/malus (BNS) est appliqué.",
  fraisAccessoires: "Frais fixes de gestion et d'émission du contrat d'assurance. Ce montant couvre les coûts administratifs.",
  taxes: "Taxes fiscales obligatoires représentant 14% de la prime nette, conformément à la réglementation CIMA.",
  primeTTC: "Prime Toutes Taxes Comprises = Prime Nette + Frais d'accessoires + Taxes. C'est le montant de l'assurance avant les contributions obligatoires.",
  fga: "Le Fond de Garantie Automobile est une contribution obligatoire (2% de la prime nette, min. 5 000 FCFA) destinée à indemniser les victimes d'accidents causés par des véhicules non assurés.",
  cedeao: "La Carte Brune CEDEAO permet la circulation automobile dans tous les pays membres de la CEDEAO. Elle garantit une couverture responsabilité civile valable dans 15 pays d'Afrique de l'Ouest.",
  totalAPayer: "Montant total annuel à régler incluant la prime TTC et toutes les contributions obligatoires (FGA + CEDEAO).",
};

interface PremiumLineProps {
  label: string;
  value: string;
  tooltip: string;
  isBold?: boolean;
}

const PremiumLine = ({ label, value, tooltip, isBold }: PremiumLineProps) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-1.5">
      <span className={isBold ? "text-foreground font-medium" : "text-muted-foreground"}>{label}</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px] text-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    <span className={isBold ? "font-medium" : ""}>{value}</span>
  </div>
);

// Types pour les recommandations IA
interface AIRecommendation {
  id: string;
  text: string;
  savingsPercent: number;
  action: string;
}

// Génère une recommandation IA basée sur le profil
const generateRecommendation = (state: GuidedSalesState): AIRecommendation | null => {
  const { needsAnalysis, coverage } = state;
  const bonusMalus = needsAnalysis.bonusMalus || "bonus_0";
  
  // Recommandation basée sur le bonus
  if (bonusMalus.startsWith("bonus_") && bonusMalus !== "bonus_0") {
    const bonusLevel = parseInt(bonusMalus.replace("bonus_", ""));
    if (bonusLevel >= 20) {
      return {
        id: "franchise_increase",
        text: `Au vu du profil "Bon Conducteur" (Bonus ${bonusLevel}%), augmenter la franchise à 450 000 FCFA réduirait la prime de 15% sans risque majeur.`,
        savingsPercent: 15,
        action: "increase_franchise",
      };
    }
  }
  
  // Recommandation si le véhicule est ancien et le plan est premium
  if (needsAnalysis.vehicleFirstCirculationDate && coverage.planTier === "premium") {
    const vehicleYear = new Date(needsAnalysis.vehicleFirstCirculationDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicleYear;
    
    if (vehicleAge > 7) {
      return {
        id: "downgrade_plan",
        text: `Votre véhicule a ${vehicleAge} ans. Le plan "Standard" offrirait une couverture suffisante avec une économie de 28%.`,
        savingsPercent: 28,
        action: "downgrade_to_standard",
      };
    }
  }

  // Recommandation si pas d'assistance sélectionnée
  if (!coverage.assistanceLevel && coverage.planTier !== "basic") {
    return {
      id: "add_assistance",
      text: `Ajoutez l'option "Assistance Avantage" pour seulement 15 000 FCFA/an et bénéficiez d'un dépannage 24h/24.`,
      savingsPercent: 0,
      action: "add_avantage_assistance",
    };
  }

  // Recommandation par défaut si BNS neutre
  if (bonusMalus === "bonus_0" || bonusMalus === "neutre") {
    return {
      id: "bns_verification",
      text: `Vérifiez l'historique de conduite du client. Un bonus de 20% réduirait la prime de 20%.`,
      savingsPercent: 20,
      action: "check_bns",
    };
  }

  return null;
};

export const QuoteSummaryCard = ({ state, onNext, nextLabel, disabled, onApplySuggestion }: QuoteSummaryCardProps) => {
  const [displayTotal, setDisplayTotal] = useState(state.calculatedPremium.totalAPayer);
  const [suggestionApplied, setSuggestionApplied] = useState(false);

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
  
  // Génère la recommandation IA
  const recommendation = useMemo(() => generateRecommendation(state), [state]);

  const handleApplySuggestion = () => {
    if (recommendation && onApplySuggestion) {
      onApplySuggestion(recommendation);
      setSuggestionApplied(true);
      toast({
        title: "Suggestion appliquée",
        description: "Le devis a été mis à jour avec la recommandation IA.",
      });
    } else if (recommendation) {
      // Feedback visuel même sans handler
      setSuggestionApplied(true);
      toast({
        title: "Suggestion notée",
        description: "Appliquez manuellement les modifications suggérées.",
      });
    }
  };

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
        <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3 -mx-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">Prime Totale à payer</span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] text-xs">
                  <p>{tooltips.totalAPayer}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-primary">
            {formatFCFA(displayTotal)}
          </span>
        </div>

        <Separator />

        {/* Décompte détaillé */}
        <div className="space-y-2 text-sm">
          <PremiumLine 
            label="Prime Nette" 
            value={formatFCFADecimal(premium.primeNette)} 
            tooltip={tooltips.primeNette} 
          />
          <PremiumLine 
            label="Frais d'accessoires" 
            value={formatFCFADecimal(premium.fraisAccessoires)} 
            tooltip={tooltips.fraisAccessoires} 
          />
          <PremiumLine 
            label="Taxes (14,5%)" 
            value={formatFCFADecimal(premium.taxes)} 
            tooltip={tooltips.taxes} 
          />
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <PremiumLine 
            label="Prime TTC" 
            value={formatFCFADecimal(premium.primeTTC)} 
            tooltip={tooltips.primeTTC}
            isBold 
          />
          <PremiumLine 
            label="FGA" 
            value={formatFCFADecimal(premium.fga)} 
            tooltip={tooltips.fga} 
          />
          <PremiumLine 
            label="Carte Brune CEDEAO" 
            value={formatFCFADecimal(premium.cedeao)} 
            tooltip={tooltips.cedeao} 
          />
        </div>

        <Separator />

        {/* AI Recommendation Card */}
        {recommendation && !suggestionApplied && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Recommandation IA</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
                  {recommendation.text}
                </p>
                <button
                  onClick={handleApplySuggestion}
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline transition-colors"
                >
                  Appliquer la suggestion
                </button>
              </div>
            </div>
          </div>
        )}

        {suggestionApplied && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">Suggestion appliquée avec succès</p>
          </div>
        )}

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
