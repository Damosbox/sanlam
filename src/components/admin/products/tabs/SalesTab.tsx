import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ProductFormData } from "../ProductForm";

interface SalesTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

export function SalesTab({ formData, updateField }: SalesTabProps) {
  const { data: allProducts } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, is_active")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const otherProducts = allProducts?.filter((p) => p.id !== formData.name) || [];

  const toggleOptional = (productId: string) => {
    const current = formData.optional_products || [];
    if (current.includes(productId)) {
      updateField(
        "optional_products",
        current.filter((id) => id !== productId)
      );
    } else {
      updateField("optional_products", [...current, productId]);
    }
  };

  const toggleAlternative = (productId: string) => {
    const current = formData.alternative_products || [];
    if (current.includes(productId)) {
      updateField(
        "alternative_products",
        current.filter((id) => id !== productId)
      );
    } else {
      updateField("alternative_products", [...current, productId]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Produits optionnels</CardTitle>
          <CardDescription>
            Produits proposés en complément du produit principal (add-ons, options).
            Exemple : Assistance dépannage 24/7 pour une assurance auto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {otherProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun autre produit disponible.
            </p>
          ) : (
            <div className="space-y-3">
              {otherProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.optional_products?.includes(product.id)}
                      onCheckedChange={() => toggleOptional(product.id)}
                    />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <Badge variant="outline" className="mt-1">
                        {product.category === "vie" ? "Vie" : "Non-Vie"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produits alternatifs</CardTitle>
          <CardDescription>
            Produits substituables au produit principal. Utile pour guider le client 
            vers une autre offre si ce produit ne correspond pas à ses besoins ou budget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {otherProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun autre produit disponible.
            </p>
          ) : (
            <div className="space-y-3">
              {otherProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.alternative_products?.includes(product.id)}
                      onCheckedChange={() => toggleAlternative(product.id)}
                    />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <Badge variant="outline" className="mt-1">
                        {product.category === "vie" ? "Vie" : "Non-Vie"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
