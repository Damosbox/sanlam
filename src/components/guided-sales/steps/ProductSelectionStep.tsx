import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Shield, Construction, Heart, Home, Plane, Umbrella, Info } from "lucide-react";
import { GuidedSalesState, ProductCategory, SelectedProductType } from "../types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductInfoSheet } from "../product-info/ProductInfoSheet";

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
  onShowInfo?: () => void;
}

const ProductCard = ({ icon, title, description, onSelect, disabled, comingSoon, onShowInfo }: ProductCardProps) => (
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
        <div className="w-full mt-auto space-y-2">
          {onShowInfo && (
            <Button variant="outline" size="sm" onClick={onShowInfo} className="w-full">
              <Info className="h-3.5 w-3.5 mr-1.5" />
              En savoir plus
            </Button>
          )}
          <Button onClick={onSelect} disabled={disabled} className="w-full">
            Démarrer le devis
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

// Product types that have dedicated sales flows (functional, not "en construction")
const FLOW_ENABLED_PRODUCTS = new Set(["auto", "pack_obseques"]);

const getIconForProduct = (productType: string | null, category: string) => {
  switch (productType) {
    case "auto": return <Car className="h-8 w-8 text-primary" />;
    case "pack_obseques": return <Shield className="h-8 w-8 text-primary" />;
    case "sante": return <Heart className="h-8 w-8 text-primary" />;
    case "habitation": case "mrh": return <Home className="h-8 w-8 text-primary" />;
    case "voyage": return <Plane className="h-8 w-8 text-primary" />;
    default: return category === "vie" 
      ? <Shield className="h-8 w-8 text-primary" /> 
      : <Umbrella className="h-8 w-8 text-primary" />;
  }
};

export const ProductSelectionStep = ({ state, onUpdate, onNext }: ProductSelectionStepProps) => {
  const [infoProduct, setInfoProduct] = useState<{ type: string; category: ProductCategory } | null>(null);
  const { data: dbProducts, isLoading } = useQuery({
    queryKey: ["products-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, category, product_type, is_active")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSelectProduct = (category: ProductCategory, product: SelectedProductType) => {
    onUpdate({ category, selectedProduct: product });
    onNext();
  };

  // Normalize category for comparison
  const isNonVie = (cat: string) => ["non-vie", "non_vie", "auto", "habitation"].includes(cat.toLowerCase());
  const isVie = (cat: string) => ["vie", "santé", "sante"].includes(cat.toLowerCase());

  // Split DB products by category
  const dbNonVie = (dbProducts ?? []).filter(p => isNonVie(p.category));
  const dbVie = (dbProducts ?? []).filter(p => isVie(p.category));

  // Check if DB already has products with these types (to avoid duplicate static cards)
  const hasAutoInDb = dbNonVie.some(p => p.product_type === "auto");
  const hasPackObsequesInDb = dbVie.some(p => p.product_type === "pack_obseques");

  const renderProductCard = (p: { id: string; name: string; description: string | null; product_type: string | null; category: string }) => (
    <ProductCard
      key={p.id}
      icon={getIconForProduct(p.product_type, p.category)}
      title={p.name}
      description={p.description || ""}
      onSelect={() => handleSelectProduct(
        isNonVie(p.category) ? "non-vie" : "vie",
        p.product_type ?? p.id
      )}
      comingSoon={!FLOW_ENABLED_PRODUCTS.has(p.product_type ?? "")}
      onShowInfo={
        FLOW_ENABLED_PRODUCTS.has(p.product_type ?? "")
          ? () => setInfoProduct({ type: p.product_type!, category: isNonVie(p.category) ? "non-vie" : "vie" })
          : undefined
      }
    />
  );

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
            {/* Static Auto fallback only if no DB product with product_type=auto */}
            {!hasAutoInDb && (
              <ProductCard
                icon={<Car className="h-8 w-8 text-primary" />}
                title="Assurance Auto"
                description="Assurance automobile tous risques ou responsabilité civile pour véhicules particuliers et professionnels"
                onSelect={() => handleSelectProduct("non-vie", "auto")}
                onShowInfo={() => setInfoProduct({ type: "auto", category: "non-vie" })}
              />
            )}
            {isLoading && <Skeleton className="h-64 rounded-lg" />}
            {dbNonVie.map(renderProductCard)}
          </div>
        </TabsContent>

        <TabsContent value="vie" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Static Pack Obsèques fallback only if no DB product with product_type=pack_obseques */}
            {!hasPackObsequesInDb && (
              <ProductCard
                icon={<Shield className="h-8 w-8 text-primary" />}
                title="Pack Obsèques"
                description="Garantit le versement d'un capital défini en cas de décès pour couvrir les frais funéraires"
                onSelect={() => handleSelectProduct("vie", "pack_obseques")}
                onShowInfo={() => setInfoProduct({ type: "pack_obseques", category: "vie" })}
              />
            )}
            {isLoading && <Skeleton className="h-64 rounded-lg" />}
            {dbVie.map(renderProductCard)}
          </div>
        </TabsContent>
      </Tabs>

      <ProductInfoSheet
        open={!!infoProduct}
        onClose={() => setInfoProduct(null)}
        productType={infoProduct?.type ?? null}
        onSelect={() => infoProduct && handleSelectProduct(infoProduct.category, infoProduct.type as SelectedProductType)}
      />
    </div>
  );
};
