import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Home, Sparkles } from "lucide-react";
import { GuidedSalesState, SelectedProductType } from "../types";
import { formatFCFA } from "@/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UpsellSidebarProps {
  state: GuidedSalesState;
  onAccept: (offerId: string) => void;
  accepted: boolean;
}

const upsellConfigs: Record<SelectedProductType, {
  type: "micro-upsell" | "cross-sell";
  title: string;
  subtitle: string;
  productName: string;
  productDescription: string;
  features: { icon: typeof CheckCircle2; label: string }[];
  originalPrice: number;
  discountedPrice: number;
  discountPercent?: number;
  savings?: number;
  ctaAccept: string;
  ctaDecline: string;
}> = {
  auto: {
    type: "micro-upsell",
    title: "Offre spéciale",
    subtitle: "Une dernière opportunité exclusive.",
    productName: "Protection Corporelle du Conducteur",
    productDescription: "Ajoutez la Protection Corporelle du Conducteur pour vous couvrir en cas d'accident responsable.",
    features: [
      { icon: CheckCircle2, label: "Capital Décès/Invalidité : 10.000.000 FCFA" },
      { icon: CheckCircle2, label: "Frais médicaux : 500.000 FCFA" },
    ],
    originalPrice: 45000,
    discountedPrice: 25000,
    ctaAccept: "Ajouter en 1 clic",
    ctaDecline: "Non merci",
  },
  pack_obseques: {
    type: "cross-sell",
    title: "Avantage Client Privilégié",
    subtitle: "Remise exclusive sur l'assurance auto.",
    productName: "Assurance Auto",
    productDescription: "Parce que vous protégez votre famille, débloquez une remise de 10% sur votre assurance automobile.",
    features: [
      { icon: CheckCircle2, label: "Responsabilité Civile obligatoire incluse" },
      { icon: CheckCircle2, label: "Assistance 24/7" },
    ],
    originalPrice: 120000,
    discountedPrice: 108000,
    discountPercent: 10,
    savings: 12000,
    ctaAccept: "Profiter de cette offre",
    ctaDecline: "Non merci",
  },
};

export const UpsellSidebar = ({ state, onAccept, accepted }: UpsellSidebarProps) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const productType = state.productSelection.selectedProduct || "auto";
  const config = upsellConfigs[productType];
  const isCrossSell = config.type === "cross-sell";

  const handleAccept = async () => {
    setIsAccepting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Offre ajoutée à votre contrat !");
    onAccept(productType);
  };

  if (accepted) {
    return (
      <Card className="sticky top-20 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              Option ajoutée à votre contrat
            </p>
            <p className="text-sm text-muted-foreground">
              {config.productName}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dismissed) {
    return null;
  }

  return (
    <Card className="sticky top-20 overflow-hidden">
      {/* Header */}
      <div className={cn(
        "p-4 sm:p-5",
        isCrossSell
          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
          : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
      )}>
        <div className="flex items-center gap-2 mb-1">
          {isCrossSell ? <Sparkles className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          <span className="text-xs uppercase tracking-wider opacity-80">
            {config.title}
          </span>
        </div>
        <p className="text-sm opacity-90">{config.subtitle}</p>
      </div>

      <CardContent className="pt-5 space-y-4">
        {/* Product info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {isCrossSell ? <Home className="h-5 w-5 text-primary" /> : <Shield className="h-5 w-5 text-primary" />}
            <h4 className="font-semibold">{config.productName}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{config.productDescription}</p>
        </div>

        {/* Features */}
        <div className="space-y-2">
          {config.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="pt-2 border-t">
          {!isCrossSell && (
            <p className="text-sm text-muted-foreground line-through">
              {formatFCFA(config.originalPrice)}/an
            </p>
          )}
          <p className="text-xl font-bold">
            {isCrossSell ? formatFCFA(config.discountedPrice) : `+ ${formatFCFA(config.discountedPrice)}`}
            <span className="text-sm font-normal text-muted-foreground ml-1">/an</span>
          </p>
          {config.discountPercent && config.savings && (
            <Badge className="mt-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              -{config.discountPercent}% (Économie {formatFCFA(config.savings)})
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleAccept}
            className="w-full"
            disabled={isAccepting}
          >
            {isAccepting ? "Ajout en cours..." : config.ctaAccept}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="w-full text-muted-foreground"
            disabled={isAccepting}
          >
            {config.ctaDecline}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
