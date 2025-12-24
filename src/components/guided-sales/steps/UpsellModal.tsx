import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Shield, Home, Sparkles, Star } from "lucide-react";
import { GuidedSalesState, SelectedProductType } from "../types";
import { formatFCFA } from "@/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UpsellModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: (offerId: string) => void;
  state: GuidedSalesState;
}

// Configuration des offres d'upsell par produit
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
    title: "Félicitations pour votre nouvelle assurance auto !",
    subtitle: "Une dernière opportunité exclusive avant de terminer.",
    productName: "Protection Corporelle du Conducteur",
    productDescription: "Le pack protège votre véhicule. Ajoutez la Protection Corporelle du Conducteur pour vous couvrir en cas d'accident responsable.",
    features: [
      { icon: CheckCircle2, label: "Capital Décès/Invalidité : 10.000.000 FCFA" },
      { icon: CheckCircle2, label: "Frais médicaux : 500.000 FCFA" },
    ],
    originalPrice: 45000,
    discountedPrice: 25000,
    ctaAccept: "Ajouter à mon contrat en 1 clic",
    ctaDecline: "Non merci, terminer",
  },
  molo_molo: {
    type: "cross-sell",
    title: "Tout est en ordre ! Vos documents ont été envoyés.",
    subtitle: "Avantage Client Privilégié",
    productName: "Pack Obsèques Famille",
    productDescription: "Parce que vous nous faites confiance pour votre épargne, débloquez une remise immédiate de 15% sur le Pack Obsèques.",
    features: [
      { icon: CheckCircle2, label: "Protection obsèques pour toute la famille" },
      { icon: CheckCircle2, label: "Rapatriement du corps inclus" },
    ],
    originalPrice: 300000,
    discountedPrice: 255000,
    discountPercent: 15,
    savings: 45000,
    ctaAccept: "Profiter de cette offre maintenant",
    ctaDecline: "Non merci, terminer",
  },
  pack_obseques: {
    type: "cross-sell",
    title: "Tout est en ordre ! Vos documents ont été envoyés.",
    subtitle: "Avantage Client Privilégié",
    productName: "Épargne Molo Molo",
    productDescription: "Parce que vous protégez votre famille, débloquez une remise de 10% sur votre première année d'épargne Molo Molo.",
    features: [
      { icon: CheckCircle2, label: "Épargne garantie à taux fixe" },
      { icon: CheckCircle2, label: "Capital décès inclus" },
    ],
    originalPrice: 120000,
    discountedPrice: 108000,
    discountPercent: 10,
    savings: 12000,
    ctaAccept: "Profiter de cette offre maintenant",
    ctaDecline: "Non merci, terminer",
  },
  mrh: {
    type: "micro-upsell",
    title: "Félicitations pour votre assurance habitation !",
    subtitle: "Une opportunité exclusive pour vous.",
    productName: "Extension Objets de Valeur",
    productDescription: "Protégez vos bijoux, œuvres d'art et objets précieux avec une couverture dédiée.",
    features: [
      { icon: CheckCircle2, label: "Couverture jusqu'à 5.000.000 FCFA" },
      { icon: CheckCircle2, label: "Vol et dommages accidentels inclus" },
    ],
    originalPrice: 65000,
    discountedPrice: 45000,
    ctaAccept: "Ajouter à mon contrat en 1 clic",
    ctaDecline: "Non merci, terminer",
  },
  assistance_voyage: {
    type: "cross-sell",
    title: "Bon voyage ! Vos documents sont prêts.",
    subtitle: "Avantage Voyageur Privilégié",
    productName: "Multirisque Habitation - Pack Essentiel",
    productDescription: "Protégez votre foyer pendant votre absence avec une remise de 20% sur votre assurance habitation.",
    features: [
      { icon: CheckCircle2, label: "Responsabilité Civile Chef de Famille" },
      { icon: CheckCircle2, label: "Contenu assuré jusqu'à 5M FCFA" },
    ],
    originalPrice: 80000,
    discountedPrice: 64000,
    discountPercent: 20,
    savings: 16000,
    ctaAccept: "Profiter de cette offre maintenant",
    ctaDecline: "Non merci, terminer",
  },
};

export const UpsellModal = ({ open, onClose, onAccept, state }: UpsellModalProps) => {
  const [isAccepting, setIsAccepting] = useState(false);
  
  const productType = state.productSelection.selectedProduct || "auto";
  const config = upsellConfigs[productType];
  
  const handleAccept = async () => {
    setIsAccepting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Offre ajoutée à votre contrat !");
    onAccept(productType);
  };

  const isCrossSell = config.type === "cross-sell";
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {config.title}
          </DialogTitle>
          {isCrossSell && (
            <p className="text-center text-muted-foreground text-sm mt-1">
              {config.subtitle}
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          {/* Micro-Upsell Style */}
          {!isCrossSell && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                {config.subtitle}
              </p>
              
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4 pb-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    {config.productName}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {config.productDescription}
                  </p>
                  <div className="space-y-2">
                    {config.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="font-medium">{feature.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground line-through">
                  Au lieu de {formatFCFA(config.originalPrice)}/an
                </p>
                <p className="text-lg font-bold text-blue-600">
                  Offre spéciale aujourd'hui : + {formatFCFA(config.discountedPrice)} /an
                </p>
              </div>
            </>
          )}
          
          {/* Cross-Sell Style */}
          {isCrossSell && (
            <>
              <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      Avantage Client Privilégié
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.productDescription}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">{config.productName}</h4>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    Protégez votre foyer contre l'incendie, le vol et les dégâts des eaux.
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {config.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{feature.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {formatFCFA(config.discountedPrice)} <span className="text-base font-normal text-muted-foreground">/an</span>
                    </p>
                    {config.discountPercent && config.savings && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        -{config.discountPercent}% Appliqué (Économie de {formatFCFA(config.savings)})
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Action Buttons */}
          <div className={cn(
            "flex gap-3 pt-2",
            isCrossSell ? "flex-row" : "flex-col-reverse sm:flex-row"
          )}>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isAccepting}
            >
              {config.ctaDecline}
            </Button>
            <Button
              onClick={handleAccept}
              className={cn(
                "flex-1",
                isCrossSell ? "bg-blue-600 hover:bg-blue-700" : "bg-primary"
              )}
              disabled={isAccepting}
            >
              {isAccepting ? "Ajout en cours..." : config.ctaAccept}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
