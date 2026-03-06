import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Car, Shield, Calendar, HelpCircle, Save, Send, ChevronRight, Pencil } from "lucide-react";
import { GuidedSalesState, PlanTier, ContractPeriodicity } from "../types";
import { formatFCFA, formatFCFADecimal } from "@/utils/formatCurrency";
import { DiscountSelector, applyDiscounts } from "../DiscountSelector";
import { QuotationSaveDialog } from "../QuotationSaveDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RecapStepProps {
  state: GuidedSalesState;
  onSaveQuote: (clientInfo?: { firstName: string; lastName: string; email: string }) => void;
  onSubscribe: () => void;
  onEditStep: (step: number) => void;
}

const planNames: Record<PlanTier, string> = {
  mini: "TIERS SIMPLE",
  basic: "TIERS SIMPLE AMÉLIORÉ",
  medium: "TIERS COMPLET",
  medium_plus: "TIERS COMPLET",
  evolution: "TIERS RISQUES",
  evolution_plus: "TIERCE COLLISION",
  supreme: "SUPRÊME",
};

const periodicityLabels: Record<ContractPeriodicity, string> = {
  "1_month": "1 mois",
  "3_months": "3 mois",
  "6_months": "6 mois",
  "1_year": "12 mois",
};

const energyLabels: Record<string, string> = {
  essence: "Essence",
  gasoil: "Gasoil",
  hybride: "Hybride",
  electrique: "Électrique",
};

const tooltips = {
  primeNette: "Prime de base calculée selon la puissance fiscale, l'usage du véhicule, le nombre de places et les garanties sélectionnées.",
  fraisAccessoires: "Frais fixes de gestion et d'émission du contrat d'assurance.",
  taxes: "Taxes fiscales obligatoires représentant 14% de la prime nette, conformément à la réglementation CIMA.",
  primeTTC: "Prime Toutes Taxes Comprises = Prime Nette + Frais d'accessoires + Taxes.",
  fga: "Fond de Garantie Automobile : contribution obligatoire (2% de la prime nette, min. 5 000 FCFA).",
  cedeao: "Carte Brune CEDEAO : couverture responsabilité civile dans les 15 pays de la CEDEAO.",
  totalAPayer: "Montant total incluant la prime TTC et toutes les contributions obligatoires.",
};

const guaranteesByPlan: Record<PlanTier, string[]> = {
  mini: ["RC", "Recours Tiers Incendie", "Défense Recours", "IC/IPT"],
  basic: ["RC", "Recours Tiers Incendie", "Défense Recours", "IC/IPT", "Avance sur recours"],
  medium: ["RC", "Défense Recours", "IC/IPT", "Avance sur recours", "Incendie", "Vol accessoires", "Bris de glaces"],
  medium_plus: ["RC", "Défense Recours", "IC/IPT", "Avance sur recours", "Incendie", "Vol", "Vol à main armée", "Vol accessoires", "Bris de glaces"],
  evolution: ["RC", "Défense Recours", "IC/IPT", "Avance sur recours", "Incendie", "Vol", "Vol accessoires", "Bris de glaces", "Tierce complète plafonnée"],
  evolution_plus: ["RC", "Défense Recours", "IC/IPT", "Avance sur recours", "Incendie", "Vol", "Vol accessoires", "Bris de glaces", "Tierce collision plafonnée"],
  supreme: ["RC", "Défense Recours", "IC/IPT", "Avance sur recours (gratuit)", "Incendie", "Vol", "Vol accessoires", "Bris de glaces (gratuit)", "Tierce complète non plafonnée"],
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
      <span className={isBold ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
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
    <span className={isBold ? "font-semibold" : ""}>{value}</span>
  </div>
);

const SectionHeader = ({ icon: Icon, title, onEdit }: { icon: React.ElementType; title: string; onEdit?: () => void }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
    {onEdit && (
      <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1.5 text-muted-foreground hover:text-primary">
        <Pencil className="h-3.5 w-3.5" />
        Modifier
      </Button>
    )}
  </div>
);

export const RecapStep = ({ state, onSaveQuote, onSubscribe, onEditStep }: RecapStepProps) => {
  const { needsAnalysis, coverage, calculatedPremium } = state;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"save" | "send">("save");
  const [bns, setBns] = useState(0);
  const [commercial, setCommercial] = useState(0);

  const adjustedPremium = useMemo(() => {
    const discountedNette = applyDiscounts(calculatedPremium.primeNette, bns, commercial);
    const totalDiscount = calculatedPremium.primeNette - discountedNette;
    const taxes = Math.round(discountedNette * 0.145);
    const primeTTC = discountedNette + calculatedPremium.fraisAccessoires + taxes;
    const totalAPayer = primeTTC + calculatedPremium.fga + calculatedPremium.cedeao;
    return { discountedNette, totalDiscount, taxes, primeTTC, totalAPayer };
  }, [calculatedPremium, bns, commercial]);

  const defaultDialogValues = {
    lastName: state.clientIdentification.lastName || "",
    firstName: state.clientIdentification.firstName || "",
    email: state.clientIdentification.email || "",
  };

  const openDialog = (mode: "save" | "send") => {
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const handleDialogConfirm = (info: { lastName: string; firstName: string; email: string; channel?: string }) => {
    onSaveQuote({ firstName: info.firstName, lastName: info.lastName, email: info.email });
    if (info.channel) {
      toast.success("Cotation envoyée avec succès", {
        description: `Envoyée par ${info.channel} à ${info.email}`,
      });
    } else {
      toast.success("Cotation sauvegardée avec succès");
    }
  };

  const effectiveDate = needsAnalysis.effectiveDate ? new Date(needsAnalysis.effectiveDate) : null;
  const selectedPeriodicity = needsAnalysis.contractPeriodicity || "1_year";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Récapitulatif du devis</h1>
        <p className="text-muted-foreground mt-1">
          Vérifiez les informations avant de poursuivre
        </p>
      </div>

      {/* Véhicule */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader icon={Car} title="Véhicule" onEdit={() => onEditStep(1)} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {needsAnalysis.vehicleBrand && (
              <div>
                <span className="text-muted-foreground">Marque</span>
                <p className="font-medium">{needsAnalysis.vehicleBrand}</p>
              </div>
            )}
            {needsAnalysis.vehicleModel && (
              <div>
                <span className="text-muted-foreground">Modèle</span>
                <p className="font-medium">{needsAnalysis.vehicleModel}</p>
              </div>
            )}
            {needsAnalysis.vehicleFiscalPower && (
              <div>
                <span className="text-muted-foreground">Puissance fiscale</span>
                <p className="font-medium">{needsAnalysis.vehicleFiscalPower} CV</p>
              </div>
            )}
            {needsAnalysis.vehicleEnergy && (
              <div>
                <span className="text-muted-foreground">Énergie</span>
                <p className="font-medium">{energyLabels[needsAnalysis.vehicleEnergy] || needsAnalysis.vehicleEnergy}</p>
              </div>
            )}
            {needsAnalysis.vehicleVenalValue && (
              <div>
                <span className="text-muted-foreground">Valeur vénale</span>
                <p className="font-medium">{formatFCFA(needsAnalysis.vehicleVenalValue)}</p>
              </div>
            )}
            {needsAnalysis.vehicleNewValue && (
              <div>
                <span className="text-muted-foreground">Valeur à neuf</span>
                <p className="font-medium">{formatFCFA(needsAnalysis.vehicleNewValue)}</p>
              </div>
            )}
            {needsAnalysis.vehicleSeats && (
              <div>
                <span className="text-muted-foreground">Places</span>
                <p className="font-medium">{needsAnalysis.vehicleSeats}</p>
              </div>
            )}
            {needsAnalysis.vehicleFirstCirculationDate && (
              <div>
                <span className="text-muted-foreground">1ère mise en circulation</span>
                <p className="font-medium">
                  {format(new Date(needsAnalysis.vehicleFirstCirculationDate), "dd/MM/yyyy")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formule sélectionnée */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader icon={Shield} title="Formule sélectionnée" onEdit={() => onEditStep(2)} />
          <div className="flex items-center gap-3 mb-4">
            <Badge className="text-base px-4 py-1.5">{planNames[coverage.planTier]}</Badge>
            {coverage.assistanceLevel && (
              <Badge variant="secondary">{coverage.assistanceLevel}</Badge>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground font-medium mb-2">Garanties incluses :</p>
            <div className="grid grid-cols-2 gap-2">
              {guaranteesByPlan[coverage.planTier].map((g) => (
                <div key={g} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-sm">{g}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Durée & Date d'effet */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader icon={Calendar} title="Durée & Date d'effet" onEdit={() => onEditStep(2)} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Durée du contrat</span>
              <p className="font-medium">{periodicityLabels[selectedPeriodicity]}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date d'effet</span>
              <p className="font-medium">
                {effectiveDate ? format(effectiveDate, "PPP", { locale: fr }) : "Non définie"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Réductions */}
      <DiscountSelector bns={bns} commercial={commercial} onBnsChange={setBns} onCommercialChange={setCommercial} />

      {/* Décompte de prime */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">Décompte de prime</h3>
          
          <div className="space-y-2 text-sm">
            <PremiumLine label="Prime Nette (avant réductions)" value={formatFCFADecimal(calculatedPremium.primeNette)} tooltip={tooltips.primeNette} />
            {(bns > 0 || commercial > 0) && (
              <>
                {bns > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">BNS (-{bns}%)</span>
                    <span className="text-sm">-{formatFCFADecimal(calculatedPremium.primeNette * bns / 100)}</span>
                  </div>
                )}
                {commercial > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Réduction commerciale (-{commercial}%)</span>
                    <span className="text-sm">-{formatFCFADecimal(adjustedPremium.totalDiscount - (bns > 0 ? calculatedPremium.primeNette * bns / 100 : 0))}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-medium border-t border-dashed pt-1">
                  <span className="text-sm">Prime Nette après réductions</span>
                  <span className="text-sm">{formatFCFADecimal(adjustedPremium.discountedNette)}</span>
                </div>
              </>
            )}
            <PremiumLine label="Frais d'accessoires" value={formatFCFADecimal(calculatedPremium.fraisAccessoires)} tooltip={tooltips.fraisAccessoires} />
            <PremiumLine label="Taxes (14,5%)" value={formatFCFADecimal(adjustedPremium.taxes)} tooltip={tooltips.taxes} />
          </div>

          <Separator className="my-3" />

          <div className="space-y-2 text-sm">
            <PremiumLine label="Prime TTC" value={formatFCFADecimal(adjustedPremium.primeTTC)} tooltip={tooltips.primeTTC} isBold />
            <PremiumLine label="FGA" value={formatFCFADecimal(calculatedPremium.fga)} tooltip={tooltips.fga} />
            <PremiumLine label="Carte Brune CEDEAO" value={formatFCFADecimal(calculatedPremium.cedeao)} tooltip={tooltips.cedeao} />
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between bg-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground">Total à payer</span>
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
            <span className="text-2xl font-bold text-primary">{formatFCFA(adjustedPremium.totalAPayer)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => openDialog("save")} className="gap-2 flex-1">
          <Save className="h-4 w-4" />
          Sauvegarder
        </Button>
        <Button variant="outline" onClick={() => openDialog("send")} className="gap-2 flex-1">
          <Send className="h-4 w-4" />
          Envoyer
        </Button>
        <Button onClick={onSubscribe} className="gap-2 flex-1">
          SOUSCRIRE
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <QuotationSaveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        defaultValues={defaultDialogValues}
        onConfirm={handleDialogConfirm}
      />
    </div>
  );
};
