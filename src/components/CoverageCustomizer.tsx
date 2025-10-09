import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Info, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Coverage {
  included: boolean;
  limit?: string;
  description?: string;
  optional?: boolean;
  price_modifier?: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  base_premium: number;
  description: string;
  coverages: Record<string, Coverage>;
}

interface CoverageCustomizerProps {
  product: Product;
  onCustomizationComplete: (customizedProduct: Product, selectedCoverages: Record<string, Coverage>) => void;
  onBack: () => void;
}

export function CoverageCustomizer({ product, onCustomizationComplete, onBack }: CoverageCustomizerProps) {
  const [selectedCoverages, setSelectedCoverages] = useState<Record<string, Coverage>>(() => {
    // Initialize with all included coverages from the base product
    const initial: Record<string, Coverage> = {};
    Object.entries(product.coverages).forEach(([key, coverage]) => {
      if (coverage.included) {
        initial[key] = { ...coverage };
      }
    });
    return initial;
  });

  const [calculatedPremium, setCalculatedPremium] = useState<{
    monthly: number;
    annual: number;
    breakdown?: any;
  } | null>(null);

  // Mutation for calculating premium via edge function
  const calculatePremiumMutation = useMutation({
    mutationFn: async (coverages: Record<string, Coverage>) => {
      const { data, error } = await supabase.functions.invoke('calculate-premium', {
        body: {
          product_id: product.id,
          base_premium: product.base_premium,
          selected_coverages: coverages,
          // user_profile can be added later for more accurate pricing
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCalculatedPremium({
        monthly: data.monthly_premium,
        annual: data.annual_premium,
        breakdown: data.breakdown
      });
    },
  });

  // Debounced calculation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      calculatePremiumMutation.mutate(selectedCoverages);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedCoverages]);

  const toggleCoverage = (key: string, coverage: Coverage) => {
    setSelectedCoverages((prev) => {
      const newCoverages = { ...prev };
      if (newCoverages[key]) {
        // If it's optional and already included, we can remove it
        if (coverage.optional) {
          delete newCoverages[key];
        }
      } else {
        // Add the coverage
        newCoverages[key] = { ...coverage, included: true };
      }
      return newCoverages;
    });
  };

  // Calculate estimated premium (fallback if API fails)
  const calculateEstimatedPremium = useCallback(() => {
    let total = product.base_premium;
    Object.values(selectedCoverages).forEach((coverage) => {
      if (coverage.price_modifier) {
        total += coverage.price_modifier;
      }
    });
    return total;
  }, [product.base_premium, selectedCoverages]);

  const handleContinue = () => {
    const customizedProduct: Product = {
      ...product,
      coverages: selectedCoverages,
    };
    onCustomizationComplete(customizedProduct, selectedCoverages);
  };

  const estimatedPremium = calculatedPremium?.monthly || calculateEstimatedPremium();
  const annualPremium = calculatedPremium?.annual || (estimatedPremium * 12);
  const selectedCount = Object.keys(selectedCoverages).length;
  const totalCount = Object.keys(product.coverages).length;
  const isCalculating = calculatePremiumMutation.isPending;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Column - Product Info & Coverage Selection */}
      <div className="lg:col-span-2 space-y-6">
        {/* Product Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{product.category}</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Coverage Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Personnalisez vos garanties</CardTitle>
            <CardDescription>
              Choisissez les garanties qui correspondent à vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(product.coverages).map(([key, coverage]) => {
              const isSelected = !!selectedCoverages[key];
              const isRequired = coverage.included && !coverage.optional;

              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  } ${isRequired ? "opacity-100" : "hover:border-primary/50"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {coverage.description || key}
                        </h4>
                        {isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            Obligatoire
                          </Badge>
                        )}
                        {coverage.optional && (
                          <Badge variant="outline" className="text-xs">
                            Optionnel
                          </Badge>
                        )}
                      </div>
                      {coverage.limit && (
                        <p className="text-sm text-muted-foreground">
                          Limite : <span className="font-medium">{coverage.limit}</span>
                        </p>
                      )}
                      {coverage.price_modifier && coverage.price_modifier > 0 && (
                        <p className="text-sm text-primary font-medium">
                          +{coverage.price_modifier.toLocaleString()} FCFA/mois
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{coverage.description || "Aucune description disponible"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => toggleCoverage(key, coverage)}
                        disabled={isRequired}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Summary */}
      <div className="space-y-6">
        <Card className="sticky top-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
            <CardDescription>Votre offre personnalisée</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Premium Display */}
            <div className="text-center py-4 relative">
              {isCalculating && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              <div className="text-4xl font-bold text-primary mb-2">
                {estimatedPremium.toLocaleString()} FCFA
              </div>
              <p className="text-sm text-muted-foreground">par mois</p>
              <p className="text-xs text-muted-foreground mt-1">
                Soit {annualPremium.toLocaleString()} FCFA/an
              </p>
            </div>

            <Separator />

            {/* Breakdown Details */}
            {calculatedPremium?.breakdown && (
              <>
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Détail du calcul</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prime de base</span>
                      <span className="font-medium">
                        {calculatedPremium.breakdown.base_premium.toLocaleString()} FCFA
                      </span>
                    </div>
                    
                    {calculatedPremium.breakdown.coverage_adjustments.map((adj: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          {adj.description}
                        </span>
                        <span className="text-primary font-medium">
                          +{adj.amount.toLocaleString()} FCFA
                        </span>
                      </div>
                    ))}

                    {calculatedPremium.breakdown.profile_adjustments.map((adj: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          {adj.amount > 0 ? (
                            <TrendingUp className="h-3 w-3 text-orange-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-green-500" />
                          )}
                          {adj.description}
                        </span>
                        <span className={adj.amount > 0 ? "text-orange-500 font-medium" : "text-green-500 font-medium"}>
                          {adj.amount > 0 ? '+' : ''}{adj.amount.toLocaleString()} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Coverage Count */}
            <div>
              <h4 className="font-semibold mb-3">Garanties sélectionnées</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <Badge variant="secondary">
                    {selectedCount} / {totalCount}
                  </Badge>
                </div>
                {Object.entries(selectedCoverages).map(([key, coverage]) => (
                  <div key={key} className="flex items-start gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="flex-1">{coverage.description || key}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button onClick={handleContinue} className="w-full" size="lg">
                Continuer
              </Button>
              <Button onClick={onBack} variant="outline" className="w-full">
                Retour
              </Button>
            </div>

            {/* Info Note */}
            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              {isCalculating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Calcul en cours...
                </span>
              ) : (
                <>💡 Prix calculé en temps réel selon vos garanties sélectionnées</>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
