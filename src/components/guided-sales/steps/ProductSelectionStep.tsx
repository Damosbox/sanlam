import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Heart, Landmark, Construction, Home, Plane } from "lucide-react";
import { GuidedSalesState, ProductCategory, SelectedProductType } from "../types";

interface ProductSelectionStepProps {
  state: GuidedSalesState;
  onUpdate: (data: { category: ProductCategory; selectedProduct: SelectedProductType }) => void;
  onNext: () => void;
}

interface ProductCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onSelect: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

const ProductCard = ({ icon, title, description, onSelect, disabled, comingSoon }: ProductCardProps) => (
  <Card className="bg-blue-50 dark:bg-blue-950/30 border-0 hover:shadow-lg transition-all duration-300 group h-full">
    <CardContent className="p-6 flex flex-col items-center text-center gap-4 h-full">
      <div className="w-16 h-16 rounded-full bg-white dark:bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-grow">
        <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {comingSoon ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm mt-auto">
          <Construction className="h-4 w-4" />
          <span>Parcours en construction</span>
        </div>
      ) : (
        <Button 
          onClick={onSelect} 
          disabled={disabled}
          className="w-full mt-auto"
        >
          Démarrer le devis
        </Button>
      )}
    </CardContent>
  </Card>
);

export const ProductSelectionStep = ({ state, onUpdate, onNext }: ProductSelectionStepProps) => {
  const handleSelectProduct = (category: ProductCategory, product: SelectedProductType) => {
    onUpdate({ category, selectedProduct: product });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sélection du produit</h1>
        <p className="text-muted-foreground mt-1">
          Choisissez le type d'assurance pour votre client
        </p>
      </div>

      <Tabs defaultValue="non-vie" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="non-vie" className="text-base">Non-Vie</TabsTrigger>
          <TabsTrigger value="vie" className="text-base">Vie</TabsTrigger>
        </TabsList>

        <TabsContent value="non-vie" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ProductCard
              icon={<Car className="h-8 w-8 text-primary" />}
              title="Assurance Auto"
              description="Assurance automobile tous risques ou responsabilité civile pour véhicules particuliers et professionnels"
              onSelect={() => handleSelectProduct("non-vie", "auto")}
            />
            <ProductCard
              icon={<Home className="h-8 w-8 text-primary" />}
              title="Multirisque Habitation"
              description="Protection complète de votre logement et de vos biens contre les risques locatifs et dommages"
              onSelect={() => handleSelectProduct("non-vie", "mrh")}
            />
            <ProductCard
              icon={<Plane className="h-8 w-8 text-primary" />}
              title="Assistance Voyage"
              description="Couverture médicale et assistance rapatriement pour vos déplacements à l'étranger"
              onSelect={() => handleSelectProduct("non-vie", "assistance_voyage")}
            />
          </div>
        </TabsContent>

        <TabsContent value="vie" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ProductCard
              icon={<Heart className="h-8 w-8 text-primary" />}
              title="Molo Molo"
              description="Contrat d'épargne et de prévoyance pour sécuriser votre avenir et celui de votre famille"
              onSelect={() => handleSelectProduct("vie", "molo_molo")}
            />
            <ProductCard
              icon={<Landmark className="h-8 w-8 text-primary" />}
              title="Pack Obsèques"
              description="Garantit le versement d'un capital défini en cas de décès pour couvrir les frais funéraires"
              onSelect={() => handleSelectProduct("vie", "pack_obseques")}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
