import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  category: string;
  base_premium: number;
  description: string;
  coverages: Record<string, { included: boolean; limit?: string; description?: string }>;
}

const categories = [
  { value: "Auto", label: "Auto" },
  { value: "Santé", label: "Santé" },
  { value: "Habitation", label: "Habitation" },
  { value: "Électronique", label: "Électronique" },
  { value: "Agricole", label: "Agricole" },
  { value: "Épargne", label: "Épargne" },
];

export function ProductComparator() {
  const [selectedCategory, setSelectedCategory] = useState("Auto");
  const [productsToCompare, setProductsToCompare] = useState<string[]>([]);
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", selectedCategory)
        .eq("is_active", true);
      
      if (error) throw error;
      return data?.map(product => ({
        ...product,
        coverages: product.coverages as Record<string, { included: boolean; limit?: string; description?: string }>
      })) as Product[];
    },
  });

  const toggleProductComparison = (productId: string) => {
    setProductsToCompare((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, productId];
    });
  };

  const comparedProducts = products?.filter((p) => productsToCompare.includes(p.id)) || [];
  
  // Get all unique coverage keys from compared products
  const allCoverageKeys = Array.from(
    new Set(
      comparedProducts.flatMap((p) => Object.keys(p.coverages))
    )
  );

  const handleSubscribe = (productId: string) => {
    navigate("/b2c", { state: { productId, tab: "subscribe" } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Comparez nos offres</h2>
        <p className="text-muted-foreground">
          Sélectionnez jusqu'à 3 produits pour les comparer côte à côte
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={(value) => {
        setSelectedCategory(value);
        setProductsToCompare([]);
      }}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.value} value={cat.value} className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Product Selection Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {products?.map((product) => (
                    <Card key={product.id} className={productsToCompare.includes(product.id) ? "ring-2 ring-primary" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl">{product.name}</CardTitle>
                            <CardDescription className="mt-1">{product.description}</CardDescription>
                          </div>
                          <Checkbox
                            checked={productsToCompare.includes(product.id)}
                            onCheckedChange={() => toggleProductComparison(product.id)}
                            disabled={!productsToCompare.includes(product.id) && productsToCompare.length >= 3}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <div className="text-3xl font-bold text-primary">
                            {product.base_premium.toLocaleString()} FCFA
                          </div>
                          <div className="text-sm text-muted-foreground">par mois</div>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(product.coverages).slice(0, 3).map(([key, coverage]) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              {coverage.included ? (
                                <Check className="h-4 w-4 text-green-500 shrink-0" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className={coverage.included ? "" : "text-muted-foreground"}>
                                {coverage.description || key}
                              </span>
                            </div>
                          ))}
                          {Object.keys(product.coverages).length > 3 && (
                            <div className="text-sm text-muted-foreground">
                              +{Object.keys(product.coverages).length - 3} autres garanties
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => handleSubscribe(product.id)} className="w-full">
                          Souscrire
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                {/* Comparison Table */}
                {comparedProducts.length >= 2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tableau comparatif</CardTitle>
                      <CardDescription>
                        Comparaison détaillée de vos {comparedProducts.length} produits sélectionnés
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Garanties</TableHead>
                              {comparedProducts.map((product) => (
                                <TableHead key={product.id} className="text-center">
                                  <div className="font-semibold">{product.name}</div>
                                  <div className="text-sm font-normal text-muted-foreground">
                                    {product.base_premium.toLocaleString()} FCFA/mois
                                  </div>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allCoverageKeys.map((key) => {
                              const isHighlighted = comparedProducts.some(
                                (p) => p.coverages[key]?.included
                              ) && !comparedProducts.every(
                                (p) => p.coverages[key]?.included
                              );
                              
                              return (
                                <TableRow key={key} className={isHighlighted ? "bg-accent/50" : ""}>
                                  <TableCell className="font-medium">
                                    {comparedProducts[0]?.coverages[key]?.description || key}
                                  </TableCell>
                                  {comparedProducts.map((product) => {
                                    const coverage = product.coverages[key];
                                    return (
                                      <TableCell key={product.id} className="text-center">
                                        {coverage?.included ? (
                                          <div>
                                            <Check className="h-5 w-5 text-green-500 mx-auto mb-1" />
                                            {coverage.limit && (
                                              <Badge variant="secondary" className="text-xs">
                                                {coverage.limit}
                                              </Badge>
                                            )}
                                          </div>
                                        ) : (
                                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              );
                            })}
                            <TableRow className="bg-muted/50">
                              <TableCell className="font-semibold">Actions</TableCell>
                              {comparedProducts.map((product) => (
                                <TableCell key={product.id} className="text-center">
                                  <Button 
                                    onClick={() => handleSubscribe(product.id)}
                                    size="sm"
                                  >
                                    Souscrire
                                  </Button>
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
