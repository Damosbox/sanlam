import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Heart, Car } from "lucide-react";
import { GuidedSalesState, SelectedProductType } from "../types";
import { useNavigate } from "react-router-dom";

interface CrossSellSidebarProps {
  state: GuidedSalesState;
}

const crossSellMap: Record<SelectedProductType, {
  id: string;
  name: string;
  description: string;
  priceFrom: string;
  icon: typeof Car;
  product: string;
}[]> = {
  auto: [
    {
      id: "habitation",
      name: "Assurance Habitation",
      description: "Sécurisez votre logement et vos biens contre les risques du quotidien.",
      priceFrom: "35 000 FCFA/an",
      icon: Home,
      product: "habitation",
    },
    {
      id: "pack_obseques",
      name: "Pack Obsèques",
      description: "Anticipez et protégez vos proches avec une couverture obsèques complète.",
      priceFrom: "5 000 FCFA/mois",
      icon: Heart,
      product: "pack_obseques",
    },
  ],
  pack_obseques: [
    {
      id: "auto",
      name: "Assurance Auto",
      description: "Protégez votre véhicule avec une couverture adaptée à vos besoins.",
      priceFrom: "45 000 FCFA/an",
      icon: Car,
      product: "auto",
    },
    {
      id: "habitation",
      name: "Assurance Habitation",
      description: "Sécurisez votre logement et vos biens contre les risques du quotidien.",
      priceFrom: "35 000 FCFA/an",
      icon: Home,
      product: "habitation",
    },
  ],
};

export const UpsellSidebar = ({ state }: CrossSellSidebarProps) => {
  const navigate = useNavigate();
  const productType = state.productSelection.selectedProduct || "auto";
  const products = crossSellMap[productType] || crossSellMap.auto;

  const handleCrossSell = (product: string) => {
    navigate(`/broker/guided-sales?product=${product}`);
  };

  return (
    <Card className="sticky top-20">
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-1">Découvrez nos autres produits</h3>
        <p className="text-sm text-muted-foreground mb-4">Complétez la protection de votre client</p>
        <div className="space-y-4">
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <div key={product.id} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{product.name}</h4>
                    <p className="text-xs text-muted-foreground">À partir de {product.priceFrom}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleCrossSell(product.product)}>
                  En savoir plus
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
